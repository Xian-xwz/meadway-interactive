
import * as T from 'three';import {GLTFLoader} from './vendor/GLTFLoader.js';
const [cfg,meta]=await Promise.all([fetch('./scene.json').then(r=>r.json()),fetch('./metadata.json').then(r=>r.json())]);
const palette={wall:'#dfd6c1',opening:'#d8c9a7',floor:'#bbb5a2',roof:'#476e67',stairs:'#b69563',cut:'#526e64',...cfg.palette};
const scene=new T.Scene();scene.background=new T.Color('#f3efe5');const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.querySelector('#viewport').prepend(renderer.domElement);
scene.add(new T.HemisphereLight(0xfffaef,0xb5bdae,1.7));const sun=new T.DirectionalLight(0xfff5e1,2.6);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;
const camera=new T.OrthographicCamera(-20,20,12,-12,.01,500),model=(await new GLTFLoader().loadAsync('./model.glb')).scene;scene.add(model);model.updateMatrixWorld(true);
const byName=new Map();model.traverse(o=>{if(o.name){if(byName.has(o.name))throw Error('重复模型ID '+o.name);byName.set(o.name,o);}});
const parts=[],boxes=[],roofAngles=[],caps=new T.Group();scene.add(caps);const edges=[];
for(const c of meta.components){const o=byName.get(c.id);if(!o)throw Error('缺失命名实体 '+c.id);const box=new T.Box3().setFromObject(o),actual={id:c.id,group:c.group,floor:c.floor,block:c.block,min:box.min.toArray(),max:box.max.toArray()};
 for(const k of ['min','max'])for(let i=0;i<3;i++)if(Math.abs(actual[k][i]-c.bbox[k][i])>.0001)throw Error('GLB与元数据不符 '+c.id);boxes.push(actual);
 const meshes=[];o.traverse(m=>{if(!m.isMesh)return;meshes.push(m);m.castShadow=true;m.receiveShadow=true;m.material=new T.MeshStandardMaterial({color:c.group==='framing'?(['lintel','sill','corner'].includes(c.role)?'#c18d45':'#cdb27a'):(palette[c.material]||palette.wall),metalness:0,roughness:.92,side:T.DoubleSide});
  // 木架以实体显示，不再先生成边线再丢弃；其余构件保留原有轮廓线。
  if(c.group!=='framing'){const edge=new T.LineSegments(new T.EdgesGeometry(m.geometry,28),new T.LineBasicMaterial({color:palette.cut,transparent:true,opacity:c.group==='roof'?.24:.12}));m.add(edge);edge.userData.group=c.group;edges.push(edge);}
  if(c.group==='roof'){const pos=m.geometry.attributes.position,idx=m.geometry.index,arr=idx?Array.from(idx.array):Array.from({length:pos.count},(_,i)=>i);for(let j=0;j<arr.length;j+=3){const p=arr.slice(j,j+3).map(i=>new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld));const n=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])),area=n.length()/2;n.normalize();if(Math.abs(n.y)>.1&&Math.abs(n.y)<.999)roofAngles.push({id:c.id,group:c.group,block:c.block,angle:T.MathUtils.radToDeg(Math.acos(Math.abs(n.y))),area});}}
 });parts.push({c,o,box,meshes});}
