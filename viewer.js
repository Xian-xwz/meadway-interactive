import {OrbitControls} from './vendor/OrbitControls.js';

export function install(env){
 const {T,scene,renderer,camera,parts,model,cfg,groundGroup,groundBoxes,stage,sun,caps,sectionCap}=env;
 const viewport=document.querySelector('#viewport'),canvas=renderer.domElement;
 if(matchMedia('(pointer: coarse)').matches)document.querySelector('.gestures').innerHTML='One finger: rotate · Two fingers: zoom / pan<br><small>单指旋转 · 双指缩放或平移 · 轻点查看构件</small>';
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.1;controls.minZoom=.25;controls.maxZoom=10;controls.maxPolarAngle=Math.PI*.495;
 renderer.shadowMap.autoUpdate=false;
 const ray=new T.Raycaster(),pointer=new T.Vector2(),titles={hero:['Whole house','整屋建筑'],site:['Building & site','建筑与场地'],cutaway:['Inside the house','剖切空间'],gf:['Ground floor','一层顶视'],ff:['First floor','二层顶视'],trusses:['Selected roof trusses','已核两类屋架 · 19榀'],trussA:['S2 · Nine trusses','S2型 · 9榀 · Lots 1–3'],trussB:['S4 · Ten trusses','S4型 · 10榀 · Lots 4–6']};
 let view='hero',roof=true,terrain=true,trusses=true,selected=null,dirty=true,down=null,initialized=false;
 const meshMap=new Map(),baseTransforms=parts.map(p=>p.o.matrixWorld.toArray());
 for(const p of parts)for(const m of p.meshes)meshMap.set(m,p);
 const corners=b=>Array.from({length:8},(_,i)=>new T.Vector3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z));
 function fit(direction){
  const close=view==='trussA'||view==='trussB',block=view==='trussA'?'A':'B';const box=new T.Box3();for(const p of parts)if(close?p.c.group==='trusses'&&p.c.block===block:p.o.visible)box.union(p.box);
  if(view==='site'&&groundGroup.visible)for(const b of groundBoxes)box.union(b);
  const center=box.getCenter(new T.Vector3());camera.zoom=1;controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(...direction).normalize().multiplyScalar(90));camera.lookAt(center);camera.updateMatrixWorld();
  const ps=corners(box).map(p=>p.applyMatrix4(camera.matrixWorldInverse)),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),aspect=viewport.clientWidth/viewport.clientHeight;
  const span=Math.max((Math.max(...ys)-Math.min(...ys))/.76/2,(Math.max(...xs)-Math.min(...xs))/aspect/.88/2);
  camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();controls.update();dirty=true;
 }
 function clearCaps(){while(caps.children.length){const c=caps.children[0];meshMap.delete(c);caps.remove(c);c.geometry.dispose();c.material.dispose();}}
 function applyView(reset=true){
  clearSelection();clearCaps();const plan=view==='gf'||view==='ff',cut=view==='cutaway',floor=view==='gf'?'GF':'FF',tv=view.startsWith('truss'),close=view==='trussA'||view==='trussB',block=view==='trussA'?'A':'B';
  groundGroup.visible=terrain&&!plan&&!close;stage.visible=!groundGroup.visible&&!plan&&!close;sun.castShadow=!plan;
  for(const p of parts){const c=p.c;let plane=null;
   p.o.visible=plan?(c.group!=='roof'&&(c.floor===floor||c.group==='stairs')):c.group==='roof'?roof&&!cut&&!tv:c.group==='trusses'?trusses||tv:true;if(close)p.o.visible=c.group==='trusses'&&c.block===block;
   if(plan)plane=new T.Plane(new T.Vector3(0,-1,0),cfg.levels[c.block][floor]+1.2);
   else if(cut){const s=cfg.views.find(v=>v.id==='cutaway').sections[c.block];plane=new T.Plane(new T.Vector3(...s.normal),s.constant);}
   for(const m of p.meshes){m.material.clippingPlanes=plane?[plane]:[];m.material.clipShadows=true;m.material.needsUpdate=true;for(const e of m.children)if(e.isLineSegments){e.visible=!plan||c.group==='stairs';e.material.clippingPlanes=plane?[plane]:[];}}
   if(p.o.visible&&plane){const first=caps.children.length;sectionCap(p.meshes,plane);for(const cap of caps.children.slice(first))meshMap.set(cap,p);}
  }
  document.querySelector('#view-title').textContent=titles[view][0];document.querySelector('#view-zh').textContent=titles[view][1];
  for(const b of document.querySelectorAll('[data-view]')){b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));}
  document.querySelector('#roof').disabled=plan||cut||tv;document.querySelector('#roof').checked=roof&&!plan&&!cut&&!tv;document.querySelector('#trusses').disabled=plan||tv;document.querySelector('#trusses').checked=(trusses||tv)&&!plan;
  document.querySelector('#terrain').disabled=plan||close;document.querySelector('#terrain').checked=terrain&&!plan&&!close;
  document.querySelector('#layer-hint').textContent=tv?'19 selected trusses; bearings schematic. 仅两类19榀，支承高度示意。':plan?'Floor slice at +1.20 m / 楼层上方1.20m切片':cut?'Roof hidden for the section / 剖切视图自动隐藏屋面':'Hide the roof to explore inside / 隐藏屋面可查看内部';
  if(reset)fit(plan?[0,1,.0001]:[1,.72,1]);renderer.shadowMap.needsUpdate=true;dirty=true;
 }
 const groupText={walls:'Wall / 墙体',opening_infill:'Opening / 洞口示意',ground_slab:'Ground floor slab / 一层地坪',upper_slab:'Upper floor slab / 二层楼板',stairs:'Stair / 楼梯',roof:'Roof / 屋面',trusses:'Roof truss / 屋架'};
 const statuses={drawing:'Drawing / 图纸明示',measured:'Measured from drawing / 图面量取',derived:'Derived / 推导',rule:'Rule-based / 规则生成',schematic:'Schematic / 示意',unknown:'Unknown / 未知'};
 function el(tag,text,cl){const e=document.createElement(tag);e.textContent=text;if(cl)e.className=cl;return e;}
 function clearSelection(){
  if(selected)for(const m of selected.meshes)m.material.emissive.setHex(0);
  selected=null;document.querySelector('#pin').hidden=true;document.querySelector('#clear').hidden=true;
  document.querySelector('#details').replaceChildren(el('p','Click a part of the model. 点击构件查看已有资料。','empty'));dirty=true;
 }
 function select(p){
  clearSelection();if(!p)return;selected=p;for(const m of p.meshes)m.material.emissive.set('#194a3e');
  const c=p.c,d=document.querySelector('#details');d.replaceChildren(el('h2',groupText[c.group]||c.group),el('div',c.id,'id'));
  d.append(el('span',c.block==='A'?'Lots 1–3':'Lots 4–6','chip'),el('span',c.floor==='GF'?'Ground floor / 一层':c.floor==='FF'?'First floor / 二层':c.floor,'chip'));
  if(c.truss_id)d.append(el('p',`${c.truss_type} · ${c.truss_id} · Part of a selected group / 局部屋架组`));const params=Object.entries(c.parameters||{}),schematic=params.some(([,v])=>v.status==='schematic');
  if(schematic)d.append(el('span','Contains schematic values / 含示意参数','chip warning'));
  const size=p.box.getSize(new T.Vector3());d.append(el('p',`Model extents / 模型包围尺寸：${size.toArray().map(x=>x.toFixed(2)).join(' × ')} m`));
  for(const[key,value]of params){const item=el('details',''),summary=el('summary',`${key} · ${statuses[value.status]||value.status}`);item.append(summary,el('p',value.locator||'No locator'),el('p',value.note||''));d.append(item);}
  d.append(el('p','Model properties only; dimensions above are bounding extents. 此处为已有模型资料，包围尺寸不等于设计截面。'));
  document.querySelector('#clear').hidden=false;dirty=true;
 }
 function pick(x,y){
  const rect=canvas.getBoundingClientRect();pointer.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);
  const targets=[...parts.filter(p=>p.o.visible).flatMap(p=>p.meshes),...caps.children];if(groundGroup.visible)groundGroup.traverse(o=>{if(o.isMesh)targets.push(o);});
  const hit=ray.intersectObjects(targets,false).find(h=>h.object.visible&&!(h.object.material.clippingPlanes||[]).some(pl=>pl.distanceToPoint(h.point)<-1e-5));
  select(hit?meshMap.get(hit.object):null);return selected?.c.id||null;
 }
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;applyView();};
 document.querySelector('#trusses').onchange=e=>{trusses=e.target.checked;applyView(false);};document.querySelector('#roof').onchange=e=>{roof=e.target.checked;applyView(false);};document.querySelector('#terrain').onchange=e=>{terrain=e.target.checked;applyView(false);};
 document.querySelector('#reset').onclick=()=>applyView();document.querySelector('#clear').onclick=clearSelection;
 canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,button:e.button};});
 canvas.addEventListener('pointerup',e=>{if(down&&down.button===0&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<4)pick(e.clientX,e.clientY);down=null;});
 canvas.addEventListener('keydown',e=>{if(e.key==='Escape')clearSelection();if(e.key.toLowerCase()==='r')applyView();});canvas.tabIndex=0;
 controls.addEventListener('change',()=>dirty=true);
 function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);if(initialized)fit(camera.position.clone().sub(controls.target).toArray());else{const half=(camera.top-camera.bottom)/2;camera.left=-half*w/h;camera.right=half*w/h;camera.updateProjectionMatrix();}dirty=true;}
 new ResizeObserver(resize).observe(viewport);resize();applyView();initialized=true;
 function draw(){requestAnimationFrame(draw);controls.update();if(!dirty)return;dirty=false;renderer.render(scene,camera);
  const pin=document.querySelector('#pin');if(selected){const q=selected.box.getCenter(new T.Vector3()).project(camera),x=(q.x*.5+.5)*viewport.clientWidth,y=(.5-q.y*.5)*viewport.clientHeight;pin.textContent=selected.c.id;pin.hidden=q.z<-1||q.z>1||Math.abs(q.x)>1||Math.abs(q.y)>1;pin.style.left=Math.min(viewport.clientWidth-100,Math.max(8,x+12))+'px';pin.style.top=Math.max(8,y-24)+'px';}}
 window.viewer={state:()=>({view,visible:parts.filter(p=>p.o.visible).length,total:parts.length,trusses:parts.filter(p=>p.c.group==='trusses'&&p.o.visible).length,terrain:groundGroup.visible,roof:parts.filter(p=>p.c.group==='roof'&&p.o.visible).length,caps:caps.children.length,selected:selected?.c.id||null,camera:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom,geometryUnchanged:parts.every((p,i)=>p.o.matrixWorld.toArray().every((x,j)=>Math.abs(x-baseTransforms[i][j])<1e-9))}),project:id=>{const p=parts.find(p=>p.c.id===id);if(!p)return null;const m=p.meshes[0],g=m.geometry,pos=g.attributes.position,ix=g.index;let best=-1,point=new T.Vector3();for(let i=0;i<(ix?ix.count:pos.count);i+=3){const a=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,ix?ix.getX(i+j):i+j));const area=a[1].clone().sub(a[0]).cross(a[2].clone().sub(a[0])).lengthSq();if(area>best){best=area;point.copy(a[0]).add(a[1]).add(a[2]).multiplyScalar(1/3);}}const q=point.applyMatrix4(m.matrixWorld).project(camera),rect=canvas.getBoundingClientRect();return [rect.left+(q.x*.5+.5)*rect.width,rect.top+(.5-q.y*.5)*rect.height];}};
 document.querySelector('#loading').hidden=true;window.ready=true;draw();
}
