// Keep the embedded viewer self-contained; no third-party CDN is needed at runtime.
import { access, cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const target = new URL("../public/ontovis/vendor/", import.meta.url);
await mkdir(target, { recursive: true });
// D3 is a checked-in browser asset, not an application npm dependency.
// To explicitly update it: npm run vendor:sync -- C:/path/to/unpacked/d3
const d3Source = process.argv[2];
if (process.argv.length > 3) throw new Error("Expected at most one D3 package directory.");
if (d3Source) {
  const bundle = resolve(d3Source, "dist/d3.min.js");
  const license = resolve(d3Source, "LICENSE");
  await Promise.all([access(bundle), access(license)]);
  await cp(bundle, new URL("d3.min.js", target));
  await cp(license, new URL("D3-LICENSE", target));
} else {
  await Promise.all([access(new URL("d3.min.js", target)), access(new URL("D3-LICENSE", target))]);
}
// rdflib may load parser chunks relative to its own script URL.
await cp(new URL("../node_modules/rdflib/dist/", import.meta.url), target, { recursive: true, filter: (source) => !source.endsWith(".map") });
