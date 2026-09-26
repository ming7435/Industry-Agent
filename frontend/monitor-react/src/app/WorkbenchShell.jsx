import React from "react";

const groups = [
  { label: "生产运营", items: [
    { id: "monitor", label: "监控中心", icon: "monitor" },
    { id: "diagnosis", label: "智能诊断", icon: "diagnosis" },
    { id: "workorder", label: "工单系统", icon: "workorder" },
    { id: "quality", label: "质检系统", icon: "quality" },
  ] },
  { label: "知识资产", items: [
    { id: "rag", label: "知识问答", icon: "knowledge" },
    { id: "report", label: "报告中心", icon: "report" },
  ] },
];

const pages = {
  monitor: { title: "监控中心", description: "查看设备运行状态与异常处置进度", category: "生产运营" },
  diagnosis: { title: "智能诊断", description: "查看 Runtime 诊断结论、证据与处置建议", category: "生产运营" },
  workorder: { title: "工单系统", description: "跟进维修任务、执行反馈与验收", category: "生产运营" },
  quality: { title: "质检系统", description: "执行零件质量检测并追踪结果", category: "生产运营" },
  rag: { title: "知识问答", description: "检索维修知识与可引用的文档证据", category: "知识资产" },
  report: { title: "报告中心", description: "汇总诊断、维修与质量闭环报告", category: "知识资产" },
};

function WorkbenchIcon({ name }) {
  const paths = {
    monitor: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M7 13l3-3 2 2 4-4 2 2M8 21h8m-4-3v3" /></>,
    diagnosis: <><path d="M12 3a6 6 0 0 0-3.7 10.7L7 18h10l-1.3-4.3A6 6 0 0 0 12 3Z" /><path d="M9 21h6M10 18h4" /></>,
    workorder: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4" /></>,
    quality: <><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
    knowledge: <><path d="M12 6c-2.5-2-5.5-2.3-9-1v14c3.5-1.3 6.5-1 9 1 2.5-2 5.5-2.3 9-1V5c-3.5-1.3-6.5-1-9 1ZM12 6v14" /></>,
    report: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function WorkbenchSidebar({ activeView, onChange, hasError, connected }) {
  return (
    <aside className="workbench-sidebar" aria-label="工作台导航">
      <div className="workbench-brand"><span className="workbench-brand-mark" aria-hidden="true">IA</span><span><strong>IND-Agent</strong><small>工业智能工作台</small></span></div>
      <nav className="workbench-nav" aria-label="功能导航">
        {groups.map((group) => <div className="workbench-nav-group" key={group.label}>
          <span className="workbench-nav-caption">{group.label}</span>
          {group.items.map((item) => <button key={item.id} type="button" className={`workbench-nav-item ${activeView === item.id ? "is-active" : ""}`} aria-current={activeView === item.id ? "page" : undefined} onClick={() => onChange(item.id)}><WorkbenchIcon name={item.icon} /><span>{item.label}</span>{item.id === "monitor" && <i aria-label="实时">LIVE</i>}</button>)}
        </div>)}
      </nav>
      <div className="workbench-sidebar-status" role="status"><span className={`workbench-status-dot ${hasError ? "is-error" : !connected ? "is-pending" : ""}`} /><span><strong>{hasError ? "连接异常" : connected ? "服务运行中" : "连接中"}</strong><small>{hasError ? "请检查服务连接" : connected ? "设备数据持续同步" : "正在获取设备快照"}</small></span></div>
    </aside>
  );
}

export function WorkbenchHeader({ activeView, snapshot, runner, hasError, connected, onControl, onReset, onEnterBigScreen }) {
  const page = pages[activeView] || pages.monitor;
  const deviceCount = snapshot?.device_ids?.length || snapshot?.devices?.length || (snapshot?.device_id ? 1 : 0);
  return (
    <header className="workbench-header">
      <div className="workbench-heading">
        <div className="workbench-breadcrumb"><span>工作台</span><span aria-hidden="true">/</span><span>{page.category}</span></div>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      <div className="workbench-controls">
        <div className="workbench-connection" role="status"><span className={`workbench-status-dot ${hasError ? "is-error" : !connected ? "is-pending" : ""}`} /><span>{hasError ? "接口异常" : connected ? "已连接" : "连接中"}</span><span className="workbench-connection-separator" aria-hidden="true" /><span>{deviceCount ? `${deviceCount} 台设备` : "等待设备"}</span></div>
        <label className="workbench-monitor-toggle"><input type="checkbox" checked={Boolean(runner.enabled)} onChange={(event) => onControl(event.target.checked ? "on" : "off")} /><span className="workbench-toggle-track" aria-hidden="true" /><span>自动监测</span></label>
        {activeView === "monitor" && <button className="workbench-text-action" type="button" onClick={onReset}>归零统计</button>}
        <button className="workbench-primary-action" type="button" onClick={onEnterBigScreen}>进入大屏 <span aria-hidden="true">↗</span></button>
      </div>
      <div className="workbench-source">数据源：{snapshot?.data_source || "等待接入"}</div>
    </header>
  );
}
