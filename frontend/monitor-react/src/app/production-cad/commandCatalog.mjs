export function catalogCommands(catalog,workbench='all',query=''){
  const search=query.trim().toLocaleLowerCase();
  return (catalog?.commands||[]).filter(c=>(workbench==='all'||c.workbench_id===workbench)&&(!search||`${c.id} ${c.label} ${c.description||''}`.toLocaleLowerCase().includes(search)));
}
export function catalogAction(command){
  const action=command?.action;
  if(command?.execution!=='adapted')return null;
  if(action?.type==='create_primitive'&&['box','cylinder','sphere','cone'].includes(action.primitive_type))return {type:action.type,primitive_type:action.primitive_type};
  if(action?.type==='prepare_spec_task'&&['fillet','chamfer'].includes(action.task_id))return {type:action.type,task_id:action.task_id};
  return null;
}
