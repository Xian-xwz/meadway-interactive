import * as T from 'three';

// 复用GLB中已验证共享的木墙架几何，命名构件继续负责显隐和剖切。
export function createInstances(scene, parts) {
  const groups = new Map();
  const batches = [];
  const membership = new Map();
  for (const part of parts) {
    if (part.c.group !== 'framing') continue;
    for (const mesh of part.meshes) {
      const material = mesh.material;
      const key = [mesh.geometry.uuid, part.c.floor, part.c.block,
        material.color.getHexString(), material.side, material.roughness].join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({part, mesh});
    }
  }
  for (const entries of groups.values()) {
    if (entries.length < 2) continue;
    const first = entries[0].mesh;
    const batch = new T.InstancedMesh(first.geometry, first.material.clone(), entries.length);
    batch.castShadow = true;
    batch.receiveShadow = true;
    batch.instanceMatrix.setUsage(T.DynamicDrawUsage);
    // 可见实例集合会随筛选改变，禁用旧包围球的整批裁剪。
    batch.frustumCulled = false;
    const record = {batch, entries, visible: []};
    batches.push(record);
    scene.add(batch);
    for (const entry of entries) {
      entry.mesh.layers.disableAll();
      membership.set(entry.mesh, record);
    }
  }
  function refresh(selected, detailedPart = null) {
    for (const record of batches) {
      const {batch, entries} = record;
      record.visible = entries.filter(entry => entry.part.o.visible && entry.part !== detailedPart);
      batch.count = record.visible.length;
      batch.visible = batch.count > 0;
      for (const [index, entry] of record.visible.entries()) {
        batch.setMatrixAt(index, entry.mesh.matrixWorld);
        batch.setColorAt(index, new T.Color().setScalar(entry.part === selected ? 1.5 : 1));
      }
      const material = entries[0].mesh.material;
      batch.material.clippingPlanes = material.clippingPlanes;
      batch.material.transparent = material.transparent;
      batch.material.opacity = material.opacity;
      batch.material.depthWrite = material.depthWrite;
      batch.material.needsUpdate = true;
      batch.instanceMatrix.needsUpdate = true;
      if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
      // Raycaster会自行测试包围球，筛选变化后按当前实例重新计算。
      batch.computeBoundingSphere();
    }
  }
  return {
    refresh,
    owns: mesh => membership.has(mesh),
    targets: () => batches.filter(record => record.batch.visible).map(record => record.batch),
    partFor: hit => {
      const record = batches.find(record => record.batch === hit.object);
      return record?.visible[hit.instanceId]?.part;
    },
    stats: () => ({
      batches: batches.length,
      members: membership.size,
      visible: batches.reduce((sum, record) => sum + record.batch.count, 0)
    })
  };
}