const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),extent=Math.max(size.x,size.z);
sun.position.copy(center).add(new T.Vector3(-extent,extent*1.8,extent));sun.target.position.copy(center);Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:.1,far:extent*6});sun.shadow.camera.updateProjectionMatrix();
// 透明承影面与固定画布分开，灯光不再改变画布米白色。
const stage=new T.Mesh(new T.PlaneGeometry(extent*4,extent*4),new T.ShadowMaterial({opacity:.12}));stage.rotation.x=-Math.PI/2;stage.position.set(center.x,bounds.min.y-.03,center.z);stage.receiveShadow=true;scene.add(stage);
const groundGroup=new T.Group(),groundBoxes=[],groundReport={included:false};scene.add(groundGroup);
let terrainMesh,soilMesh,groundData;
if(cfg.ground){
 const data=await fetch('./ground.json').then(r=>r.json());groundData=data;const existing=data.surfaces.find(s=>s.kind==='existing'),finished=data.surfaces.find(s=>s.kind==='finished');
 const geometry=s=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(s.vertices.flat(),3));g.setIndex(s.triangles.flat());g.computeVertexNormals();return g;};
 const terrain=new T.Mesh(geometry(finished),new T.MeshStandardMaterial({color:'#cbd0b9',roughness:1,side:T.DoubleSide}));terrainMesh=terrain;terrain.name=finished.id;terrain.receiveShadow=true;groundGroup.add(terrain);groundBoxes.push(new T.Box3().setFromObject(terrain));
 // 展示土块下缘只用于截取视窗，不表示开挖深度或基础底标高。
 const side=[];for(let i=0;i<finished.edge.length;i++){const a=finished.edge[i],b=finished.edge[(i+1)%finished.edge.length],c=[a[0],data.base_y,a[2]],d=[b[0],data.base_y,b[2]];side.push(...a,...b,...c,...b,...d,...c);}
 const sideGeometry=new T.BufferGeometry();sideGeometry.setAttribute('position',new T.Float32BufferAttribute(side,3));sideGeometry.computeVertexNormals();const soil=new T.Mesh(sideGeometry,new T.MeshStandardMaterial({color:'#c6b795',roughness:1,side:T.DoubleSide}));soilMesh=soil;groundGroup.add(soil);groundBoxes.push(new T.Box3().setFromObject(soil));
 // 现状等高线仅显示在未整地区域；不把示意平台的边界冒充原等高线。
 const lines=[];for(const tri of existing.triangles){const a=tri.map(i=>existing.vertices[i]);if(tri.some(i=>Math.abs(existing.vertices[i][1]-finished.vertices[i][1])>.015))continue;const lo=Math.ceil(Math.min(...a.map(p=>p[1]))/.25)*.25,hi=Math.max(...a.map(p=>p[1]));for(let y=lo;y<hi;y+=.25){const hits=[];for(let j=0;j<3;j++){const p=a[j],q=a[(j+1)%3];if((p[1]-y)*(q[1]-y)<0){const t=(y-p[1])/(q[1]-p[1]);hits.push(p[0]+t*(q[0]-p[0]),y+.014,p[2]+t*(q[2]-p[2]));}}if(hits.length===6)lines.push(...hits);}}
 const contourGeometry=new T.BufferGeometry();contourGeometry.setAttribute('position',new T.Float32BufferAttribute(lines,3));groundGroup.add(new T.LineSegments(contourGeometry,new T.LineBasicMaterial({color:'#7c927d',transparent:true,opacity:.3})));
 const outlines=[];for(const p of data.platforms){const poly=p.polygon;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];outlines.push(a[0],p.fgl+.018,-a[1],b[0],p.fgl+.018,-b[1]);}}
 const outlineGeometry=new T.BufferGeometry();outlineGeometry.setAttribute('position',new T.Float32BufferAttribute(outlines,3));groundGroup.add(new T.LineSegments(outlineGeometry,new T.LineBasicMaterial({color:'#4f7766',transparent:true,opacity:.85})));
 Object.assign(groundReport,{included:true,frame:data.frame,surface_ids:[existing.id,finished.id],vertex_count:finished.vertices.length,triangles:finished.triangles.length,existing_range:[Math.min(...existing.vertices.map(p=>p[1])),Math.max(...existing.vertices.map(p=>p[1]))],platforms:data.platforms.map(p=>({id:p.id,ffl:p.ffl,fgl:p.fgl})),base_status:data.base_status});
}
// 从实际三角网格与剖切平面的交线构造切面，保留洞口；不拿事实表另造一套模型。
function sectionCap(meshes,plane){
 const n=plane.normal,u=new T.Vector3(0,1,0);if(Math.abs(n.y)>.9)u.set(1,0,0);u.cross(n).normalize();const v=n.clone().cross(u).normalize(),origin=n.clone().multiplyScalar(-plane.constant),segments=new Map(),points=new Map(),key=p=>p.toArray().map(x=>Math.round(x*1e5)).join(',');
 for(const mesh of meshes){const position=mesh.geometry.attributes.position,index=mesh.geometry.index,ids=index?Array.from(index.array):Array.from({length:position.count},(_,i)=>i);
 for(let j=0;j<ids.length;j+=3){const tri=ids.slice(j,j+3).map(i=>new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld)),cross=[];
  for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],da=plane.distanceToPoint(a),db=plane.distanceToPoint(b);if(da*db<0)cross.push(a.clone().lerp(b,da/(da-db)));else if(Math.abs(da)<1e-7)cross.push(a.clone());}
  const unique=[...new Map(cross.map(p=>[key(p),p])).values()];if(unique.length!==2)continue;const [a,b]=unique,ka=key(a),kb=key(b),s=[ka,kb].sort().join('|');segments.set(s,[ka,kb]);points.set(ka,a);points.set(kb,b);
 }
 }
 const adjacency=new Map();for(const [s,[a,b]] of segments){for(const [x,y]of[[a,b],[b,a]]){if(!adjacency.has(x))adjacency.set(x,[]);adjacency.get(x).push([s,y]);}}
 const used=new Set(),loops=[];for(const [s,[a,b]]of segments){if(used.has(s))continue;used.add(s);const loop=[a,b];let current=b;while(current!==a){const next=(adjacency.get(current)||[]).find(([edge])=>!used.has(edge));if(!next)break;used.add(next[0]);current=next[1];loop.push(current);if(loop.length>segments.size+1)break;}if(current===a&&loop.length>=4)loops.push(loop.slice(0,-1).map(k=>{const d=points.get(k).clone().sub(origin);return new T.Vector2(d.dot(u),d.dot(v));}));}
 const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
 loops.sort((a,b)=>Math.abs(T.ShapeUtils.area(b))-Math.abs(T.ShapeUtils.area(a)));const roots=[];
 for(const loop of loops){const parent=roots.find(r=>inside(loop[0],r.loop));if(parent)parent.shape.holes.push(new T.Path(loop));else roots.push({loop,shape:new T.Shape(loop)});}
 for(const r of roots){const geom=new T.ShapeGeometry(r.shape),basis=new T.Matrix4().makeBasis(u,v,n);basis.setPosition(origin.clone().addScaledVector(n,.0003));geom.applyMatrix4(basis);const cap=new T.Mesh(geom,new T.MeshStandardMaterial({color:palette.cut,roughness:1,side:T.DoubleSide}));caps.add(cap);}
}
const corners=box=>[0,1,2,3,4,5,6,7].map(i=>new T.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z));
function fit(view,w,h){camera.up.set(0,1,0);const target=center.clone();if(view.kind==='plan'){camera.up.set(0,0,-1);camera.position.copy(target).add(new T.Vector3(0,80,0));}else camera.position.copy(target).add(new T.Vector3(...(view.direction||[1,.85,1])).normalize().multiplyScalar(extent*2));camera.lookAt(target);camera.updateMatrixWorld();
 if(view.bounds){const[x0,y0,x1,y1]=view.bounds;camera.position.set((x0+x1)/2,80,-(y0+y1)/2);camera.lookAt((x0+x1)/2,0,-(y0+y1)/2);camera.top=(y1-y0)/2;camera.bottom=-camera.top;camera.left=-(x1-x0)/2;camera.right=-camera.left;}
 else{const pts=[...parts.filter(p=>view.kind==='plan'&&!view.block?p.c.group!=='roof':p.o.visible).flatMap(p=>corners(p.box)),...(groundGroup.visible?groundBoxes.flatMap(corners):[])].map(p=>p.applyMatrix4(camera.matrixWorldInverse)),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;const area=view.clean?[.03,.97,.03,.97]:[.07,.93,.20,.84],fracW=area[1]-area[0],fracH=area[3]-area[2],span=Math.max((Math.max(...ys)-Math.min(...ys))/2/fracH,(Math.max(...xs)-Math.min(...xs))/2/(w/h)/fracW);const centerNdcY=1-area[2]-area[3];camera.left=-span*w/h+cx;camera.right=span*w/h+cx;camera.top=span+cy-centerNdcY*span;camera.bottom=-span+cy-centerNdcY*span;}
 camera.updateProjectionMatrix();camera.updateMatrixWorld();}

const {install}=await import('./viewer.js');install({T,cfg,meta,scene,renderer,camera,model,parts,groundGroup,groundBoxes,groundData,stage,sun,caps,sectionCap});
