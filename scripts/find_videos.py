"""Find one free YouTube video per concept using yt-dlp search, preferring trusted teaching channels.
Usage: python3 -I scripts/find_videos.py   -> writes data/videos.json (review before merging)."""
import json, subprocess, sys, pathlib
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
graph = json.loads((ROOT / "data/graph.json").read_text())
TRUSTED = {"3blue1brown", "statquest with josh starmer", "andrej karpathy", "freecodecamp.org", "ibm technology",
    "fireship", "google for developers", "anthropic", "hugging face", "corey schafer", "computerphile",
    "khan academy", "deeplearningai", "codeemporium", "sentdex", "stanford online", "mit opencourseware",
    "techworld with nana", "neetcode", "bro code", "programming with mosh", "net ninja", "data school",
    "krish naik", "codebasics", "welch labs", "serrano.academy", "umar jamil", "yannic kilcher",
    "ai explained", "aws", "microsoft developer", "google cloud tech", "langchain", "pinecone",
    "weaviate • vector database", "sam witteveen", "dave ebbelaar", "1littlecoder", "jeremy howard",
    "zach star", "visually explained", "art of the problem", "nvidia developer", "pytorch", "neo4j",
    "nana", "kunal kushwaha", "apna college", "telusko", "edureka!", "simplilearn", "mlops community",
    "hamel husain", "github", "docker", "vercel", "the coding train", "arpan gupta", "ritvikmath"}

def search(node):
    q = f"{node['title']} explained" if node["track"] not in ("programming",) else f"{node['title']} tutorial"
    try:
        out = subprocess.run(["yt-dlp", "--flat-playlist", "--no-warnings", "--print",
            "%(id)s\t%(channel)s\t%(duration)s\t%(view_count)s\t%(title)s", f"ytsearch8:{q}"],
            capture_output=True, text=True, timeout=90).stdout
    except Exception as e:
        return node["id"], None
    cands = []
    for line in out.strip().splitlines():
        p = line.split("\t")
        if len(p) < 5: continue
        vid, ch, dur, views, title = p
        try: dur, views = float(dur), int(views)
        except ValueError: continue
        if not 120 <= dur <= 4 * 3600: continue
        trusted = ch.lower() in TRUSTED
        if not trusted and views < 100_000: continue
        cands.append({"id": vid, "channel": ch, "minutes": round(dur / 60), "views": views, "title": title,
                      "trusted": trusted, "url": f"https://www.youtube.com/watch?v={vid}"})
    cands.sort(key=lambda c: (not c["trusted"], -c["views"]))
    return node["id"], (cands[0] if cands else None)

with ThreadPoolExecutor(6) as ex:
    res = dict(ex.map(search, graph["nodes"]))
(ROOT / "data/videos.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
found = sum(1 for v in res.values() if v)
print(f"found {found}/{len(res)}; trusted {sum(1 for v in res.values() if v and v['trusted'])}")
