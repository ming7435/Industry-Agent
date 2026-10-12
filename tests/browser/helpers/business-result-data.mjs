export const deviceId='TRAK-TC820LTYSI-001';
export const longFaultSummary='设备 TRAK-TC820LTYSI-001（TRAK TC820LTYsi 车削中心）触发报警 700010「液压压力未达到」（目录等级：严重故障），同时液压总压力、尾座套筒压力、尾座夹紧压力三项指标越限，事件等级为高级故障。历史趋势显示液压总压力、尾座套筒压力、尾座夹紧压力、卡盘夹紧压力四项压力在约 10 秒内同步快速下降（液压总压力 697→567 psi，尾座夹紧 694→548 psi，套筒 112→67 psi，卡盘 278→175 psi），呈典型液压系统整体压力跌落特征。';
export const actor={user_id:'VERIFY-OWNER',username:'维修人员',role:'technician',responsible_device_ids:[deviceId]};
export const sample={device_id:deviceId,alarm_code:'700010',alarm_label:'液压压力未达到',event_id:'VERIFY-EVENT',event_revision:1};
export const diagnosis={...sample,status:'completed',confidence:0.92,evidence_status:'ready',requires_human_review:false,
  fault:'液压压力未达到',summary:'## 故障判断\n当前液压压力低于设定要求，与报警 700010 的触发条件一致。\n\n主轴温度和润滑压力处于正常范围，优先核查液压供给与压力反馈。',
  cause:'1. **液压供给不稳定**：油位不足、管路泄漏或过滤器堵塞可能导致压力不足。\n2. **压力反馈异常**：传感器接线或测量偏差可能造成误报警。',
  recommendation:'处置原则：保持设备停机，按照安全检查要求开展核查。\n现场检查：核对油位、可见泄漏以及压力反馈。\n恢复条件：确认压力满足要求并完成复测后，再申请设备启动。',
  next_action:'1. 核对液压油位与管路状态。\n2. 记录压力反馈及现场检查结果。',
  severity:'critical',evidence:['报警 700010：液压压力未达到。','实测压力 0.42 MPa，设定范围 0.60–0.80 MPa。','主轴温度 41 ℃，润滑压力 0.23 MPa，均处于正常范围。']};
export const plan={plan_id:'VERIFY-PLAN',device_id:deviceId,event_id:sample.event_id,event_revision:1,alarm_code:sample.alarm_code,
  diagnosis,plan_kind:'repair',workorder_ready:true,risk_level:'high',estimated_time:'45 分钟',
  repair_steps:['1. **核查油位**：按设备规定范围检查液压油位，记录当前状态。','2. **检查可见泄漏**：核对液压站及管路连接部位。','3. **复核压力反馈**：比较现场压力显示与系统反馈，记录差异。'],
  pre_checks:['确认机床已停止运行。','核对故障事件与现场报警一致。'],
  safety:['断电挂牌，防止设备意外启动。','涉及压力部件前，按现场规程确认安全状态。'],
  post_checks:['记录复测压力与现场处理结果。','确认无可见泄漏，压力反馈满足设备要求。'],
  tools:['检修工具','记录表'],parts:['备件需求以现场检查结果为准'],
  dispatch:{allowed:true,assignee_name:'维修人员',device_id:deviceId},validation_findings:[]};
export const order={workorder_id:'VERIFY-WORKORDER',device_id:deviceId,event_id:sample.event_id,event_revision:1,alarm_code:sample.alarm_code,
  title:'液压压力异常处理',status:'in_progress',assignee:actor.user_id,assignee_name:actor.username,accepted_by:actor.user_id,
  plan_id:plan.plan_id,maintenance_plan_snapshot:plan,diagnosis_snapshot:diagnosis,source:'agent',
  repair_target:{part_name:'液压站',part_no:'HYD-01',system:'液压系统',location:'机床后侧',symptom:'故障表现：液压压力低于设定值。\n现场现象：压力反馈存在波动，设备保持停机。'},
  repair_feedback:{feedback:'### 处理过程\n1. 已核查液压油位与管路连接。\n2. 已记录现场压力与系统反馈。\n\n### 复测结果\n压力反馈已恢复至要求范围，现场检查结果已记录。'},execution_review:{required:false,findings:[]}};
export const snapshot={device_id:deviceId,devices:[{device_id:deviceId,name:'TRAK TC820LTYsi 车削中心'}],
  latest_result:{current_sample:sample},diagnosis:{latest:diagnosis,latest_by_device:{[deviceId]:diagnosis},
    pipeline:{event:sample,diagnosis,maintenance_plan:plan,status:'completed'},pipeline_by_device:{[deviceId]:{event:sample,diagnosis,maintenance_plan:plan,status:'completed'}}}};
