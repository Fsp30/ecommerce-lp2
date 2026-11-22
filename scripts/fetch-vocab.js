
import { readFileSync, writeFileSync, existsSync } from "node:fs";
 
const URL =
  "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_br/pt_br_50k.txt";
const TOP_N = 30_000; 
const MIN_COUNT = 100; 
 
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/g, "");
 
const text = await (await fetch(URL)).text();
 
const base = [];
for (const line of text.split("\n")) {
  const [word, count] = line.trim().split(" ");
  if (!word || Number(count) < MIN_COUNT) continue;
  const w = norm(word);
  if (w.length < 3 || !/^[a-z]+$/.test(w)) continue; 
  base.push(w);
}
 
let extras = [];
const extrasFile = process.argv[2];
if (extrasFile && existsSync(extrasFile)) {
  extras = readFileSync(extrasFile, "utf8")
    .split(/\r?\n/)
    .flatMap((l) => norm(l).split(/[^a-z0-9]+/))
    .filter((w) => w.length >= 3);
}
 
const vocab = [...new Set([...extras, ...base])].slice(0, TOP_N + extras.length);
writeFileSync("vocab.json", JSON.stringify(vocab));
console.log(`vocab.json: ${vocab.length} palavras (${extras.length} próprias)`);
 