import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const rdf = createRequire(import.meta.url)("rdflib");
const root = new URL("../public/ontovis/", import.meta.url);
const script = readFileSync(new URL("ontology-folder-loader.js", root), "utf8");
function makeLoader(library = rdf) {
  const context = { window: { $rdf: library } };
  vm.runInNewContext(script, context);
  return context.window.OntologyFolderLoader;
}
const loader = makeLoader();
const tao = readFileSync(new URL("../examples/demo/video_game_TAO.ttl", import.meta.url), "utf8");
const gold = readFileSync(new URL("../examples/demo/video_game_gold_0914.ttl", import.meta.url), "utf8");
const prefixes = `@prefix : <https://example.org/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
`;
const restrictions = (graph, name) => graph.tbox.nodes.find(n => n.id.endsWith(":" + name)).axioms.propertyRestrictions;

function assertGoldInverseRestrictions(graph) {
  assert.equal(restrictions(graph, "RatingAuthority")[0], "[inverse(vg:administeredBy) min 1]");
  assert.equal(restrictions(graph, "Character")[0], "[inverse(vg:hasCharacter) some vg:VideoGame]");
  assert.ok(restrictions(graph, "ContentRating").includes("[inverse(vg:hasContentRating) exactly 1 vg:GameRelease]"));
  assert.doesNotMatch(JSON.stringify(graph.tbox.nodes.map(n => n.axioms ?? {})), /_:/);
}

test("Yonsei inverse-property restrictions show property names without changing source triples", () => {
  const store = loader.parseOntology(gold, "gold.ttl");
  const before = store.statements.map(s => s.toNT());
  const graph = loader.buildGraphData(store);
  assertGoldInverseRestrictions(graph);
  assert.equal(graph.tbox.stats.classCount, 78);
  assert.equal(graph.abox.stats.tripleCount, 34);
  assert.deepEqual(store.statements.map(s => s.toNT()), before);
});

test("inverse expressions support only restrictions, preserve named properties and bound cycles", () => {
  const graph = loader.buildGraphData(loader.parseOntology(prefixes + `
:p a owl:ObjectProperty; owl:inverseOf :q .
:Inverse a owl:Class; rdfs:subClassOf [ a owl:Restriction;
 owl:onProperty [ owl:inverseOf :p ]; owl:allValuesFrom :A ] .
:Named a owl:Class; rdfs:subClassOf [ a owl:Restriction;
 owl:onProperty :p; owl:someValuesFrom :A ] .
:Cycle a owl:Class; rdfs:subClassOf [ a owl:Restriction;
 owl:onProperty _:loop; owl:minCardinality 1 ] .
_:loop owl:inverseOf _:loop .
`, "inverse.ttl"));
  assert.match(restrictions(graph, "Inverse")[0], /inverse\([^)]*:p\) only [^\]]*:A/);
  assert.match(restrictions(graph, "Named")[0], /^\[[^ ]*:p some [^\]]*:A\]$/);
  assert.ok(restrictions(graph, "Cycle")[0].length < 300);
  assert.match(restrictions(graph, "Cycle")[0], /\?/);
});

test("TAO AttributeState shows the three qualified cardinalities instead of blank IDs", () => {
  const store = loader.parseOntology(tao, "video_game_TAO.ttl");
  const before = store.statements.map(s => s.toNT());
  const type = rdf.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
  const restriction = rdf.namedNode("http://www.w3.org/2002/07/owl#Restriction");
  const node = store.statementsMatching(null, type, restriction)[0].subject;
  assert.equal(Boolean(store.any(node, type, restriction)), false); // Original bug.
  assert.equal(store.holds(node, type, restriction), true);
  const graph = loader.buildGraphData(store);
  assert.deepEqual(Array.from(restrictions(graph, "Cl_AttributeState")), [
    "[vg:op_stateOf exactly 1 vg:Cl_Entity]",
    "[vg:op_forAttribute exactly 1 vg:Cl_Attribute]",
    "[vg:dp_numericValue exactly 1 xsd:decimal]",
  ]);
  const nested = restrictions(graph, "Cl_HealthAtZeroCondition").join("\n");
  assert.match(nested, /op_evidencedByState some/);
  assert.match(nested, /Cl_AttributeState and/);
  assert.match(nested, /op_forAttribute some vg:Cl_HealthAttribute/);
  assert.match(nested, /dp_numericValue hasValue 0/);
  assert.doesNotMatch(JSON.stringify(graph.tbox.nodes.map(n => n.axioms ?? {})), /_:/);
  assert.deepEqual(store.statements.map(s => s.toNT()), before);
});

