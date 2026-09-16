# Bundled demonstration ontologies

Yonsei now uses `video_game_gold_0914.ttl`, converted from the unchanged
`video_game_gold_0914.owx` supplied in the demonstration folder. OWX here is
OWL/XML, not RDF/XML. The previous `video_game_gold.ttl` remains a historical
fixture and is no longer the active Yonsei example. NeOn and TAO are unchanged.

Normal app installation, startup and builds need only the existing Node.js
dependencies. Both the converted Turtle and browser JSON bundle are committed.

To regenerate after intentionally replacing the OWX source, use a separate
Python environment with `owlready2==0.51` and `rdflib==7.6.0`, then run:

```
python scripts/convert-yonsei-demo.py
node scripts/sync-demo-ontologies.mjs
```

The converter uses the local OWL/XML parser only: no reasoner or import downloads.
It preserves the explicit datatype declaration that Owlready2 otherwise omits,
checks declarations, instance types, annotations and structural axiom counts,
and verifies the Turtle round-trip is graph-isomorphic. Unknown constructs stop
conversion for review. Blank-node identifiers are canonicalized for regeneration.
See [Owlready2 format documentation](https://owlready2.readthedocs.io/en/v0.48/onto.html).

The source OWX and generated Turtle have separate SHA-256 hashes in
`app/demo-ontologies.json`. The revised viewer reports 78 classes, 53 object
properties, 12 datatype properties, and 16 instances / 34 counted ABox triples.
These UI counts are not the whole RDF graph's 907 triples.
