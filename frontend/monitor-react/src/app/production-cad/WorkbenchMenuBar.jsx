import React,{useState} from 'react';
export default function WorkbenchMenuBar({onNew,onSave,onRefresh,onProperties,onProposal,onSpec,canSpec,canSave}){
  const [open,setOpen]=useState('');
  const revealCatalog=()=>{const details=document.querySelector('[data-cad-command-catalog]');if(details){details.open=true;details.scrollIntoView({block:'nearest'});}};
  const menus={文件:[['新建 / 复制文档',onNew],['发布当前修订',onSave,!canSave],['刷新当前文档',onRefresh]],
    编辑:[['编辑选中对象属性',onProperties],['中文建模提案',onProposal]],
    视图:[['三维视图与标准方向',()=>document.querySelector('.cad-document-viewer')?.scrollIntoView({block:'nearest'})]],
    零件:[['编辑当前完整规格',()=>onSpec?.('edit'),!canSpec],['添加通孔',()=>onSpec?.('hole'),!canSpec],['全部边圆角',()=>onSpec?.('fillet'),!canSpec],['全部边倒角',()=>onSpec?.('chamfer'),!canSpec],['圆形截面放样',()=>onSpec?.('loft'),!canSpec],['渐开线直齿轮',()=>onSpec?.('gear'),!canSpec]],
    工作台:[['三视图与工程图',()=>onSpec?.('drawing'),!canSpec],['工程图与剖视图',()=>onSpec?.('section'),!canSpec],['钣金折弯与展开',()=>onSpec?.('sheetmetal'),!canSpec],['转动关节与装配运动',()=>onSpec?.('motion'),!canSpec],['BIM 墙、楼板与门洞',()=>onSpec?.('bim'),!canSpec]],
    工具:[['查看完整命令目录',revealCatalog]],
    帮助:[['查看命令接入状态',revealCatalog]]};
  return <div className="cad-workbench-menubar" role="menubar" aria-label="Text-to-CAD 建模菜单" onKeyDown={e=>{if(e.key==='Escape'){setOpen('');e.currentTarget.querySelector('[aria-expanded=true]')?.focus();}}}>
    <strong>Text-to-CAD</strong>{Object.entries(menus).map(([name,items])=><div key={name}><button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={open===name} onClick={()=>setOpen(open===name?'':name)}>{name}</button>{open===name&&<div role="menu" aria-label={name}>{items.map(([label,callback,disabled])=><button key={label} role="menuitem" type="button" disabled={disabled} onClick={()=>{setOpen('');callback?.();}}>{label}</button>)}</div>}</div>)}<span>本地参数化建模</span>
  </div>;
}
