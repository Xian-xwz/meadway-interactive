import {OrbitControls} from './vendor/OrbitControls.js';
import {createDetailLoader} from './component-details.js';

export function install(env){
 const {T,scene,renderer,camera,parts,model,cfg,groundGroup,groundBoxes,stage,sun,caps,sectionCap,instances}=env;
 const detailLoader=createDetailLoader(env.metadataURL,env.gltfLoader);
 let localModel=null,originalLayers=[];
 const viewport=document.querySelector('#viewport'),canvas=renderer.domElement;
 if(matchMedia('(pointer: coarse)').matches)document.querySelector('.gestures').innerHTML='One finger: rotate · Two fingers: zoom / pan<br><small>单指旋转 · 双指缩放或平移 · 轻点查看构件</small>';
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.1;controls.minZoom=.25;controls.maxZoom=10;controls.maxPolarAngle=Math.PI*.495;
 renderer.shadowMap.autoUpdate=false;
 const ray=new T.Raycaster(),pointer=new T.Vector2(),titles={upper:['First-floor framing','二层墙架 · 六户'],upperA:['Lots 1–3 · First floor','第一至三户 · 二层墙架'],upperB:['Lots 4–6 · First floor','第四至六户 · 二层墙架'],hero:['Whole house','整屋建筑'],site:['Building & site','建筑与场地'],cutaway:['Inside the house','剖切空间'],gf:['Ground floor','一层顶视'],ff:['First floor','二层顶视'],trusses:['Roof structure · Six homes','六户屋架 · 木色详图 / 橙色示意'],trussA:['Lots 1–3 · Roof structure','1至3户屋架'],trussB:['Lots 4–6 · Roof structure','4至6户屋架']};
 let view='upper',roof=false,terrain=false,trusses=false,selected=null,dirty=true,down=null,initialized=false;
 let wallMode='frame';const layers={upper:true,middle:true,lower:false};
 let catalog='st',catalogFilter=null;
 const matchesCatalog=group=>!catalogFilter||catalogFilter.groups.has(group);
 const isEnvelope=c=>c.floor==='FF'&&['walls','opening_infill'].includes(c.group);
 const layerOf=c=>c.group==='upper_slab'?'middle':c.floor==='FF'?'upper':c.floor==='GF'?'lower':null;
 const meshMap=new Map(),baseTransforms=parts.map(p=>p.o.matrixWorld.toArray());
 for(const p of parts)for(const m of p.meshes)meshMap.set(m,p);
 const corners=b=>Array.from({length:8},(_,i)=>new T.Vector3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z));
 function fit(direction){
  const close=view==='trussA'||view==='trussB',block=view==='trussA'?'A':'B';const box=new T.Box3();for(const p of parts)if(close?p.c.group==='trusses'&&p.c.block===block:p.o.visible)box.union(p.box);
  if((view==='site'||box.isEmpty())&&groundGroup.visible)for(const b of groundBoxes)box.union(b);
  if(box.isEmpty()){for(const p of parts)box.union(p.box);}
  const center=box.getCenter(new T.Vector3());camera.up.set(0,1,0);if(view==='gf'||view==='ff')camera.up.set(0,0,-1);camera.zoom=1;controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(...direction).normalize().multiplyScalar(90));camera.lookAt(center);camera.updateMatrixWorld();
  const ps=corners(box).map(p=>p.applyMatrix4(camera.matrixWorldInverse)),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),aspect=viewport.clientWidth/viewport.clientHeight;
  const span=Math.max((Math.max(...ys)-Math.min(...ys))/.76/2,(Math.max(...xs)-Math.min(...xs))/aspect/.88/2);
  camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();controls.update();dirty=true;
 }
 function clearCaps(){while(caps.children.length){const c=caps.children[0];meshMap.delete(c);caps.remove(c);c.geometry.dispose();c.material.dispose();}}
 function applyView(reset=true){
  if(reset)clearSelection();clearCaps();const plan=view==='gf'||view==='ff',cut=view==='cutaway',floor=view==='gf'?'GF':'FF',tv=view.startsWith('truss'),close=view==='trussA'||view==='trussB',block=view==='trussA'?'A':'B';
  const showTerrain=terrain&&!plan&&!close;groundGroup.visible=showTerrain&&matchesCatalog('terrain');stage.visible=!showTerrain&&!plan&&!close;sun.castShadow=!plan;
  for(const p of parts){const c=p.c;let plane=null;
   p.o.visible=plan?(c.group!=='roof'&&(c.floor===floor||c.group==='stairs')):c.group==='roof'?roof&&!cut&&!tv:c.group==='trusses'?trusses||tv:true;if(close)p.o.visible=c.group==='trusses'&&c.block===block;
   const layer=layerOf(c),env=isEnvelope(c),frame=c.group==='framing',overlay=env&&wallMode==='overlay';
   if(layer&&!layers[layer]||!matchesCatalog(c.group))p.o.visible=false;
   if((view==='upperA'||view==='upperB')&&c.block!==(view==='upperA'?'A':'B'))p.o.visible=false;
   if(env&&wallMode==='frame'||frame&&wallMode==='solid')p.o.visible=false;
   for(const m of p.meshes){m.material.transparent=overlay;m.material.opacity=overlay?.10:1;m.material.depthWrite=!overlay;m.castShadow=!overlay;}

   if(plan)plane=new T.Plane(new T.Vector3(0,-1,0),cfg.levels[c.block][floor]+1.2);
   else if(cut){const s=cfg.views.find(v=>v.id==='cutaway').sections[c.block];plane=new T.Plane(new T.Vector3(...s.normal),s.constant);}
   for(const m of p.meshes){m.material.clippingPlanes=plane?[plane]:[];m.material.clipShadows=true;m.material.needsUpdate=true;for(const e of m.children)if(e.isLineSegments){e.visible=(!plan||c.group==='stairs')&&!overlay;e.material.clippingPlanes=plane?[plane]:[];}}
   if(p.o.visible&&plane&&!overlay){const first=caps.children.length;sectionCap(p.meshes,plane);for(const cap of caps.children.slice(first))meshMap.set(cap,p);}
  }
  document.querySelector('#view-title').textContent=titles[view][0];document.querySelector('#view-zh').textContent=titles[view][1];
  for(const b of document.querySelectorAll('[data-view]')){b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));}
  document.querySelector('#roof').disabled=plan||cut||tv;document.querySelector('#roof').checked=roof&&!plan&&!cut&&!tv;document.querySelector('#trusses').disabled=plan||tv;document.querySelector('#trusses').checked=(trusses||tv)&&!plan;
  document.querySelector('#terrain').disabled=plan||close;document.querySelector('#terrain').checked=terrain&&!plan&&!close;
  for(const key of ['upper','middle','lower'])document.querySelector('#'+key).checked=layers[key];
  for(const b of document.querySelectorAll('[data-wall]')){const active=b.dataset.wall===wallMode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  document.querySelector('#layer-hint').textContent=tv?'Timber: supplied section · Orange: schematic. 木色详图，橙色示意；支承高度待核。':plan?'Floor slice at +1.20 m / 楼层上方1.20m切片':cut?'Roof hidden for the section / 剖切视图自动隐藏屋面':'Hide the roof to explore inside / 隐藏屋面可查看内部';
  updateSelectionVisibility();
  refreshLocalModel();
  instances.refresh(selected,localModel?selected:null);
  if(reset)fit(plan?[0,1,.0001]:view.startsWith('upper')?[1,1.6,1.85]:[1,.72,1]);renderer.shadowMap.needsUpdate=true;dirty=true;
 }
 const groupText={walls:'Wall / 墙体',opening_infill:'Opening / 洞口示意',ground_slab:'Ground floor slab / 一层地坪',upper_slab:'Upper floor slab / 二层楼板',stairs:'Stair / 楼梯',roof:'Roof / 屋面',trusses:'Roof truss / 屋架',framing:'Wall framing / 木墙构件'};
 const statuses={drawing:'Drawing / 图纸明示',measured:'Measured from drawing / 图面量取',derived:'Derived / 推导',rule:'Rule-based / 规则生成',schematic:'Schematic / 示意',unknown:'Unknown / 未知'};
 function el(tag,text,cl){const e=document.createElement(tag);e.textContent=text;if(cl)e.className=cl;return e;}
 function clearSelection(){
  releaseLocalModel();
  detailLoader.release();
  if(selected)for(const m of selected.meshes)m.material.emissive.setHex(0);
  selected=null;instances.refresh(null);document.querySelector('#pin').hidden=true;document.querySelector('#clear').hidden=true;
  document.querySelector('#details').replaceChildren(el('p','Click a part of the model. 点击构件查看已有资料。','empty'));dirty=true;
 }
 // 选择只提亮当前材质；目录不写入分类色，也不改变几何身份。
 function select(p){
  clearSelection();if(!p)return;selected=p;for(const m of p.meshes)m.material.emissive.copy(m.material.color).multiplyScalar(.24);
  instances.refresh(p);
  renderDetails(p,p.c);
  if(p.c.detail){
   const status=el('p','Loading component data / 正在读取构件资料','detail-status');
   status.setAttribute('role','status');document.querySelector('#details').append(status);
   detailLoader.load(p.c,env.meta.project).then(data=>{if(selected===p){renderDetails(p,data);dirty=true;}}).catch(error=>{if(error.name!=='AbortError'&&selected===p)status.textContent='Component data unavailable / 构件资料暂不可用：'+error.message;});
  }
 }
 function releaseLocalModel(){
  for(const [mesh,mask] of originalLayers)mesh.layers.mask=mask;
  originalLayers=[];
  if(localModel)localModel.traverse(mesh=>meshMap.delete(mesh));
  localModel=null;
  detailLoader.releaseModel();
  instances.refresh(selected);
  renderer.shadowMap.needsUpdate=true;dirty=true;
 }
 function refreshLocalModel(){
  if(!localModel||!selected)return;
  localModel.visible=selected.o.visible;
  localModel.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const source=selected.meshes[0].material;
   mesh.material.clippingPlanes=source.clippingPlanes;
   mesh.material.transparent=source.transparent;mesh.material.opacity=source.opacity;
   mesh.material.depthWrite=source.depthWrite;mesh.material.needsUpdate=true;
  });
 }
 async function showLocalModel(p,button){
  if(localModel){releaseLocalModel();button.textContent='Load local model / 加载局部模型';return;}
  button.disabled=true;button.textContent='Loading / 正在加载';
  try{
   const group=await detailLoader.loadModel(p.c);
   if(selected!==p)return;
   group.updateMatrixWorld(true);
   const box=new T.Box3().setFromObject(group);
   if(!group.getObjectByName(p.c.id)||['min','max'].some(key=>box[key].distanceTo(p.box[key])>1e-4)){
    detailLoader.releaseModel();throw new Error('局部模型身份或坐标不符');
   }
   localModel=group;
   for(const mesh of p.meshes){originalLayers.push([mesh,mesh.layers.mask]);mesh.layers.disableAll();}
   group.traverse(mesh=>{if(mesh.isMesh){mesh.material.dispose();mesh.material=p.meshes[0].material.clone();meshMap.set(mesh,p);}});
   scene.add(group);refreshLocalModel();instances.refresh(p,p);
   button.textContent='Unload local model / 卸载局部模型';
   renderer.shadowMap.needsUpdate=true;dirty=true;
  }catch(error){
   if(error.name!=='AbortError'&&selected===p){
    button.textContent='Try local model again / 重试局部模型';
    const status=el('p','Local model unavailable / 局部模型暂不可用：'+error.message,'detail-model-status');
    status.setAttribute('role','status');button.after(status);
   }
  }
  finally{button.disabled=false;}
 }
 function renderDetails(p,c){
  const d=document.querySelector('#details');d.replaceChildren(el('h2',groupText[c.group]||c.group),el('div',c.id,'id'));
  d.append(el('span',c.block==='A'?'Lots 1–3':'Lots 4–6','chip'),el('span',c.floor==='GF'?'Ground floor / 一层':c.floor==='FF'?'First floor / 二层':c.floor,'chip'));
  if(c.role)d.append(el('p',({stud:'Stud / 立柱',king_stud:'Full-height stud / 通高边柱',jack_stud:'Lintel support / 过梁支承柱',lintel:'Lintel / 过梁',sill:'Window sill / 窗台板',bottom_plate:'Bottom plate / 底板',top_plate:'Top plate / 顶板',ribbon:'Capping plate / 天花边缘固定板',cripple:'Short stud / 短柱',nogging:'Nogging / 横撑',corner:'Corner / 转角构件'})[c.role]||c.role));
  if(c.truss_id)d.append(el('p',`Lot ${c.lot} · ${c.truss_type} · ${c.profile_status==='measured'?'Supplied section / 已有截面详图':'Schematic section / 截面示意'}`));const params=Object.entries(c.parameters||{}).filter(([key])=>key!=='shared_object'),schematic=params.some(([,v])=>v.status==='schematic');
  if(schematic)d.append(el('span','Contains schematic values / 含示意参数','chip warning'));
  for(const reference of p.c.object_refs||[]){
   d.append(el('p',`Object / 对象：${reference.object_id}`),el('p',`Revision / 修订：${reference.object_revision} · ${reference.consumption_mode==='candidate_preview'?'Design preview / 设计候选':'Source projection / 来源投影'}`));
  }
  if(c.group==='walls')d.append(el('p','Fire / Load bearing / Bracing：Unknown / 防火、承重、抗侧力属性待来源确认'));
  if(c.role==='lintel')d.append(el('span','No linked engineering result / 尚无关联工程结果','chip warning'));
  const size=p.box.getSize(new T.Vector3());d.append(el('p',`Model extents / 模型包围尺寸：${size.toArray().map(x=>x.toFixed(2)).join(' × ')} m`));
  for(const[key,value]of params){const item=el('details',''),summary=el('summary',`${key} · ${statuses[value.status]||value.status}`);item.append(summary,el('p',value.locator||'No locator'),el('p',value.note||''));d.append(item);}
  if(p.c.detail_model){const button=el('button',localModel?'Unload local model / 卸载局部模型':'Load local model / 加载局部模型','detail-model');button.onclick=()=>showLocalModel(p,button);d.append(button);}
  d.append(el('span','Selected / 已选中','chip'),el('p','','selection-visibility'));
  updateSelectionVisibility();
  d.append(el('p','Model properties only; dimensions above are bounding extents. 此处为已有模型资料，包围尺寸不等于设计截面。'));
  document.querySelector('#clear').hidden=false;dirty=true;
 }
 function isSelectionClipped(p){
  const planes=p.meshes[0]?.material.clippingPlanes||[];
  return planes.some(pl=>corners(p.box).every(point=>pl.distanceToPoint(point)<-1e-5));
 }
 function updateSelectionVisibility(){
  if(!selected)return;
  const message=document.querySelector('.selection-visibility');
  if(!message)return;
  message.textContent=!matchesCatalog(selected.c.group)?'Hidden by system filter / 已被系统筛选隐藏':!selected.o.visible?'Hidden in current view / 当前视图隐藏':isSelectionClipped(selected)?'Outside the section / 位于剖切范围之外':'';
  message.hidden=!message.textContent;
 }
 function pick(x,y){
  const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);
  const targets=[...parts.filter(p=>p.o.visible&&!(wallMode==='overlay'&&isEnvelope(p.c))).flatMap(p=>p.meshes.filter(m=>!instances.owns(m))),...instances.targets(),...caps.children];if(groundGroup.visible)groundGroup.traverse(o=>{if(o.isMesh)targets.push(o);});if(localModel?.visible)localModel.traverse(o=>{if(o.isMesh)targets.push(o);});
  const hit=ray.intersectObjects(targets,false).find(h=>h.object.visible&&!(h.object.material.clippingPlanes||[]).some(pl=>pl.distanceToPoint(h.point)<-1e-5));
  select(hit?(instances.partFor(hit)||meshMap.get(hit.object)):null);return selected?.c.id||null;
 }
 function preset(id){view=id;const upper=id.startsWith('upper'),plan=id==='gf'||id==='ff',tv=id.startsWith('truss');
  layers.upper=upper||id!=='gf';layers.middle=id!=='gf';layers.lower=!upper&&id!=='ff';
  roof=false;trusses=tv||['hero','site'].includes(id);terrain=['hero','site','cutaway'].includes(id);
  if(upper)wallMode='frame';applyView();
 }
 // 切专业只切换目录。筛选是独立状态，与原楼层及剖切取交集。
 const catalogButtons=[...document.querySelectorAll('[data-catalog]')],filterButtons=[...document.querySelectorAll('[data-catalog-filter]')];
 const allSystems=document.querySelector('#catalog-all');
 function updateCatalog(){
  for(const b of catalogButtons){const active=b.dataset.catalog===catalog;b.setAttribute('aria-pressed',String(active));document.getElementById(b.getAttribute('aria-controls')).hidden=!active;}
  for(const b of filterButtons){const active=b===catalogFilter?.button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  allSystems.setAttribute('aria-pressed',String(!catalogFilter));
  document.querySelector('#catalog-status').textContent=catalogFilter?`Filtered / 筛选：${catalogFilter.label}`:'All systems visible where enabled / 按当前视图显示全部系统';
 }
 for(const b of catalogButtons)b.onclick=()=>{catalog=b.dataset.catalog;updateCatalog();};
 for(const b of filterButtons)b.onclick=()=>{catalogFilter={button:b,groups:new Set(b.dataset.catalogFilter.split(' ')),label:b.firstChild.textContent.trim()};updateCatalog();applyView(false);};
 allSystems.onclick=()=>{if(!catalogFilter)return;catalogFilter=null;updateCatalog();applyView(false);};
 updateCatalog();
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>preset(b.dataset.view);
 for(const b of document.querySelectorAll('[data-wall]'))b.onclick=()=>{wallMode=b.dataset.wall;applyView(false);};
 for(const key of ['upper','middle','lower'])document.querySelector('#'+key).onchange=e=>{layers[key]=e.target.checked;view='hero';applyView(false);};

 document.querySelector('#trusses').onchange=e=>{trusses=e.target.checked;applyView(false);};document.querySelector('#roof').onchange=e=>{roof=e.target.checked;applyView(false);};document.querySelector('#terrain').onchange=e=>{terrain=e.target.checked;applyView(false);};
 document.querySelector('#reset').onclick=()=>applyView();document.querySelector('#clear').onclick=clearSelection;
 canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,button:e.button};});
 canvas.addEventListener('pointerup',e=>{if(down&&down.button===0&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<4)pick(e.clientX,e.clientY);down=null;});
 canvas.addEventListener('keydown',e=>{if(e.key==='Escape')clearSelection();if(e.key.toLowerCase()==='r')applyView();});canvas.tabIndex=0;
 controls.addEventListener('change',()=>dirty=true);
 function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);if(initialized)fit(camera.position.clone().sub(controls.target).toArray());else{const half=(camera.top-camera.bottom)/2;camera.left=-half*w/h;camera.right=half*w/h;camera.updateProjectionMatrix();}dirty=true;}
 new ResizeObserver(resize).observe(viewport);resize();applyView();initialized=true;
 function draw(){requestAnimationFrame(draw);controls.update();if(!dirty)return;dirty=false;renderer.render(scene,camera);
  const pin=document.querySelector('#pin');if(selected){const center=selected.box.getCenter(new T.Vector3()),q=center.clone().project(camera),x=(q.x*.5+.5)*viewport.clientWidth,y=(.5-q.y*.5)*viewport.clientHeight;pin.textContent=selected.c.id;pin.hidden=!selected.o.visible||(selected.meshes[0]?.material.clippingPlanes||[]).some(pl=>pl.distanceToPoint(center)<-1e-5)||q.z<-1||q.z>1||Math.abs(q.x)>1||Math.abs(q.y)>1;pin.style.left=Math.min(viewport.clientWidth-100,Math.max(8,x+12))+'px';pin.style.top=Math.max(8,y-24)+'px';}}
 window.viewer={state:()=>({view,visible:parts.filter(p=>p.o.visible).length,total:parts.length,wallMode,layers:{...layers},groups:Object.fromEntries([...new Set(parts.map(p=>p.c.group))].map(g=>[g,parts.filter(p=>p.c.group===g&&p.o.visible).length])),upperEnvelope:parts.filter(p=>isEnvelope(p.c)&&p.o.visible).length,framing:parts.filter(p=>p.c.group==='framing'&&p.o.visible).length,opacity:wallMode==='overlay'?.10:1,trusses:parts.filter(p=>p.c.group==='trusses'&&p.o.visible).length,terrain:groundGroup.visible,roof:parts.filter(p=>p.c.group==='roof'&&p.o.visible).length,caps:caps.children.length,selected:selected?.c.id||null,objectRefs:selected?.c.object_refs||[],detail:detailLoader.state(),selectedInstanced:selected?.meshes.some(mesh=>instances.owns(mesh))||false,instances:instances.stats(),renderCalls:renderer.info.render.calls,geometryBuffers:renderer.info.memory.geometries,camera:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom,geometryUnchanged:parts.every((p,i)=>p.o.matrixWorld.toArray().every((x,j)=>Math.abs(x-baseTransforms[i][j])<1e-9))}),project:id=>{const p=parts.find(p=>p.c.id===id);if(!p)return null;const m=p.meshes[0],g=m.geometry,pos=g.attributes.position,ix=g.index;let best=-1,point=new T.Vector3();for(let i=0;i<(ix?ix.count:pos.count);i+=3){const a=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,ix?ix.getX(i+j):i+j));const area=a[1].clone().sub(a[0]).cross(a[2].clone().sub(a[0])).lengthSq();if(area>best){best=area;point.copy(a[0]).add(a[1]).add(a[2]).multiplyScalar(1/3);}}const q=point.applyMatrix4(m.matrixWorld).project(camera),rect=canvas.getBoundingClientRect();return [rect.left+(q.x*.5+.5)*rect.width,rect.top+(.5-q.y*.5)*rect.height];}};
 document.querySelector('#loading').hidden=true;window.ready=true;draw();
}
