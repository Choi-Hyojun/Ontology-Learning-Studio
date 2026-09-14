import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import demos from "../app/demo-ontologies.json" with { type: "json" };
import { simulatedOntology, exportLog } from "../app/project-files.ts";
import { exampleResponse } from "../app/example-model.ts";
const rdf = createRequire(import.meta.url)("rdflib");
test("all bundled demonstration ontologies preserve their source files exactly and parse", () => {
  for (const [method, demo] of Object.entries(demos)) {
    const bytes = readFileSync(new URL("../" + demo.path, import.meta.url));
    assert.equal(demo.ttl, bytes.toString("utf8"));
    assert.equal(demo.sha256, createHash("sha256").update(bytes).digest("hex"));
    const graph = rdf.graph(); rdf.parse(demo.ttl, graph, "https://example.org/", "text/turtle");
    assert.ok(graph.statements.length > 500);
    for (const stage of demo.stages) {
      assert.equal(simulatedOntology(method, stage), demo.ttl);
      if (method !== "yonsei") assert.ok(exampleResponse(method, stage).includes(demo.ttl.trimEnd()));
    }
    assert.equal(JSON.parse(exportLog({ ontologies: { [method]: demo.ttl } })).ontologies[method], demo.ttl);
  }
  assert.equal(demos.yonsei.file, "video_game_gold.ttl");
  for (const method of Object.keys(demos)) assert.equal(simulatedOntology(method, "01"), null);
});
