export function nextSkillVersion(version) {
  const text=String(version ?? '');
  if (!/^\d+(?:\.\d+){1,3}$/.test(text)) throw new Error('当前技能版本格式不支持自动编号，请先核对版本。');
  const parts=text.split('.');
  parts[parts.length-1]=String(BigInt(parts.at(-1))+1n);
  const next=parts.join('.');
  if(next.length>48) throw new Error('下一个技能版本号超过长度限制，请先核对版本。');
  return next;
}

export function withSkillDraftVersion(current,draft,forTest=false) {
  const changed=draft.goal!==current.goal || draft.document!==current.document;
  if(!forTest && !changed) return {...draft,version:current.version};
  const plan=skillVersionPlan(current.version);
  if(plan.error && forTest) throw new Error(plan.error);
  return {...draft,version:plan.next || current.version};
}

export function skillVersionPlan(version) {
  try {return {next:nextSkillVersion(version),error:''};}
  catch(error) {return {next:null,error:error.message};}
}
