# OntoVis integration

Adapted from the workspace's `OntoVis/Demo.html` and `ontology-folder-loader.js`.
The original files are unchanged. The viewer retains the original TBox class
hierarchy, ABox instances, node details, focus search, zoom, drag and force settings.
TBox edges represent subclass relationships, not every RDF predicate.

The Studio modal sends the exact current exportable Turtle by a same-origin,
source-checked postMessage bridge. A new snapshot replaces the displayed graph.
Ontology-folder selection and requests for preprocessed graph files are disabled.
Parsing is local: no GPT calls, uploads, RDF import fetching or CDN requests.

`vendor/` is generated from pinned npm dependencies with
`node scripts/sync-ontovis-vendor.mjs` (from the project root).
It is checked in for direct `npx vinext dev` usage. After updating dependencies,
run the sync script again. Library license files are included alongside the bundles.

The simulator replays supplied video-game Turtle: NeOn-GPT step 08, its separately
supplied final merged file at step 20, and TAO's ver2 file at step 04. TAO's later
QA/repair results were not supplied, so those stages retain step 04's snapshot.
ABox shows the instances actually present in each file. Editing the input in
simulation mode does not regenerate these fixed, source-backed snapshots.
