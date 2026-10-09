"""业务返回入口：只使用服务器保存的来源，不接受客户端声明完成或合格。"""
from typing import Any
from uuid import uuid4
from datetime import datetime, timezone
from hashlib import sha256
import json
from urllib.error import HTTPError
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from app.api.team_auth import team_actor, require_assignee
from app.common.serialization import _serialize_agent_result
from app.runtime.event_store import EventResultConflict
from app.runtime.durable_store import PendingResultError
from app.runtime.policy import RuntimePolicy
from app.api.maintenance_plans import deleted_maintenance_plan_ids
from app.clients.backend import BackendServiceError
from shared.part_design_quality import SCOPE, build_design_reference


class InspectionInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    part: dict[str, Any]
    design_run_id: str = Field(default='', max_length=67)


class SavedReportRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    plan_id: str = ''
    workorder_id: str = ''
    quality_check_id: str = ''


class PlanRetryRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    request_id: str = Field(min_length=1,max_length=128,pattern=r'^[A-Za-z0-9_-]+$')


def build_business_return_router(runtime, event_results, require_write_auth):
    router = APIRouter()
    from app.api.workorder_plan_revalidation import build_workorder_plan_revalidation_router
    router.include_router(build_workorder_plan_revalidation_router(runtime, event_results, require_write_auth))

    @router.post('/api/maintenance/plans/{plan_id}/retry', dependencies=[Depends(require_write_auth)])
    def retry_saved_plan(plan_id: str, body: PlanRetryRequest, request: Request):
        actor = team_actor(request)
        results, _ = event_results.list_plan_results()
        source = next((item for item in results if (item.get('maintenance_plan') or {}).get('plan_id') == plan_id), None)
        try:
            deleted = deleted_maintenance_plan_ids(event_results)
        except BackendServiceError:
            raise HTTPException(503, '方案与工单删除状态暂无法核对，未重新派工') from None
        if not source or plan_id in deleted:
            raise HTTPException(404, '维修方案不存在或已移除')
        event = dict(source.get('event') or {})
        device_id, event_id = str(event.get('device_id') or ''), str(event.get('event_id') or '')
        if not device_id or not event_id:
            raise HTTPException(409, '历史方案缺少设备或故障事件归属，请从监控中心重新诊断')
        key = json.dumps(['maintenance-retry',event.get('tenant_id',''),device_id,event_id,plan_id,body.request_id],ensure_ascii=False)
        fingerprint = sha256(key.encode('utf-8')).hexdigest()
        def execute():
            registry = runtime.container.registry
            def not_started(code, message):
                return {'execution_started':False,'http_status':code,'message':message,'plan_id':plan_id}
            try:
                listing = registry.execute('list_workorders',{},context={'agent':'runtime','step':'reconcile_existing_order','event_id':event_id})
            except Exception:
                return not_started(502,'工单对账读取失败，未重新派工')
            if listing.get('success') is False or not isinstance(listing.get('items'),list):
                return not_started(502,'工单对账数据不可用，未重新派工')
            existing = next((o for o in listing.get('items',[]) if o.get('device_id')==device_id and o.get('event_id')==event_id),None)
            if existing and existing.get('assignee'):
                return {**source, 'status':'already_dispatched','workorder':dict(existing),'trace':[]}
            if existing and existing.get('status') != 'open':
                return not_started(409,'历史工单状态不支持自动续派，请先核对工单')
            try:
                current = registry.execute('get_device_status',{'device_id':device_id},context={'agent':'runtime','step':'refresh_device_status','event_id':event_id})
            except Exception:
                return not_started(502,'当前设备读取失败，未重新派工')
            if current.get('found') is not True or current.get('success') is not True or current.get('device_id') != device_id:
                return not_started(502,'当前设备数据不可用，未重新派工')
            try:
                checked = datetime.fromisoformat(str(current.get('checked_at') or '').replace('Z','+00:00'))
                age = (datetime.now(timezone.utc) - checked).total_seconds()
            except (TypeError,ValueError):
                age = float('inf')
            if not -30 <= age <= 300 or str(current.get('alarm_code') or '') != str(event.get('alarm_code') or ''):
                return not_started(409,'设备数据已过期或当前报警已变化，请从监控中心处理当前故障')
            if not current.get('alarm_code') and str(current.get('status') or '').lower() not in {'fault', 'abnormal', 'alarm', 'error'}:
                return not_started(409,'设备当前没有对应故障，未执行自动派工')
            if existing:
                plan = dict(existing.get('maintenance_plan_snapshot') or {})
                create_key = str(existing.get('idempotency_key') or '')
                if not create_key or not plan:
                    return not_started(409,'历史工单缺少原创建幂等键或验证方案，不能安全续派')
                if RuntimePolicy._explicit_approval_required({'maintenance_plan': plan}, source) or source.get('requires_approval') is True:
                    return not_started(409,'该动作明确要求审批，请通过原审批入口继续')
                # 重放完全相同的创建参数，由后端指纹对账取回原单，再重新查询在线人员。
                # source 仅决定 Agent 自动派工门禁，不改变原方案/创建指纹。
                order_result = runtime.container.operations.execute_workorder('create', {
                    'maintenance_plan': plan, 'maintenance_plan_snapshot': plan,
                    'diagnosis_snapshot': dict(existing.get('diagnosis_snapshot') or plan.get('diagnosis') or {}),
                    'event_id': event_id, 'idempotency_key': create_key, 'source': 'monitor',
                }, from_agent='runtime')
                actual = dict(order_result.get('workorder') or {})
                if not actual.get('workorder_id'):
                    actual = dict(existing)
                dispatched = bool(order_result.get('success') and actual.get('assignee'))
                status = 'dispatched' if dispatched else 'waiting_for_personnel' \
                    if order_result.get('stop_reason') == 'waiting_for_personnel' else 'blocked'
                return {**source, 'status': status, 'stop_reason': order_result.get('stop_reason') or '',
                        'dispatch_reason': order_result.get('error') or '', 'workorder': actual,
                        'workorder_result': order_result, 'trace': []}
            fresh_event = {**event,'realtime_snapshot':current,'timestamp':current['checked_at'],
                           'retry_source_plan_id':plan_id,'retry_requested_by':actor['user_id']}
            # 尚未创建工单才重新诊断、检索和建方案；显式审批与库存门禁保留。
            return runtime.run_abnormal_event(fresh_event)
        try:
            result = event_results.get_or_create(key,execute,fingerprint=fingerprint)
        except (EventResultConflict,PendingResultError):
            raise HTTPException(409,'本次重新校验正在处理或结果待对账，不要重复派工') from None
        except TimeoutError:
            raise HTTPException(504,'重新校验超时，结果未知，请先刷新日志和工单核对') from None
        # 确定性的只读拒绝已经保存，不能误标为写入结果未知。
        if result.get('execution_started') is False:
            raise HTTPException(result['http_status'],{'message':result['message'],'execution_started':False})
        return result

    @router.get('/api/quality/designs/{run_id}', dependencies=[Depends(require_write_auth)])
    def get_inspection_design(run_id: str, request: Request):
        from app.agents.cad.modeling_api import get_freecad_run_record
        try:
            reference = build_design_reference(get_freecad_run_record(request, run_id))
        except ValueError as error:
            raise HTTPException(409, str(error)) from None
        return {'design_reference': reference}

    @router.get('/api/quality/batches/{batch_id}')
    def get_batch_quality(batch_id: str, request: Request):
        team_actor(request)
        if not batch_id.strip() or len(batch_id) > 256:
            raise HTTPException(422, '请提供明确的生产批次')
        try:
            from app.agents.quality.batch_evidence import enrich_batch_report
            report = runtime.container.registry.execute('get_batch_quality', {'batch_id': batch_id.strip()},
                context={'agent': 'runtime', 'step': 'read_batch_quality'})
            return enrich_batch_report(report, base_url=runtime.container.registry.base_url)
        except Exception:
            raise HTTPException(503, '批次统计暂不可用，请检查 Backend 连接；不会默认显示100%或认定机器故障') from None

    @router.get('/api/quality/parts/{part_id}/input')
    def get_inspection_input(part_id: str, request: Request):
        team_actor(request)
        result = runtime.container.registry.execute('get_production_part',{'part_id':part_id})
        if not result.get('found'):
            raise HTTPException(404,'该零件尚无保存的实测记录')
        return result

    @router.post('/api/quality/parts/{part_id}/input', dependencies=[Depends(require_write_auth)])
    def record_inspection_input(part_id: str, body: InspectionInput, request: Request):
        actor = team_actor(request)
        if body.part.get('part_id') and body.part['part_id'] != part_id:
            raise HTTPException(422, '录入数据的零件编号与目标不一致')
        if {'design_reference', 'comparison_scope'} & set(body.part):
            raise HTTPException(422, '图纸基准只能从生产建模的服务端版本读取，不能由客户端声明')
        registry = runtime.container.registry
        part = {**body.part, 'part_id': part_id}
        if body.design_run_id:
            from app.agents.cad.modeling_api import get_freecad_run_record
            try:
                record = get_freecad_run_record(request, body.design_run_id)
            except HTTPException as error:
                if error.status_code != 404:
                    raise
                # 已绑定的长期记录不依赖临时 CAD 缓存存活，不能用此分支绑定新的版本。
                try:
                    stored = registry.execute('get_production_part', {'part_id': part_id})
                except Exception:
                    raise HTTPException(503, '已保存的图纸版本暂无法核对') from None
                record = (stored.get('part') or {}).get('design_reference') or {}
                if stored.get('identity_verified') is not True or record.get('run_id') != body.design_run_id:
                    raise error
            try:
                reference = build_design_reference(record)
            except ValueError as error:
                raise HTTPException(409, str(error)) from None
            part.update(comparison_scope=SCOPE, design_reference=reference)
        try:
            return registry.execute('register_production_part', {'part':part, 'operator':actor['user_id']},
                                    context={'agent':'runtime','step':'record_inspection_input','task_id':'INPUT-' + uuid4().hex,'trace_id':'INPUT-' + uuid4().hex})
        except (BackendServiceError, HTTPError) as error:
            code = getattr(error, 'status_code', None) or getattr(error, 'code', None)
            if code in {409, 422}:
                raise HTTPException(code, '保存被业务规则拒绝，请核对数据；同一生产零件不能更换图纸版本，另一件零件或不同设计请使用新的零件编号') from None
            raise HTTPException(502, '质检数据保存失败，请检查 Backend 连接；未执行检测，勿反复提交') from None
        except Exception:
            raise HTTPException(502, '质检数据保存失败，请检查 Backend 连接或数据格式；未执行检测') from None

    @router.post('/api/reports/generate', dependencies=[Depends(require_write_auth)])
    def generate_saved_report(body: SavedReportRequest, request: Request):
        if sum(bool(getattr(body,key)) for key in ('plan_id','workorder_id','quality_check_id')) != 1:
            raise HTTPException(422, '每次请选择一个维修方案、工单或质检记录')
        container = runtime.container
        state = {'entry':'user','task_id':'TASK-REPORT-' + uuid4().hex[:12],'trace_id':'TRACE-REPORT-' + uuid4().hex[:12], 'persist':True}
        if body.quality_check_id:
            quality = container.closure_service.get_quality_check(body.quality_check_id)
            if not quality:
                raise HTTPException(404, '质检记录不存在')
            state.update(quality={**quality, 'passed':quality.get('result')=='passed'}, report_type='quality_report',
                         trace_id=quality.get('trace_id') or state['trace_id'], context={'run_type':'quality'})
        elif body.plan_id:
            results, _ = event_results.list_plan_results()
            source = next((item for item in results if (item.get('maintenance_plan') or {}).get('plan_id') == body.plan_id), None)
            if not source or body.plan_id in event_results.deleted_plan_ids():
                raise HTTPException(404, '维修方案不存在或已移除')
            state.update(diagnosis=source.get('diagnosis') or {}, maintenance_plan=source['maintenance_plan'],
                         event=source.get('event') or {}, trace_id=source.get('trace_id') or state['trace_id'])
            # 未派工的方案也能生成明确标记资料不足的报告，不伪造工单。
            state['report_type'] = 'maintenance_report'
        else:
            actor = team_actor(request)
            if actor.get('role') == 'technician':
                order = require_assignee(body.workorder_id,actor)
            else:
                order = container.registry.execute('get_workorder',{'workorder_id':body.workorder_id}).get('workorder') or {}
            if not order:
                raise HTTPException(404, '工单不存在')
            state.update(workorder=order, diagnosis=order.get('diagnosis_snapshot') or {},
                         maintenance_plan=order.get('maintenance_plan_snapshot') or {},
                         event={'event_id':order.get('event_id'),'device_id':order.get('device_id')},
                         trace_id=order.get('trace_id') or state['trace_id'])
        harness = getattr(container,'harnesses',{}).get('report')
        if harness is None:
            raise HTTPException(503,'Report Agent 未启用')
        report = _serialize_agent_result(harness.execute_agent(state))
        if not report.get('persisted'):
            raise HTTPException(502, {'message':'报告未保存成功','report':report})
        return {'report':report,'report_id':report['report_id'],'task_id':state['task_id'],'trace_id':state['trace_id']}

    return router
