# Meadway interactive model

An interactive architectural study of 21 Meadway, with terrain, two floor plans, a section view and roof trusses across six homes. English labels include Chinese translations. The viewer uses one shared model for every view.

- Desktop: drag to orbit, scroll to zoom, right-drag to pan.
- Mobile: one finger to orbit, two fingers to zoom or pan; tap to inspect a component. Scroll outside the model to reach controls.
- Select a view, hide the roof, or inspect existing component properties.

This is an architectural visualization, not a structural design. Foundations are not designed. Platforms and the source drawings' 100 mm level conflict remain identified in the viewer. Roof layout covers 72 positions: 50 use seven supplied truss sections (timber colour), 22 use schematic sections (orange). Five double-truss positions contain two plies. All plan positions follow the archived layout. Bearing heights, gutter setdown and missing section geometry remain schematic; connection plates and edge outriggers are omitted. Displayed component extents are model bounding boxes, not design sections. Wall junctions connect in the model geometry; doors and separate-wall cavities remain open.

Only the static viewer and derived model data are included. Original PDF/DWG files, credentials, local paths and development logs are excluded. Model assets are publicly downloadable.

## Hosting

GitHub Pages serves the main branch root. All runtime assets are local and use relative paths. Serve over HTTP(S); opening index.html through file:// is unsupported.

## Third-party code

Three.js and OrbitControls r160 are MIT licensed; see vendor/THREE-LICENSE.txt. Source: https://github.com/mrdoob/three.js/tree/r160
