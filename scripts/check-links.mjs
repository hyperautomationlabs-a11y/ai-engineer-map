// Checks every learn.url in data/graph.json. Usage: node scripts/check-links.mjs
import { readFileSync } from "node:fs";
const { nodes } = JSON.parse(readFileSync(new URL("../data/graph.json", import.meta.url)));
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const urls = [...new Set(nodes.map(n => n.learn.url))];
const check = async u => {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(u, { method, redirect: "follow", headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
      if (r.ok) return [u, r.status, r.url !== u ? r.url : ""];
      if (method === "GET") return [u, r.status, ""];
    } catch (e) { if (method === "GET") return [u, "ERR " + e.cause?.code || e.name, ""]; }
  }
};
const out = [];
for (let i = 0; i < urls.length; i += 12) out.push(...await Promise.all(urls.slice(i, i + 12).map(check)));
const bad = out.filter(([, s]) => s !== 200);
console.log(`${out.length - bad.length}/${out.length} OK`);
for (const [u, s, to] of bad) console.log(s, u, to);
if (process.argv.includes("--redirects")) for (const [u, s, to] of out) if (to) console.log("redirect", u, "->", to);
process.exit(bad.some(([, s]) => s === 404 || String(s).startsWith("ERR")) ? 1 : 0);
