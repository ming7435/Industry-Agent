"""One durable execution claim and terminal receipt reconciliation, never replay unknown writes."""
import json
import os

from shared.freecad_documents import NativeReceipt
from .native_program import render_document_program


class CadDocumentWorker:
    def __init__(self,backend,native_client,artifacts,worker_id):
        self.backend,self.native_client,self.artifacts,self.worker_id=backend,native_client,artifacts,worker_id

    def reconcile(self, job_id):
        receipt=self.artifacts.read_receipt(job_id)
        if receipt is None: return {'state':'blocked','job_id':job_id,'reason':'等待原生终结收据；不重放'}
        try:
            engine=self.backend.engine_state()
            if engine.get('job_id')!=job_id:return {'state':'blocked','job_id':job_id,'reason':'活动作业身份不一致'}
            job=self.backend.native_job(job_id)
            return self._register(job,receipt,engine['worker_id'])
        except Exception:return {'state':'blocked','job_id':job_id,'reason':'收据待核验或持久存储待恢复；不重放'}

    def _register(self,job,receipt,worker_id=None):
        receipt=self.artifacts.validate_candidate(job,receipt)
        if job.job_kind=='discover' and receipt.state=='completed':
            from pathlib import Path
            from .capabilities import local_inventory
            inventory=local_inventory();report=receipt.result
            if not inventory.get('ready') or report.get('version_fingerprint')!=inventory['version_fingerprint']:
                raise ValueError('发现结果与当前原生版本不一致')
            commands=report.get('commands')
            if not isinstance(commands,list) or not all(isinstance(c,str) and 0<len(c)<256 for c in commands) or len(commands)>20000:
                raise ValueError('原生命令清单无效')
            target=Path(os.getenv('FREECAD_DISCOVERY_REPORT',str(Path(__file__).resolve().parents[4]/'.runtime/verification/freecad-discovery.json')))
            target.parent.mkdir(parents=True,exist_ok=True);temporary=target.with_suffix('.tmp')
            temporary.write_text(json.dumps(report,ensure_ascii=False),encoding='utf-8');os.replace(temporary,target)
        if job.job_kind=='legacy_generate' and receipt.state=='completed':
            from app.tools.cad.freecad_mcp import read_validated_result,artifact_path
            from hashlib import sha256
            result=read_validated_result(job.source['spec'],job.source['run_id'])
            if result['validation']!=receipt.validation:raise ValueError('原任务终结证明不一致')
            if {a['name'] for a in result['artifacts']}!={a['name'] for a in receipt.artifacts}:raise ValueError('原任务文件清单不一致')
            for entry in receipt.artifacts:
                if sha256(artifact_path(job.source['run_id'],entry['name']).read_bytes()).hexdigest()!=entry['sha256']:
                    raise ValueError('原任务产物摘要已改变')
            receipt=receipt.model_copy(update={'result':result})
        if job.job_kind=='publish' and receipt.state=='completed':
            from shared.freecad_document_standards import build_document_standard
            from shared.freecad_documents import canonical_digest
            run_id='FC-'+canonical_digest([job.owner_user_id,job.document_id,job.expected_revision])
            return self.backend.call('commit_publication',worker_id=worker_id or self.worker_id,receipt=receipt.model_dump(mode='json'),
                                     standard=build_document_standard(receipt.snapshot,run_id).model_dump(mode='json'))
        return self.backend.complete_job(worker_id or self.worker_id,receipt)

    def tick(self):
        engine=self.backend.engine_state()
        if engine.get('job_id'):
            return self.reconcile(engine['job_id'])
        job=self.backend.take_job(self.worker_id)
        if job is None: return {'state':'idle'}
        directory=self.artifacts.job_directory(job.job_id)
        dispatched=False
        try:
            existing=self.artifacts.read_receipt(job.job_id)
            if existing:return self._register(job,existing)
            if (directory/'.execution-claimed').exists():
                return self.backend.fail_job(self.worker_id,job.job_id,'receipt_pending',outcome_unknown=True)
            status=self.native_client.status()
            if status.get('connected') is not True:
                return self.backend.fail_job(self.worker_id,job.job_id,status.get('error_code','native_offline'))
            if os.getenv('FREECAD_REQUIRE_MANAGED_RUNTIME','').lower()=='true':
                from .capabilities import local_inventory
                if not local_inventory().get('ready'):return self.backend.fail_job(self.worker_id,job.job_id,'managed_runtime_mismatch')
            if job.job_kind=='legacy_generate':
                dispatched=True
                return self._legacy(job,directory)
            if job.job_kind=='discover':
                code=discovery_program(job,directory);dispatched=True
                self.native_client.call_tool('execute_code',{'code':code,'include_screenshot':False,'timeout':30.0},timeout=40)
                receipt=self.artifacts.read_receipt(job.job_id)
                if receipt is None:return self.backend.fail_job(self.worker_id,job.job_id,'receipt_pending',outcome_unknown=True)
                return self._register(job,receipt)
            source=job.source.get('snapshot') or {}
            source_path=None
            native_file=next((a for a in source.get('artifacts',[]) if a['name']=='model.FCStd'),None)
            if native_file: source_path=self.artifacts.entry_path(native_file)
            if job.job_kind=='import': source_path=self.artifacts.entry_path(job.source['native_artifact'])
            code=render_document_program(job,directory,source_path)
            dispatched=True
            self.native_client.call_tool('execute_code',{'code':code,'include_screenshot':False,'timeout':90.0},timeout=100)
            receipt=self.artifacts.read_receipt(job.job_id)
            if receipt is None:
                return self.backend.fail_job(self.worker_id,job.job_id,'receipt_pending',outcome_unknown=True)
            return self._register(job,receipt)
        except Exception:
            # CAD may have finished while the HTTP/DB result was lost. Only the original receipt resolves it.
            receipt=self.artifacts.read_receipt(job.job_id)
            if receipt is not None:
                try:return self._register(job,receipt)
                except Exception: return {'state':'blocked','job_id':job.job_id,'reason':'收据待核验或存储待恢复'}
            return self.backend.fail_job(self.worker_id,job.job_id,'transport_or_validation_failed',outcome_unknown=dispatched)

    def _legacy(self,job,directory):
        from app.tools.cad.freecad_mcp import freecad_mcp,freecad_tool_scope,artifact_path,_requested_files
        from .gateway import worker_execution
        client=self.native_client
        # The GUI writes a terminal receipt even when the MCP reply or worker process is lost.
        data=dict(job_id=job.job_id,input_digest=job.input_digest,run_id=job.source['run_id'],
                  files=_requested_files(job.source['spec']),directory=str(directory),
                  legacy_directory=str(artifact_path(job.source['run_id'],'manifest.json').parent))
        class ReceiptClient:
            def call_tool(self,name,arguments,**kwargs):
                if name!='execute_code':raise ValueError('legacy worker only accepts trusted execution')
                code=legacy_receipt_program(arguments['code'],data)
                return client.call_tool(name,{**arguments,'code':code},**kwargs)
        token=worker_execution.set(True)
        try:
            with freecad_tool_scope(ReceiptClient(),job.source['run_id']):
                freecad_mcp(job.source['spec'])
        finally:
            worker_execution.reset(token)
        return self._register(job,self.artifacts.read_receipt(job.job_id))


