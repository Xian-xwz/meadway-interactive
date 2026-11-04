"""离线整理本案例的静态 CAD GLB：保留构件与三角形，仅合并同材质面。"""
import argparse
import copy
import hashlib
import json
import os
import tempfile
import struct
from collections import Counter, defaultdict
from pathlib import Path


def require(condition, message="GLB 格式或等价校验失败"):
    if not condition:
        raise ValueError(message)


def load(path):
    raw = Path(path).read_bytes()
    require(struct.unpack_from('<4sII', raw) == (b'glTF', 2, len(raw)))
    size, kind = struct.unpack_from('<II', raw, 12)
    require(kind == 0x4E4F534A)
    doc = json.loads(raw[20:20 + size])
    length, kind = struct.unpack_from('<II', raw, 20 + size)
    require(kind == 0x004E4942)
    return doc, raw[28 + size:28 + size + length]


def reachable(doc):
    found = set()
    def visit(i):
        if i in found:
            return
        found.add(i)
        for child in doc['nodes'][i].get('children', []):
            visit(child)
    for scene in doc['scenes']:
        for i in scene.get('nodes', []):
            visit(i)
    return sorted(found)


def values(doc, binary, i):
    a = doc['accessors'][i]
    require(not a.get('sparse') and not a.get('normalized'))
    view = doc['bufferViews'][a['bufferView']]
    require(view['buffer'] == 0)
    fmt = {5126: 'f', 5123: 'H', 5125: 'I', 5121: 'B'}[a['componentType']]
    width = {'VEC3': 3, 'SCALAR': 1}[a['type']]
    unpack = struct.Struct('<' + fmt * width)
    start = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = view.get('byteStride', unpack.size)
    return [unpack.unpack_from(binary, start + j * stride) for j in range(a['count'])]


def signature(doc, binary, mesh):
    # 按三角形的有向顶点、逐顶点法线和材质计数，保留重叠面数量。
    triangles = Counter()
    for p in mesh['primitives']:
        pos = values(doc, binary, p['attributes']['POSITION'])
        normals = values(doc, binary, p['attributes']['NORMAL'])
        ids = [v[0] for v in values(doc, binary, p['indices'])]
        require(len(ids) % 3 == 0)
        for i in range(0, len(ids), 3):
            data = b''.join(struct.pack('<6f', *pos[j], *normals[j]) for j in ids[i:i + 3])
            triangles[(p.get('material'), data)] += 1
    return triangles


