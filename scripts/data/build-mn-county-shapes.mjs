// Builds lib/content/hub/mn-county-shapes.json: Minnesota county outlines as SVG paths, already projected.
//
// The packages are NOT app dependencies. Install them into any scratch folder first, then pass that folder:
//   npm install --prefix <scratch>/mapbuild us-atlas@3.0.1 topojson-client@3.1.0 d3-geo@3.1.1
//   node scripts/data/build-mn-county-shapes.mjs <scratch>/mapbuild
// (or set MAPBUILD_DIR instead of passing the folder). Re-running gives the same file.
//
// Source: us-atlas 3.0.1, counties-10m.json (U.S. Census Bureau cartographic boundary files, 1:10,000,000).
// Minnesota counties are the features whose FIPS code starts with "27".
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const buildDir = path.resolve(process.argv[2] || process.env.MAPBUILD_DIR || "");
if (!process.argv[2] && !process.env.MAPBUILD_DIR) {
  console.error("Pass the folder where us-atlas, topojson-client and d3-geo are installed.");
  process.exit(1);
}
const req = createRequire(path.join(buildDir, "package.json"));
const load = async name => import(pathToFileURL(req.resolve(name)).href);

const { feature } = await load("topojson-client");
const { geoConicConformal, geoPath } = await load("d3-geo");
const atlasPath = req.resolve("us-atlas/counties-10m.json");
const atlasVersion = JSON.parse(fs.readFileSync(req.resolve("us-atlas/package.json"), "utf8")).version;
const topo = JSON.parse(fs.readFileSync(atlasPath, "utf8"));

const all = feature(topo, topo.objects.counties).features;
const mn = all.filter(f => String(f.id).startsWith("27")).sort((a, b) => String(a.id).localeCompare(String(b.id)));
if (mn.length !== 87) throw new Error(`Expected 87 Minnesota counties, found ${mn.length}`);
const collection = { type: "FeatureCollection", features: mn };

const WIDTH = 600;
const PAD = 8;
// Conformal conic with standard parallels inside Minnesota, centered on the state's middle meridian.
const projection = geoConicConformal().parallels([44, 48.5]).rotate([94.3, 0]);
projection.fitWidth(WIDTH - PAD * 2, collection);
const [[x0, y0], [, y1]] = geoPath(projection).bounds(collection);
projection.translate([projection.translate()[0] - x0 + PAD, projection.translate()[1] - y0 + PAD]);
const height = Math.ceil(y1 - y0 + PAD * 2);
const pathGen = geoPath(projection).digits(1);
const round1 = n => Math.round(n * 10) / 10;

const counties = mn.map(f => {
  const [cx, cy] = pathGen.centroid(f);
  return { fips: String(f.id), name: f.properties.name, d: pathGen(f), labelX: round1(cx), labelY: round1(cy) };
});

const out = {
  source: `us-atlas ${atlasVersion}, counties-10m.json (U.S. Census Bureau cartographic boundaries, 1:10,000,000)`,
  projection: "Conformal conic, standard parallels 44 and 48.5 degrees north, centered at 94.3 degrees west, fitted to Minnesota",
  viewBox: `0 0 ${WIDTH} ${height}`,
  width: WIDTH,
  height,
  counties,
};
const target = path.join(root, "lib/content/hub/mn-county-shapes.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out) + "\n");
console.log(`Wrote ${counties.length} counties, viewBox ${out.viewBox}, ${fs.statSync(target).size} bytes to ${target}`);
