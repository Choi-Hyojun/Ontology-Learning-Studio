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

The current simulator generates fixed example Turtle at NeOn-GPT step 08 and
TAO step 04, with an expanded example at TAO step 08. ABox may be empty until
instances exist. This viewer shows those snapshots, not a document-derived ontology.
