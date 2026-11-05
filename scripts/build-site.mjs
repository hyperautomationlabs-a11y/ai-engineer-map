// Merges data/graph.json + data/videos.json into web/template.html -> dist/index.html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const g = JSON.parse(readFileSync("data/graph.json", "utf8"));
const videos = JSON.parse(readFileSync("data/videos.json", "utf8"));
for (const n of g.nodes) {
  const v = videos[n.id];
  if (v) n.watch = { id: v.id, title: v.title, channel: v.channel, minutes: v.minutes, url: v.url };
}
const nv = g.nodes.filter(n => n.watch).length;
const html = readFileSync("web/template.html", "utf8")
  .replace("/*DATA*/", JSON.stringify(g).replace(/</g, "\\u003c"))
  .replaceAll("__COUNT__", g.nodes.length).replaceAll("__EDGES__", g.edges.length).replaceAll("__VIDEOS__", nv);
mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
console.log(`dist/index.html: ${g.nodes.length} concepts, ${nv} videos, ${(html.length/1024)|0} KB`);
