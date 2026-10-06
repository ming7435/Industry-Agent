export const INSPECTION_FIELDS = [
  ['measurements', '尺寸实测值', '按图纸项目填写数值，例如 diameter_mm。不能填设计值代替实测值。'],
  ['specifications', '设计／检验规格', '按实际图纸填写各尺寸 min、max，材料 material_grade、硬度 hardness_hb 和功能 runout_mm 等规则，不自动猜阈值。'],
  ['appearance', '外观记录', 'scratch、crack、burr、discoloration、deformation 分别为划痕、裂纹、毛刺、变色、变形；true 有缺陷，false 无缺陷。'],
  ['material', '材料记录', 'grade 为实测材料牌号，hardness_hb 为实测布氏硬度。'],
  ['function', '功能记录', 'runout_mm 为实测跳动；rotation_test 为旋转测试是否通过（true／false）。当前功能检测适用于旋转类零件。'],
  ['process', '工艺追溯记录', 'cycle_complete、traceable、operator_confirmed 分别为加工完成、可追溯、人员确认（true／false）。'],
];

export function prepareInspectionInput(identity, fields) {
  const part = {...identity};
  for (const [key,label] of INSPECTION_FIELDS) {
    let value;
    try { value = JSON.parse(fields[key] || '{}'); }
    catch { throw new Error(`${label}不是有效 JSON，请检查引号、逗号和括号`); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}应填写 JSON 对象`);
    part[key] = value;
  }
  return {part};
}
