// 只展示上游提供的资料；这里没有计算、推断支承或工程确认写入。
export const identityKeys=['project_id','object_id','object_revision','source_revision','design_revision','input_digest'];
export function sameBinding(binding,refs){
 return Boolean(binding&&refs?.length&&refs.some(ref=>identityKeys.every(key=>
  ref[key]!==undefined&&binding[key]===ref[key])));
}
export const stateText={missing_input:'Missing inputs / 缺少输入',not_calculated:'Not calculated / 尚未计算',
 calculated:'Calculated · pending review / 已算待确认',review:'Review required / 需要复核',
 fail:'Failed / 未通过',stale:'Outdated / 旧结果已过期',schematic:'Schematic / 示意',
 unlinked:'No linked engineering result / 尚无关联工程结果'};
export function engineeringState(data,refs){
 if(!data)return {status:'unlinked',confirmed:false};
 const stale=!sameBinding(data.binding,refs);
 const statuses=['beam','fixing'].map(key=>data[key]?.status);
 const status=stale?'stale':statuses.includes('fail')?'fail':statuses.includes('review')?'review':
  statuses.includes('missing_input')?'missing_input':statuses.every(s=>s==='calculated')?'calculated':
  statuses.includes('schematic')?'schematic':'not_calculated';
 const confirmation=data.confirmation;
 const confirmed=status==='calculated'&&confirmation?.status==='confirmed'&&
  sameBinding(confirmation.binding,[data.binding])&&Boolean(confirmation.record_ref&&confirmation.by&&confirmation.at&&confirmation.scope)&&
  ['beam','fixing'].every(key=>data[key]?.record_ref&&confirmation.result_refs?.includes(data[key].record_ref));
 return {status,confirmed};
}
export function wallValue(attributes,key){
 const entry=attributes?.[key];
 return entry&&['drawing','measured','derived','rule','confirmed'].includes(entry.status)&&
  entry.source_ids?.length&&entry.locator&&typeof entry.value==='boolean'?entry.value:null;
}
function node(tag,text,cl){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cl)e.className=cl;return e;}
function fields(parent,rows){
 if(!rows?.length){parent.append(node('p','Not supplied / 尚未提供'));return;}
 const list=node('dl');
 for(const row of rows){
  list.append(node('dt',row.label),node('dd',row.value===undefined||row.value===null?'Unknown / 未知':
   `${row.value}${row.unit?' '+row.unit:''}`));
  if(row.status||row.locator)list.append(node('dd',[row.status,row.locator].filter(Boolean).join(' · '),'field-source'));
 }
 parent.append(list);
}
export function renderPresentation(component,refs,{selectRelated,openSource}){
 const data=component.parameters?.viewer||{},root=node('div',undefined,'presentation');
 const section=(key,title)=>{const s=node('section');s.id='detail-'+key;s.append(node('h3',title));root.append(s);return s;};
 if(data.fixture)root.append(node('p','FIXTURE · Test data / 测试资料，数值与确认均为演示','chip warning'));
 if(component.group==='walls'){
  const wall=section('wall','Wall attributes / 墙体属性');
  for(const [key,label] of [['fire','Fire rating / 防火'],['load_bearing','Load bearing / 承重'],['bracing','Bracing / 抗侧力']]){
   const value=wallValue(data.wall_attributes,key),entry=data.wall_attributes?.[key];
   wall.append(node('p',`${label}：${value===null?'Unknown / 未知':value?'Yes / 是':'No / 否'}${entry?.locator?' · '+entry.locator:''}`));
  }
 }
 const design=section('design','Design & construction / 设计与构造');fields(design,data.design?.fields);
 const supports=section('supports','Supports & load path / 支承与传力');
 fields(supports,data.support_fields);
 for(const related of data.supports||[]){
  const b=node('button',`${related.label||related.component_id} · ${related.status||'Unknown / 待核'}`,'related-part');
  b.onclick=()=>selectRelated(related.component_id,b);supports.append(b);
  if(related.locator)supports.append(node('p',related.locator,'field-source'));
 }
 const inputs=section('inputs','Calculation inputs / 计算输入');fields(inputs,data.inputs);
 const eng=data.engineering,state=engineeringState(eng,refs);
 const results=section('results','Engineering result / 工程结果');
 results.dataset.status=state.status;results.append(node('p',stateText[state.status],'chip warning'));
 const resultPart=(key,label)=>{
  const result=eng?.[key],s=section(key,label);
  s.append(node('p',stateText[state.status==='stale'?'stale':result?.status]||stateText.not_calculated,'result-state'));
  if(result?.record_ref)s.append(node('p',`Record / 记录：${result.record_ref}`,'record-ref'));
  fields(s,result?.fields);
  if(result?.missing?.length)s.append(node('p','Missing / 缺项：'+result.missing.join('；'),'missing-inputs'));
  if(result?.limitations)s.append(node('p',result.limitations));
 };
 resultPart('beam','Beam calculation / 梁验算');resultPart('fixing','Fixing selection / 固定连接选型');
 const sources=section('sources','Sources & calculation report / 原图与计算书');
 if(!data.sources?.length)sources.append(node('p','Not supplied / 尚未提供原图及计算书'));
 for(const source of data.sources||[]){
  const b=node('button',source.title||'Open source / 查看依据','source-button');
  b.onclick=()=>openSource(source,b);sources.append(b);
  if(source.locator)sources.append(node('p',source.locator,'field-source'));
 }
 const review=section('review','Review & CAD / 审阅与落图');
 review.append(node('p',state.status==='stale'?'Confirmation expired / 旧确认已过期':
  state.confirmed?'Confirmed record / 已有有效确认记录':'Awaiting coordinator confirmation / 待总控登记确认','confirmation-state'));
 if(eng?.confirmation){const c=eng.confirmation;
  fields(review,[{label:'Reviewer / 审阅人',value:c.by},{label:'Time / 时间',value:c.at},
   {label:'Scope / 范围',value:c.scope},{label:'Confirmation record / 确认记录',value:c.record_ref}]);
 }
 const cad=eng?.cad,validCad=state.confirmed&&sameBinding(cad?.binding,[eng.binding])&&cad?.confirmation_ref===eng.confirmation.record_ref;
 review.append(node('p',validCad&&cad.status==='applied'&&cad.receipt_ref?
  `CAD applied / 已落图 · ${cad.receipt_ref}`:'CAD pending / 待落图或待核回执','cad-state'));
 review.append(node('p','Review applies to the referenced revision and scope. / 审阅按引用修订与范围登记。'));
 return root;
}
