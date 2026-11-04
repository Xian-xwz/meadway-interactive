"""验证重打包对分离几何、交错顶点、材质边界及未知格式的行为。"""
import json
import struct
import tempfile
import subprocess
import sys
from unittest.mock import patch
import unittest
from pathlib import Path
from compact_glb import compact, load


def fixture(path, different_material=False, unsupported=False):
    vertices = [(0, 0, 0), (1, 0, 0), (0, 1, 0), (5, 0, 0), (6, 0, 0), (5, 1, 0)]
    binary = b''.join(struct.pack('<6f', *p, 0, 0, 1) for p in vertices) + struct.pack('<6H', 0, 1, 2, 0, 1, 2)
    attrs, accessors = [], []
    for offset in [0, 72]:
        attrs.append({'POSITION': len(accessors), 'NORMAL': len(accessors) + 1})
        for d in [0, 12]:
            accessors.append({'bufferView': 0, 'byteOffset': offset + d, 'componentType': 5126, 'count': 3, 'type': 'VEC3'})
    for offset in [0, 6]:
        accessors.append({'bufferView': 1, 'byteOffset': offset, 'componentType': 5123, 'count': 3, 'type': 'SCALAR'})
    if unsupported:
        attrs[0]['TEXCOORD_0'] = 0
    primitives = [{'attributes': attrs[i], 'indices': 4 + i, 'material': i if different_material else 0} for i in range(2)]
    doc = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'children': [1], 'name': 'root', 'rotation': [0, 0, 0, 1]}, {'name': 'wall', 'mesh': 0, 'translation': [2, 3, 4]}, {'name': 'orphan', 'mesh': 1}], 'meshes': [{'primitives': primitives}, {'primitives': primitives}], 'materials': [{}, {}], 'buffers': [{'byteLength': len(binary)}], 'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': 144, 'byteStride': 24}, {'buffer': 0, 'byteOffset': 144, 'byteLength': 12}], 'accessors': accessors}
    data = json.dumps(doc).encode()
    data += b' ' * (-len(data) % 4)
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 28 + len(data) + len(binary)) + struct.pack('<II', len(data), 0x4E4F534A) + data + struct.pack('<II', len(binary), 0x004E4942) + binary)


class CompactTest(unittest.TestCase):
    def test_disconnected_triangles_keep_gap_and_transform(self):
        with tempfile.TemporaryDirectory() as d:
            src, dst = Path(d) / 'src.glb', Path(d) / 'dst.glb'
            fixture(src)
            report = compact(src, dst)
            doc, _ = load(dst)
            self.assertEqual(report['primitives_after'], 1)
            self.assertEqual(report['triangles'], 2)
            self.assertEqual(report['removed_unreachable_nodes'], 1)
            self.assertEqual(doc['nodes'][1]['translation'], [2, 3, 4])
            self.assertTrue(report['triangle_positions_normals_materials_equal'])

    def test_material_boundary_kept(self):
        with tempfile.TemporaryDirectory() as d:
            src, dst = Path(d) / 'src.glb', Path(d) / 'dst.glb'
            fixture(src, different_material=True)
            self.assertEqual(compact(src, dst)['primitives_after'], 2)

    def test_unknown_attribute_and_in_place_refused(self):
        with tempfile.TemporaryDirectory() as d:
            src, dst = Path(d) / 'src.glb', Path(d) / 'dst.glb'
            fixture(src, unsupported=True)
            original = src.read_bytes()
            with self.assertRaises(ValueError):
                compact(src, dst)
            self.assertFalse(dst.exists())
            with self.assertRaises(ValueError):
                compact(src, src)
            self.assertEqual(src.read_bytes(), original)

    def test_optimized_python_preserves_contract(self):
        with tempfile.TemporaryDirectory() as d:
            src, dst = Path(d) / 'src.glb', Path(d) / 'dst.glb'
            fixture(src, unsupported=True)
            dst.write_bytes(b'previous candidate')
            script = Path(__file__).with_name('compact_glb.py')
            result = subprocess.run([sys.executable, '-O', str(script), str(src), str(dst), '--report', str(Path(d) / 'report.json')], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(dst.read_bytes(), b'previous candidate')

    def test_failed_readback_keeps_existing_candidate(self):
        with tempfile.TemporaryDirectory() as d:
            src, dst = Path(d) / 'src.glb', Path(d) / 'dst.glb'
            fixture(src)
            dst.write_bytes(b'previous candidate')
            source = load(src)
            with patch('compact_glb.load', side_effect=[source, ValueError('readback failed')]):
                with self.assertRaises(ValueError):
                    compact(src, dst)
            self.assertEqual(dst.read_bytes(), b'previous candidate')
            self.assertEqual(len(list(Path(d).glob('*.glb'))), 2)


if __name__ == '__main__':
    unittest.main()
