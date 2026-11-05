# 当前候选的本地交付

本分支通过既有查看器消费builder生成的同修订模型包。完整运行资源由tools/package_viewer.py组装，交付清单放在输出目录旁。下面命令在网页仓目录执行，输出目录选用新的本地路径。

```text
python tools/package_viewer.py --model-package <模型输出目录>/delivery --out <新的静态包目录>
```

B的builder自动生成规范模型、轻量索引、完整资料和原精度单件GLB。当前本地样例为项目Change目录下的local-viewer，配套local-viewer.manifest.json覆盖全部运行文件。后续保留整包目录结构完成本地预览或进入发布阶段。

## F专业目录和工程详情候选

目录依据[Agent留言板Issue3](https://github.com/Xian-xwz/agent-board/issues/3)：共用控制置顶，ST八组/ARC五组；三级入口连接现有筛选或选中对象资料，缺数据标待提供。切专业保留同一模型、视角、楼层及对象。墙体主题为主动选择的候选色表，缺来源显示未知，ARC沿用材质。

详情消费同修订完整构件的`parameters.viewer`；输入说明位于项目Change的`详情展示输入.md`。构造、支承、输入、梁结果、固定结果、原图与计算书、确认及CAD分开显示。确认和CAD必须与当前计算绑定同一对象、修订和输入，完整记录才显示有效。网页只读，不计算、不登记确认或写CAD。

来源仅同包PNG/JPEG/WebP和Markdown/纯文本，点开才读取并核摘要；Markdown按纯文本提供打开入口。换选或关窗释放来源和迟到响应，手机详情可关闭。原始PDF/DWG继续留在上游。

本轮独立交付位于`changes/meadway-semantic-viewer/local-viewer-v3`（实际整屋，工程数据未接）及`fixture-viewer-v1`（醒目标测试，数值与记录为fixture）。原B交付包保持原样。真实E字段绑定、设计尺寸驱动模型、正式色表批准、物理手机与工程师验收待完成。

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