def legacy_receipt_program(trusted_program,data):
    return ('import json,os,hashlib\nfrom pathlib import Path\n'
            'data=json.loads('+repr(json.dumps(data,ensure_ascii=False))+')\n'
            'trusted_program='+repr(trusted_program)+'\n'+r'''
out=Path(data['directory'])
with (out/'.execution-claimed').open('x',encoding='utf-8') as claim:claim.write(data['input_digest'])
receipt={'job_id':data['job_id'],'input_digest':data['input_digest'],'state':'failed','snapshot':None,
         'artifacts':[],'validation':{},'result':{},'error_code':'legacy_native_failed'}
try:
    exec(compile(trusted_program,'<trusted-legacy-builder>','exec'),{})
    legacy=Path(data['legacy_directory'])
    proof=json.loads((legacy/'manifest.json').read_text(encoding='utf-8'))
    entries=[]
    for name in data['files']:
        source=legacy/name
        if source.is_symlink() or not 0<source.stat().st_size<=100*1024*1024:raise ValueError('invalid legacy artifact')
        content=source.read_bytes();target=out/name
        if target.exists() or target.is_symlink():raise ValueError('legacy artifact already exists')
        target.write_bytes(content)
        entries.append({'job_id':data['job_id'],'name':name,'size':len(content),'sha256':hashlib.sha256(content).hexdigest()})
    receipt.update(state='completed',artifacts=entries,validation={k:v for k,v in proof.items() if k not in ('spec','run_id')},error_code=None)
except Exception:
    pass
temporary=out/'receipt.tmp'
temporary.write_text(json.dumps(receipt,ensure_ascii=False,allow_nan=False),encoding='utf-8')
os.replace(str(temporary),str(out/'receipt.json'))
''')


def discovery_program(job,directory):
    data=dict(job_id=job.job_id,input_digest=job.input_digest,directory=str(directory),workbench_id=job.source.get('workbench_id',''))
    return 'import FreeCAD as App,FreeCADGui as Gui,json,hashlib,os,time\nfrom pathlib import Path\ndata=json.loads('+repr(json.dumps(data))+')\n'+r'''
out=Path(data['directory'])
with (out/'.execution-claimed').open('x',encoding='utf-8') as claim:claim.write(data['input_digest'])
receipt={'job_id':data['job_id'],'input_digest':data['input_digest'],'state':'failed','snapshot':None,'artifacts':[],'validation':{},'result':{},'error_code':'discovery_failed'}
try:
    before=Gui.activeWorkbench().name()
    requested=data['workbench_id']
    if requested:
        if requested not in Gui.listWorkbenches():raise ValueError('unknown workbench')
        if requested!=before and not Gui.activateWorkbench(requested):raise ValueError('workbench activation failed')
        if Gui.activeWorkbench().name()!=requested:raise ValueError('wrong active workbench')
    version=App.Version()
    fingerprint=hashlib.sha256(json.dumps(version,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')).hexdigest()
    commands=sorted(Gui.listCommands())
    information={}
    for name in commands:
        try:
            resources=Gui.Command.get(name).getInfo()
            information[name]={key:str(resources.get(key,'') or '')[:2048] for key in ('menuText','toolTip','shortcut')}
        except Exception:information[name]={}
    workbenches=[{'id':name,'label':str(getattr(workbench,'MenuText',name))[:256]} for name,workbench in Gui.listWorkbenches().items()]
    receipt.update(state='completed',validation={'valid':True},result={'version_fingerprint':fingerprint,'runtime_pid':os.getpid(),'discovered_at':time.time(),
                   'commands':commands,'command_info':information,'workbenches':workbenches},error_code=None)
except Exception:pass
finally:
    try:
        if requested and Gui.activeWorkbench().name()!=before:
            if not Gui.activateWorkbench(before) or Gui.activeWorkbench().name()!=before:raise ValueError('workbench restoration failed')
    except Exception:
        receipt.update(state='failed',error_code='workbench_restore_failed')
temporary=out/'receipt.tmp';temporary.write_text(json.dumps(receipt,ensure_ascii=False),encoding='utf-8')
os.replace(str(temporary),str(out/'receipt.json'))
'''
