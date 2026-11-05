// 单次选择只保留一份资料和一份局部模型，过期响应无法覆盖当前选择。
export function createDetailLoader(baseURL, gltfLoader) {
  let controller = null;
  let modelController = null;
  let current = null;
  let localModel = null;
  let sourceController = null;
  let sourceURL = null;

  function releaseSource() {
    sourceController?.abort();sourceController = null;
    if (sourceURL) URL.revokeObjectURL(sourceURL);
    sourceURL = null;
  }

  function dispose(model) {
    model.traverse(node => {
      if (!node.isMesh) return;
      node.geometry.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        material.dispose();
      }
    });
    model.removeFromParent();
  }
  function releaseModel() {
    modelController?.abort();
    modelController = null;
    if (localModel) dispose(localModel);
    localModel = null;
  }
  function release() {
    controller?.abort();
    controller = null;
    current = null;
    releaseModel();
    releaseSource();
  }
  async function readFile(relativePath, expectedHash, active) {
    if (!/^[a-f0-9]{64}$/.test(expectedHash || "")) throw new Error("构件资源缺少修订摘要");
    const url = new URL(relativePath, baseURL);
    const base = new URL('.', baseURL);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
      throw new Error('构件资料路径超出模型包');
    }
    const response = await fetch(url, {signal: active.signal});
    if (!response.ok) throw new Error('构件资料读取失败 ' + response.status);
    const buffer = await response.arrayBuffer();
    if (expectedHash) {
      const hash = await crypto.subtle.digest('SHA-256', buffer);
      const actual = Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
      if (actual !== expectedHash) throw new Error('构件资料修订摘要不符');
    }
    if (active.signal.aborted) throw new DOMException('选择已改变', 'AbortError');
    return buffer;
  }
  async function load(component, project) {
    release();
    if (!component.detail) return component;
    const active = new AbortController();
    controller = active;
    try {
      const buffer = await readFile(component.detail, component.detail_sha256, active);
      const data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(buffer));
      if (active.signal.aborted) throw new DOMException('选择已改变', 'AbortError');
      if (data.project !== project || data.component?.id !== component.id) {
        throw new Error('构件资料身份不符');
      }
      for (const reference of component.object_refs || []) {
        const actual = data.component.parameters?.shared_object?.[reference.object_id];
        if (!actual || ['project_id', 'object_revision', 'source_revision', 'design_revision', 'input_digest']
          .some(key => actual[key] !== reference[key])) {
          throw new Error('构件对象修订不符');
        }
      }
      current = data.component;
      return current;
    } finally {
      if (controller === active) controller = null;
    }
  }
  async function loadModel(component) {
    releaseModel();
    const active = new AbortController();
    modelController = active;
    try {
      const buffer = await readFile(component.detail_model.path, component.detail_model.sha256, active);
      const result = await gltfLoader.parseAsync(buffer, new URL('.', baseURL).href);
      if (active.signal.aborted) {
        dispose(result.scene);
        throw new DOMException('选择已改变', 'AbortError');
      }
      localModel = result.scene;
      return localModel;
    } finally {
      if (modelController === active) modelController = null;
    }
  }
  async function loadSource(source) {
    releaseSource();
    const types = ['image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/markdown'];
    if (!types.includes(source.mime)) throw new Error('来源格式暂不支持');
    const active = new AbortController();sourceController = active;
    try {
      const buffer = await readFile(source.path, source.sha256, active);
      sourceURL = URL.createObjectURL(new Blob([buffer], {type: source.mime === 'text/markdown' ? 'text/plain' : source.mime}));
      return sourceURL;
    } finally { if (sourceController === active) sourceController = null; }
  }
  return {
    load, loadModel, loadSource, releaseSource, release, releaseModel,
    state: () => ({loaded: current?.id || null, active: Boolean(controller),
      sourceLoaded: Boolean(sourceURL), sourcePending: Boolean(sourceController),
      modelLoaded: Boolean(localModel), modelPending: Boolean(modelController)})
  };
}
