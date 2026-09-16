# OntoVis integration

Adapted from the workspace's `OntoVis/Demo.html` and `ontology-folder-loader.js`.
The original files are unchanged. The viewer retains the original TBox class
hierarchy, ABox instances, node details, focus search, zoom, drag and force settings.
TBox edges represent subclass relationships, not every RDF predicate.

Restriction descriptions use explicit RDF triple membership checks rather than
`store.any()` with all terms bound. Nested union/intersection/enumeration
expressions support both rdflib Collection objects (Turtle lists) and explicit
rdf:first/rdf:rest chains (including RDF/XML). Blank-node identifiers are not
substituted for supported restriction expressions. Source files are unchanged.

The status above Focus shows source class, declared Object Property and declared
Datatype Property counts in TBox mode. Classes are the named classes recognized
by the loader (including owl:Class/rdfs:Class declarations and named hierarchy/
equivalence/disjointness participants); the synthetic owl:Thing display root is
excluded unless it was present as a source class. Property counts use explicit
owl:ObjectProperty/owl:DatatypeProperty declarations, not inferred classifications.
In ABox mode the status shows displayed named individuals and distinct source
triples whose subject is one of those individuals, including explicitly asserted
class types, literal values and annotations, but excluding rdf:type
owl:NamedIndividual declarations. Multiple explicitly asserted class types count
separately. The loader does not infer superclass memberships. This is not the
rendered edge count or the unfiltered source/total ontology
triple count. Counts cover the loaded snapshot, not just a focused subgraph.
Declared rdfs:Datatype/owl:DataRange resources are schema, not instances.
Instance details list every counted outgoing assertion once under Types,
Labels, Literal Values, Outgoing Relations or
Other Statements. Literal language tags and datatypes are preserved. The per-node
Outgoing triples totals sum to the status Triple count; incoming relations are
shown separately and counted only at their source. owl:NamedIndividual declarations
are preserved in the loaded data but hidden from the detail panel. The previous
`video_game_gold.ttl` regression fixture has 32
instances and a Triple count of 94: 30 explicit class memberships, 46 labels,
16 comments and 2 drawn relations. Two instances have only owl:NamedIndividual
declarations and contribute no class type count. The 126 unfiltered source triples
include 32 owl:NamedIndividual declarations. Its xsd:date datatype declaration is
not an instance or ABox triple. Source files are unchanged.

The Studio modal sends the exact current exportable Turtle by a same-origin,
source-checked postMessage bridge. A new snapshot replaces the displayed graph.
The snapshot modal hides folder selection. The same HTML at
`index.html?mode=folder` enables independent local OWL/TTL folder selection through
`folder-mode.js`, without requiring any Studio output or preprocessed graph files.
Both workspace panels remain mounted on tab changes, retaining imported graphs
and Studio drafts until the page is refreshed or closed. Folder imports belong
only to OntoVis, not to Studio session logs. Switching tabs does not pause or
restart an already running Studio generation.
Parsing is local: no GPT calls, uploads, RDF import fetching or CDN requests.

`vendor/` is generated from pinned npm dependencies with
`node scripts/sync-ontovis-vendor.mjs` (from the project root).
It is checked in for direct `npx vinext dev` usage. After updating dependencies,
run the sync script again. Library license files are included alongside the bundles.

The simulator replays the unchanged files in `examples/demo/`: NeOn-GPT uses
`video_game_NeOn.ttl` at steps 08/20, TAO uses `video_game_TAO.ttl` at step 04,
and Yonsei uses `video_game_gold_0914.ttl` at step 08, converted without inference
from the preserved `video_game_gold_0914.owx` OWL/XML source. TAO's missing QA/repair results
retain step 04's snapshot; Yonsei step 09 preserves the current snapshot without
claiming semantic refinement. These files are demonstrations, not outputs
generated from the current prompts or CQs.
ABox shows the instances actually present in each file. Editing the input in
simulation mode does not regenerate these fixed, source-backed snapshots.

Focus suggestions are attached to the document body as a fixed-position layer,
outside the controls' scroll container. They flip above the input when needed,
fit the viewport, and reposition on scrolling/resizing. Only the list itself
scrolls; moving the input out of view closes the list.
