
export const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/\p{M}/g, "").trim();
 
const ROWS = ["1234567890", "qwertyuiop", "asdfghjklc", "zxcvbnm"]; 
 
const NEAR = {};
ROWS.forEach((row, r) =>
  [...row].forEach((ch, c) => {
    const set = (NEAR[ch] = new Set());
    const add = (rr, cc) => {
      const n = ROWS[rr]?.[cc];
      if (n && n !== ch) set.add(n);
    };
    add(r, c - 1); 
    add(r, c + 1); 
    add(r - 1, c); 
    add(r - 1, c + 1);
    add(r + 1, c - 1); 
    add(r + 1, c);
  })
);
 
const NEAR_COST = 0.3; 
const subCost = (a, b) => (a === b ? 0 : NEAR[a]?.has(b) ? NEAR_COST : 1);
 
export function dist(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, (_, i) => {
    const row = new Array(m + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 1; j <= m; j++) dp[0][j] = j;
 
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      let v = Math.min(
        dp[i - 1][j] + 1, 
        dp[i][j - 1] + 1, 
        dp[i - 1][j - 1] + subCost(a[i - 1], b[j - 1]) 
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, dp[i - 2][j - 2] + 0.5); 
      }
      dp[i][j] = v;
    }
  }
  return dp[n][m];
}
 
export class Suggester {
  constructor(words) {
    this.rank = new Map(); 
    this.byLen = new Map(); 
    words.forEach((w, i) => {
      const nw = norm(w);
      if (!nw || this.rank.has(nw)) return;
      this.rank.set(nw, i);
      if (!this.byLen.has(nw.length)) this.byLen.set(nw.length, []);
      this.byLen.get(nw.length).push(nw);
    });
  }
 
  has(w) {
    return this.rank.has(w);
  }
    
  _singleSlip(w) {
    let best = null;
    for (let i = 0; i < w.length; i++) {
      for (const n of NEAR[w[i]] ?? []) {
        const c = w.slice(0, i) + n + w.slice(i + 1);
        if (this.rank.has(c) && (best === null || this.rank.get(c) < this.rank.get(best))) {
          best = c;
        }
      }
    }
    return best;
  }
 
  complete(raw, k = 5) {
    const p = norm(raw);
    if (p.length < 2) return [];
    const out = [];
    for (const w of this.rank.keys()) {
      if (w.length > p.length && w.startsWith(p)) {
        out.push(w);
        if (out.length >= k) break;
      }
    }
    return out;
  }
 
  top(raw, k = 3) {
    const w = norm(raw);
    if (w.length < 3 || /^\d+$/.test(w)) return []; 
    if (this.has(w)) return [];
 
    const limit = Math.max(1, w.length * 0.4);
    const scored = [];
    for (const len of [w.length - 1, w.length, w.length + 1]) {
      for (const v of this.byLen.get(len) ?? []) {
        const d = dist(w, v);
        if (d <= limit) scored.push([v, d + 0.15 * Math.log10(this.rank.get(v) + 1)]);
      }
    }
    scored.sort((a, b) => a[1] - b[1]);
    return scored.slice(0, k).map(([v]) => v);
  }
 
  word(raw) {
    return this.top(raw, 1)[0] ?? null;
  }
    
  query(q) {
    const parts = q.split(/\s+/).filter(Boolean);
    let changed = false;
    const out = parts.map((p) => {
      const s = this.word(p);
      if (s) changed = true;
      return s ?? norm(p);
    });
    return changed ? out.join(" ") : null;
  }
}
 
export async function loadSuggester(url = "/vocab.json") {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`vocab: HTTP ${res.status}`);
  return new Suggester(await res.json());
}
 