import React from 'react';
export default function DocumentTree({snapshot,selectedObjectId,onSelect}) {
  const objects=snapshot?.objects||[], byId=new Map(objects.map(o=>[o.object_id,o]));
  const seen=new Set();
  function row(object,depth=0) {
    if(seen.has(object.object_id)) return null;seen.add(object.object_id);
    const children=objects.filter(o=>o.parent_ids?.includes(object.object_id));
    return <li key={object.object_id} role="none"><button type="button" role="treeitem" aria-selected={selectedObjectId===object.object_id} aria-level={depth+1} style={{paddingLeft:12+depth*16}} onClick={()=>onSelect(object.object_id)}
      onKeyDown={event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const rows=[...event.currentTarget.closest('[role=tree]').querySelectorAll('[role=treeitem]')],index=rows.indexOf(event.currentTarget);rows[event.key==='Home'?0:event.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,index+(event.key==='ArrowDown'?1:-1)))]?.focus();}}>
      <span>{object.visible?'◇':'◌'} {object.label||object.name}</span><small>{object.type_id} · {object.object_id}</small></button>
      {children.length>0&&<ul role="group">{children.map(child=>row(child,depth+1))}</ul>}</li>;
  }
  const roots=objects.filter(o=>!o.parent_ids?.some(id=>byId.has(id))),rows=roots.map(o=>row(o));
  // Cyclic or detached native dependency objects must still be inspectable.
  return <aside className="cad-document-tree"><h3>模型树</h3><ul role="tree" aria-label="文档对象">{rows}{objects.filter(o=>!seen.has(o.object_id)).map(o=>row(o))}</ul>{objects.length===0&&<p>空文档，请添加形体或确认中文建模提案。</p>}</aside>;
}
