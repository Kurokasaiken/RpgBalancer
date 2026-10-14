// stats.mjs — helper statistici del goblin lab (S0, WITNESS-02).
// Proporzioni: Wilson CI. Confronti: paired-seed delta su run accoppiate.

/** Wilson score interval per una proporzione k/n (z=1.96 → 95%). */
export function wilson(k, n, z = 1.96) {
  if (n === 0) return { p: 0, lo: 0, hi: 0, n };
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { p, lo: Math.max(0, (c - m) / d), hi: Math.min(1, (c + m) / d), n };
}

/** Mediana di un array numerico. */
export function median(xs) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Delta paired-seed tra due serie allineate per seed (a-b sullo stesso seed).
 * Ritorna media del delta e CI t-approssimato (z=1.96).
 */
export function pairedDelta(a, b, z = 1.96) {
  const ds = a.map((x, i) => x - b[i]);
  const n = ds.length;
  const mean = ds.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(ds.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, n - 1));
  const m = (z * sd) / Math.sqrt(n);
  return { mean, lo: mean - m, hi: mean + m, n };
}

/** Conta i per-causa dagli end.why (troncato alla parentesi). */
export function causeCounts(rows) {
  return rows.reduce((acc, r) => {
    const k = r.end.why.split('(')[0].trim();
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}
