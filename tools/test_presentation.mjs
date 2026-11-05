import assert from 'node:assert/strict';
import fs from 'node:fs';
// 与浏览器同一模块，避免Node的扩展名设置影响测试入口。
const code=fs.readFileSync(new URL('../presentation.js',import.meta.url),'utf8');
const {engineeringState,wallValue}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const binding={project_id:'fixture',object_id:'lintel-1',object_revision:2,
 source_revision:'source-2',design_revision:'design-2',input_digest:'input-2'};
const refs=[binding];
const calculated={binding,beam:{status:'calculated',record_ref:'beam-2'},
 fixing:{status:'calculated',record_ref:'fix-2'}};
assert.deepEqual(engineeringState(null,refs),{status:'unlinked',confirmed:false});
assert.equal(engineeringState({...calculated,beam:{status:'missing_input'}},refs).status,'missing_input');
assert.equal(engineeringState({...calculated,beam:{status:'not_calculated'}},refs).status,'not_calculated');
assert.equal(engineeringState({...calculated,beam:{status:'review'}},refs).status,'review');
assert.equal(engineeringState({...calculated,beam:{status:'fail'}},refs).status,'fail');
assert.deepEqual(engineeringState(calculated,refs),{status:'calculated',confirmed:false});
for(const key of Object.keys(binding))assert.equal(engineeringState({...calculated,binding:{...binding,[key]:'old'}},refs).status,'stale',key);
assert.equal(engineeringState(calculated,[]).status,'stale');
const confirmation={status:'confirmed',binding,record_ref:'confirmation-2',by:'Fixture engineer',
 at:'2026-11-05',scope:'fixture only',result_refs:['beam-2','fix-2']};
assert.equal(engineeringState({...calculated,confirmation},refs).confirmed,true);
for(const key of ['record_ref','by','at','scope','result_refs']){
 const incomplete={...confirmation};delete incomplete[key];
 assert.equal(engineeringState({...calculated,confirmation:incomplete},refs).confirmed,false,key);
}
assert.equal(engineeringState({...calculated,confirmation:{...confirmation,result_refs:['fix-2']}},refs).confirmed,false);
assert.equal(engineeringState({...calculated,confirmation:{...confirmation,binding:{...binding,object_revision:1}}},refs).confirmed,false);
const another={...binding,object_id:'lintel-2'};
assert.equal(engineeringState({...calculated,confirmation:{...confirmation,binding:another}},[binding,another]).confirmed,false);
const source={status:'drawing',source_ids:['fixture-page'],locator:'fixture page 1'};
assert.equal(wallValue({load_bearing:{...source,value:false}},'load_bearing'),false);
assert.equal(wallValue({fire:{...source,value:true}},'fire'),true);
assert.equal(wallValue({fire:{...source,value:true,status:'schematic'}},'fire'),null);
assert.equal(wallValue({fire:{value:true,status:'drawing'}},'fire'),null);
assert.equal(wallValue({},'load_bearing'),null);
console.log('presentation: revision, independent results, confirmation and wall-source assertions passed');
