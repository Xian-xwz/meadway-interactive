# 当前候选的本地交付

本分支通过既有查看器消费builder生成的同修订模型包。完整运行资源由tools/package_viewer.py组装，交付清单放在输出目录旁。下面命令在网页仓目录执行，输出目录选用新的本地路径。

```text
python tools/package_viewer.py --model-package <模型输出目录>/delivery --out <新的静态包目录>
```

B的builder自动生成规范模型、轻量索引、完整资料和原精度单件GLB。当前本地样例为项目Change目录下的local-viewer，配套local-viewer.manifest.json覆盖全部运行文件。后续保留整包目录结构完成本地预览或进入发布阶段。

以下为既有项目说明。
# Meadway interactive model

An interactive architectural study of 21 Meadway, with terrain, two floor plans, a section view, six-home roof trusses and upper-floor timber framing. English labels include Chinese translations. The viewer uses one shared model for every view.

- Desktop: drag to orbit, scroll to zoom, right-drag to pan.
- Mobile: one finger to orbit, two fingers to zoom or pan; tap to inspect a component. Scroll outside the model to reach controls.
- Select an upper-floor overview or a close-up for Lots 1–3 / 4–6.
- Toggle roof, trusses, upper walls, floor slabs, lower floor and terrain independently.
- Switch upper walls between solid, timber framing and overlay. Lower-floor framing and floor joists are not modeled.
- Select a member to inspect its existing properties. Capping plate labels follow the project engineer's terminology; legacy stable IDs are retained.

This is an architectural visualization, not a structural design. Foundations are not designed. Platforms and the source drawings' 100 mm level conflict remain identified in the viewer. Roof layout covers 72 positions: 50 use seven supplied truss sections (timber colour), 22 use schematic sections (orange). Five double-truss positions contain two plies. All plan positions follow the archived layout. Bearing heights, gutter setdown and missing section geometry remain schematic; connection plates and edge outriggers are omitted. Displayed component extents are model bounding boxes, not design sections. Wall junctions connect in the model geometry; doors and separate-wall cavities remain open.

Only the static viewer and derived model data are included. Original PDF/DWG files, credentials, local paths and development logs are excluded. Model assets are publicly downloadable.

## Hosting

GitHub Pages serves the main branch root. All runtime assets are local and use relative paths. Serve over HTTP(S); opening index.html through file:// is unsupported.

## Third-party code

Three.js and OrbitControls r160 are MIT licensed; see vendor/THREE-LICENSE.txt. Source: https://github.com/mrdoob/three.js/tree/r160

## Local performance candidate
See PERFORMANCE.md for baseline, exact geometry checks, measurements and acceptance status. This branch has not been published. Source geometry is maintained upstream; tools/compact_glb.py produces a separate, checked display asset.

