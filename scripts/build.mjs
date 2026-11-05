// Validates data/tracks/*.yaml and writes data/graph.json
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { parse } from "yaml";
const dir = new URL("../data/tracks/", import.meta.url);
const tracks = [], nodes = new Map(), errors = [];
for (const f of readdirSync(dir).filter(f => f.endsWith(".yaml")).sort()) {
  const t = parse(readFileSync(new URL(f, dir), "utf8"));
  tracks.push({ id: t.track, title: t.title, color: t.color });
  for (const c of t.concepts) {
    if (nodes.has(c.id)) errors.push(`duplicate id ${c.id}`);
    for (const k of ["id","title","level","requires","why","learn"]) if (c[k] === undefined) errors.push(`${c.id}: missing ${k}`);
    if (!c.learn?.url?.startsWith("https://")) errors.push(`${c.id}: learn.url must be https`);
    nodes.set(c.id, { ...c, track: t.track });
  }
}
for (const n of nodes.values()) for (const r of n.requires) if (!nodes.has(r)) errors.push(`${n.id}: unknown prerequisite ${r}`);
// cycle check + depth (longest prerequisite chain)
const depth = new Map(), state = new Map();
const visit = (id, stack) => {
  if (state.get(id) === 2) return depth.get(id);
  if (state.get(id) === 1) { errors.push(`cycle: ${[...stack, id].join(" -> ")}`); return 0; }
  state.set(id, 1);
  const d = Math.max(-1, ...nodes.get(id).requires.filter(r => nodes.has(r)).map(r => visit(r, [...stack, id]))) + 1;
  state.set(id, 2); depth.set(id, d); return d;
};
for (const id of nodes.keys()) visit(id, []);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
const list = [...nodes.values()].map(n => ({ ...n, depth: depth.get(n.id) }));
const edges = list.flatMap(n => n.requires.map(r => ({ from: r, to: n.id })));
writeFileSync(new URL("../data/graph.json", import.meta.url), JSON.stringify({ tracks, nodes: list, edges }, null, 1));
const dependents = new Map(); for (const e of edges) dependents.set(e.from, (dependents.get(e.from) || 0) + 1);
console.log(`OK  ${list.length} concepts · ${edges.length} prerequisite links · ${tracks.length} tracks · longest chain ${Math.max(...depth.values()) + 1}`);
for (const t of tracks) console.log(`  ${t.title.padEnd(36)} ${list.filter(n => n.track === t.id).length}`);
console.log("Starting points (no prereqs):", list.filter(n => !n.requires.length).map(n => n.id).join(", "));
console.log("Most-unlocking:", [...dependents].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}(${v})`).join(", "));
console.log("Dead ends (nothing builds on them):", list.filter(n => !dependents.has(n.id)).length);
