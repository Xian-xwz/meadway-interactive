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

