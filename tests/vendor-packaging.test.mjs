import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

test("checked-in D3 supports ontology layout without an npm D3 installation", async () => {
  const source = await readFile(new URL("../public/ontovis/vendor/d3.min.js", import.meta.url), "utf8");
  const context = { setTimeout, clearTimeout, setInterval, clearInterval, performance };
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.equal(context.d3.version, "7.9.0");
  const nodes = [{ id: "parent" }, { id: "child" }];
  const simulation = context.d3.forceSimulation(nodes).stop();
  try {
    simulation.force("link", context.d3.forceLink([{ source: "parent", target: "child" }]).id((node) => node.id));
    simulation.tick(10);
    assert.ok(nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)));
  } finally {
    simulation.stop();
  }
  const license = await readFile(new URL("../public/ontovis/vendor/D3-LICENSE", import.meta.url), "utf8");
  assert.match(license, /Copyright/);
});

test("runtime dependencies retain RDF parsing but exclude unused starter packages", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(pkg.dependencies.rdflib);
  for (const name of ["d3", "drizzle-orm", "drizzle-kit", "react-loading-skeleton"]) {
    assert.equal(pkg.dependencies[name] ?? pkg.devDependencies[name], undefined);
  }
});
