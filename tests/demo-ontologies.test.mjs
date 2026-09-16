import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import demos from "../app/demo-ontologies.json" with { type: "json" };
import { simulatedOntology, exportLog } from "../app/project-files.ts";
import { exampleResponse } from "../app/example-model.ts";
const rdf = createRequire(import.meta.url)("rdflib");

test("revised OWL/XML demo retains its declared entities, restrictions and class assertions", () => {
  const graph = rdf.graph();
  rdf.parse(demos.yonsei.ttl, graph, "https://example.org/", "text/turtle");
  const owl = "http://www.w3.org/2002/07/owl#", rdfs = "http://www.w3.org/2000/01/rdf-schema#";
  const type = rdf.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
  const typed = kind => graph.each(undefined, type, rdf.namedNode(owl + kind));
  const individuals = typed("NamedIndividual");
  assert.equal(individuals.length, 16);
  assert.equal(typed("Restriction").length, 21);
  assert.equal(typed("ObjectProperty").length, 53);
  assert.equal(typed("DatatypeProperty").length, 12);
  assert.equal(individuals.reduce((sum, subject) => sum + graph.each(subject, type).filter(t => t.value !== owl + "NamedIndividual").length, 0), 16);
  assert.equal(graph.statementsMatching(undefined, rdf.namedNode(owl + "propertyChainAxiom")).length, 1);
  assert.equal(graph.statementsMatching(undefined, rdf.namedNode(owl + "unionOf")).length, 14);
  assert.equal(graph.statementsMatching(undefined, rdf.namedNode(owl + "disjointWith")).length + typed("AllDisjointClasses").length, 44);
  assert.ok(graph.holds(rdf.namedNode("http://www.w3.org/2001/XMLSchema#date"), type, rdf.namedNode(rdfs + "Datatype")));
});
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
  assert.equal(demos.yonsei.file, "video_game_gold_0914.ttl");
  assert.equal(demos.yonsei.sourceFile, "video_game_gold_0914.owx");
  const source = readFileSync(new URL("../" + demos.yonsei.sourcePath, import.meta.url));
  assert.equal(demos.yonsei.sourceSha256, createHash("sha256").update(source).digest("hex"));
  const old = readFileSync(new URL("../examples/demo/video_game_gold.ttl", import.meta.url), "utf8");
  assert.notEqual(demos.yonsei.ttl, old);
  for (const method of Object.keys(demos)) assert.equal(simulatedOntology(method, "01"), null);
});