test("nested union, intersection and oneOf Collections retain their members", () => {
  const store = loader.parseOntology(prefixes + `
:Test a owl:Class; rdfs:subClassOf [
 a owl:Restriction; owl:onProperty :p;
 owl:someValuesFrom [ owl:intersectionOf (
   :A [ owl:unionOf (:B :C) ] [ owl:oneOf (:i :j) ]
   [ a owl:Restriction; owl:onProperty :q; owl:allValuesFrom :D ]
 ) ]
] .`, "nested.ttl");
  assert.ok(store.statements.some(s => s.object.termType === "Collection"));
  const text = restrictions(loader.buildGraphData(store), "Test").join("\n");
  for (const part of ["some", ":A and", ":B or", ":C", ":i,", ":j", ":q only", ":D"]) assert.ok(text.includes(part), text);
  assert.doesNotMatch(text, /_:|\(\)|\{\}/);
});

test("explicit RDF list chains and RDF/XML restrictions remain supported", () => {
  const ttl = prefixes + `
:Test a owl:Class; rdfs:subClassOf [ a owl:Restriction; owl:onProperty :p;
 owl:someValuesFrom [ owl:unionOf _:list1 ] ] .
_:list1 rdf:first :A; rdf:rest _:list2 .
_:list2 rdf:first :B; rdf:rest rdf:nil .
`;
  const graph = loader.buildGraphData(loader.parseOntology(ttl, "linked.ttl"));
  assert.match(restrictions(graph, "Test")[0], /some \([^)]*:A or [^)]*:B\)/);
  const xml = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:owl="http://www.w3.org/2002/07/owl#">
 <owl:Class rdf:about="https://example.org/Test"><rdfs:subClassOf><owl:Restriction>
 <owl:onProperty rdf:resource="https://example.org/p"/>
 <owl:minCardinality rdf:datatype="http://www.w3.org/2001/XMLSchema#nonNegativeInteger">2</owl:minCardinality>
 </owl:Restriction></rdfs:subClassOf></owl:Class></rdf:RDF>`;
  assert.match(restrictions(loader.buildGraphData(loader.parseOntology(xml, "test.owl")), "Test")[0], /:p min 2\]/);
});

test("the shipped browser RDF bundle also expands TAO restrictions", () => {
  const context = { console, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout,
    document: { currentScript: { tagName: "SCRIPT", src: "http://localhost/ontovis/vendor/rdflib.min.js" }, getElementsByTagName: () => [] } };
  context.window = context; context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("vendor/rdflib.min.js", root), "utf8"), context);
  vm.runInContext(script, context);
  const browserLoader = context.OntologyFolderLoader;
  const graph = browserLoader.buildGraphData(browserLoader.parseOntology(tao, "current.ttl"));
  assert.equal(restrictions(graph, "Cl_AttributeState")[0], "[vg:op_stateOf exactly 1 vg:Cl_Entity]");
  assert.doesNotMatch(JSON.stringify(graph.tbox.nodes.map(n => n.axioms ?? {})), /_:/);
});

test("the shipped browser RDF bundle also expands revised Yonsei inverse restrictions", () => {
  const context = { console, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout,
    document: { currentScript: { tagName: "SCRIPT", src: "http://localhost/ontovis/vendor/rdflib.min.js" }, getElementsByTagName: () => [] } };
  context.window = context; context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("vendor/rdflib.min.js", root), "utf8"), context);
  vm.runInContext(script, context);
  const browserLoader = context.OntologyFolderLoader;
  assertGoldInverseRestrictions(browserLoader.buildGraphData(browserLoader.parseOntology(gold, "gold.ttl")));
});
