# Meadway interactive model

Interactive architectural study of 21 Meadway: terrain, two floors, roof trusses and upper-floor timber framing. Desktop and touch controls use the same model.

## Current release

- WC transverse walls are below the stair flights. Exact stair construction thickness remains schematic.
- Lot 3: the two end positions S5/S18 are darker; the nine interior positions are lighter. S18 retains its two plies. Missing manufacturer sections remain labelled schematic independently of colour.
- Shared view/layer controls, ST/ARC catalogs, member selection and on-demand detail views are available. Select a member to see construction, support, engineering status and available source references.
- Lintels have not yet been replaced by approved opening-specific designs. Missing calculations, confirmations and CAD receipts are shown as missing. This page does not calculate, approve designs or write CAD.
- Lintel evidence r8 adds the 1200 mm GAP-02 opening's gravity design envelope, SLS wind scenarios, connection candidates and support navigation. Select either GAP-02 lintel ply in the Lots 1–3 upper-floor view to inspect the results and source references. The design remains under review: site wind/topography, the full connection chain and engineer confirmation are outstanding.

Drag to orbit, scroll to zoom, right-drag to pan. On touch screens use one finger to orbit and two fingers to zoom/pan. Open Shared Controls for views, floors, roof and truss visibility. Use solid/frame/overlay modes for upper walls. Selected engineering details can be closed on mobile.

This is an architectural visualization, not a structural design. Foundations are not designed. Bearing levels, missing roof sections and selected details remain schematic. Original PDF/DWG files and local development records are excluded; derived model data is publicly downloadable.

GitHub Pages serves the main branch root. Runtime assets use relative paths; serve over HTTP(S). Three.js and OrbitControls r160 are MIT licensed; see vendor/THREE-LICENSE.txt.


## 2026-11-06 · r9 风与连接复核

GAP-02两片过梁详情增加16个风敏感性情景、48个响应、逐节点容量比较，以及JSD130mm/400mm钢带安装候选与六组缺项。状态为REVIEW：场地风与节点安装尚未确认，未完成完整工程设计，未落CAD。保留r8重力资料，模型GLB及其他构件不变。