def compact(source, destination):
    require(Path(source).resolve() != Path(destination).resolve(), '输出必须为独立派生文件')
    doc, binary = load(source)
    # 当前合同只接静态、无纹理的本案例格式；新类型显式失败，防止静默丢失。
    require(set(doc) <= {'asset', 'accessors', 'bufferViews', 'buffers', 'materials', 'meshes', 'nodes', 'scene', 'scenes'})
    require(len(doc['buffers']) == 1 and 'uri' not in doc['buffers'][0])
    node_ids = reachable(doc)
    mesh_ids = sorted({doc['nodes'][i]['mesh'] for i in node_ids if 'mesh' in doc['nodes'][i]})
    out = copy.deepcopy(doc)
    out['nodes'] = [copy.deepcopy(doc['nodes'][i]) for i in node_ids]
    nmap = {old: new for new, old in enumerate(node_ids)}
    mmap = {old: new for new, old in enumerate(mesh_ids)}
    for node in out['nodes']:
        require(set(node) <= {'name', 'mesh', 'children', 'matrix', 'translation', 'rotation', 'scale', 'extras'})
        if 'children' in node:
            node['children'] = [nmap[i] for i in node['children']]
        if 'mesh' in node:
            node['mesh'] = mmap[node['mesh']]
    for scene in out['scenes']:
        scene['nodes'] = [nmap[i] for i in scene.get('nodes', [])]
    out['accessors'], out['bufferViews'], out['meshes'] = [], [], []
    payload = bytearray()

    def emit(rows, kind, component, target):
        payload.extend(b'\x00' * (-len(payload) % 4))
        start = len(payload)
        pack = struct.Struct('<' + ('3f' if kind == 'VEC3' else 'I'))
        for row in rows:
            payload.extend(pack.pack(*row))
        view = len(out['bufferViews'])
        out['bufferViews'].append({'buffer': 0, 'byteOffset': start, 'byteLength': len(payload) - start, 'target': target})
        a = {'bufferView': view, 'componentType': component, 'count': len(rows), 'type': kind}
        if kind == 'VEC3':
            a.update(min=[min(r[i] for r in rows) for i in range(3)], max=[max(r[i] for r in rows) for i in range(3)])
        out['accessors'].append(a)
        return len(out['accessors']) - 1

    before_count, triangle_count = 0, 0
    for old in mesh_ids:
        mesh = doc['meshes'][old]
        require(set(mesh) <= {'name', 'primitives', 'extras'})
        groups = defaultdict(list)
        for p in mesh['primitives']:
            require(set(p) <= {'attributes', 'indices', 'material', 'mode'})
            require(p.get('mode', 4) == 4 and set(p['attributes']) == {'POSITION', 'NORMAL'})
            groups[p.get('material')].append(p)
        new_mesh = {k: copy.deepcopy(v) for k, v in mesh.items() if k != 'primitives'}
        new_mesh['primitives'] = []
        for material, primitives in groups.items():
            positions, normals, indices = [], [], []
            for p in primitives:
                ps = values(doc, binary, p['attributes']['POSITION'])
                ns = values(doc, binary, p['attributes']['NORMAL'])
                ix = values(doc, binary, p['indices'])
                require(len(ps) == len(ns) and len(ix) % 3 == 0)
                require(all(0 <= i[0] < len(ps) for i in ix))
                indices.extend((i[0] + len(positions),) for i in ix)
                positions.extend(ps)
                normals.extend(ns)
            primitive = {'attributes': {'POSITION': emit(positions, 'VEC3', 5126, 34962), 'NORMAL': emit(normals, 'VEC3', 5126, 34962)}, 'indices': emit(indices, 'SCALAR', 5125, 34963), 'mode': 4}
            if material is not None:
                primitive['material'] = material
            new_mesh['primitives'].append(primitive)
        out['meshes'].append(new_mesh)
        original = signature(doc, binary, mesh)
        require(original == signature(out, payload, new_mesh), str(mesh.get('name', old)))
        triangle_count += sum(original.values())
        before_count += len(mesh['primitives'])
    out['buffers'] = [{'byteLength': len(payload)}]
    header = json.dumps(out, separators=(',', ':'), ensure_ascii=False).encode('utf8')
    header += b' ' * (-len(header) % 4)
    payload.extend(b'\x00' * (-len(payload) % 4))
    result = struct.pack('<4sII', b'glTF', 2, 28 + len(header) + len(payload)) + struct.pack('<II', len(header), 0x4E4F534A) + header + struct.pack('<II', len(payload), 0x004E4942) + payload
    # 写入同目录临时文件，完整回读通过后原子替换；失败保留既有候选。
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=Path(destination).parent, suffix='.glb', delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(result)
        # 回读磁盘文件，再核每个构件的三角形和节点变换，而非只验证内存结果。
        saved, saved_bin = load(temporary)
        for old, new in mmap.items():
            require(signature(doc, binary, doc['meshes'][old]) == signature(saved, saved_bin, saved['meshes'][new]))
        for old, new in nmap.items():
            a, b = doc['nodes'][old], saved['nodes'][new]
            require({k: v for k, v in a.items() if k not in ('mesh', 'children')} == {k: v for k, v in b.items() if k not in ('mesh', 'children')})
            require([nmap[i] for i in a.get('children', [])] == b.get('children', []))
            if 'mesh' in a:
                require(mmap[a['mesh']] == b['mesh'])
        os.replace(temporary, destination)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()
    return {'source_sha256': hashlib.sha256(Path(source).read_bytes()).hexdigest(), 'output_sha256': hashlib.sha256(result).hexdigest(), 'source_bytes': Path(source).stat().st_size, 'output_bytes': len(result), 'named_meshes': len(mesh_ids), 'reachable_nodes': len(node_ids), 'removed_unreachable_nodes': len(doc['nodes']) - len(node_ids), 'primitives_before': before_count, 'primitives_after': sum(len(m['primitives']) for m in saved['meshes']), 'triangles': triangle_count, 'triangle_positions_normals_materials_equal': True, 'node_names_transforms_hierarchy_equal': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('destination')
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    report = compact(args.source, args.destination)
    Path(args.report).write_text(json.dumps(report, indent=2), encoding='utf8')
    print(json.dumps(report))
