// Regenerate the browser-safe bundle from demonstration Turtle files.
// Yonsei's OWL/XML source is preserved beside its preconverted Turtle.
// Run from any directory: node scripts/sync-demo-ontologies.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const rdf = createRequire(import.meta.url)("rdflib");
const definitions = {
  neon: { file: "video_game_NeOn.ttl", stages: ["08", "20"] },
  tao: { file: "video_game_TAO.ttl", stages: ["04"] },
  yonsei: { file: "video_game_gold_0914.ttl", sourceFile: "video_game_gold_0914.owx", stages: ["08", "09"] },
};
const bundle = {};
for (const [method, definition] of Object.entries(definitions)) {
  const path = "examples/demo/" + definition.file;
  const bytes = readFileSync(new URL("../" + path, import.meta.url));
  const ttl = bytes.toString("utf8");
  const graph = rdf.graph();
  rdf.parse(ttl, graph, "https://example.org/demo/", "text/turtle");
  bundle[method] = { ...definition, path, sha256: createHash("sha256").update(bytes).digest("hex"), ttl };
  if (definition.sourceFile) {
    const sourcePath = "examples/demo/" + definition.sourceFile;
    const sourceBytes = readFileSync(new URL("../" + sourcePath, import.meta.url));
    Object.assign(bundle[method], { sourcePath, sourceSha256: createHash("sha256").update(sourceBytes).digest("hex") });
  }
}
writeFileSync(new URL("../app/demo-ontologies.json", import.meta.url), JSON.stringify(bundle, null, 2) + "\n");
console.log("Bundled NeOn, TAO and Yonsei gold demonstration ontologies.");
