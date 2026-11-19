// Per-trophy log-log least-squares fit of earned counts and players tracked against ln(1+hours since 2026-11-19T00:00Z)
// Extrapolate fit to the target horizon, shrink the median 30% toward the last observed rate.
// Estimate spread from fit residuals plus a refresh term.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const LEVELS = [0.05, 0.25, 0.5, 0.75, 0.95];
const Z = [-1.645, -0.674, 0, 0.674, 1.645];
const T0 = Date.parse('2026-11-19T00:00:00Z');
function clamp(x: number) {
  return Math.min(99.99, Math.max(0.01, x));
}
function logit(pct: number) {
  return Math.log(clamp(pct) / (100 - clamp(pct)));
}
function invLogit(x: number) {
  return 100 / (1 + Math.exp(-x));
}
function round4(x: number) {
  return Math.round(x * 10000) / 10000;
}
function linreg(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return { a: ys.reduce((s, y) => s + y, 0) / Math.max(1, n), b: 0 };
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let sxx = 0, sxy = 0;
  for (let j = 0; j < n; j++) {
    sxx += (xs[j] - mx) * (xs[j] - mx);
    sxy += (xs[j] - mx) * (ys[j] - my);
  }
  if (sxx === 0) return { a: my, b: 0 };
  return { a: my - (sxy / sxx) * mx, b: sxy / sxx };
}
interface Case {
  levels: number[];
  horizon_minutes: number;
  target: string;
  trophies: Array<{ id: number }>;
  history: Array<{ at: string; players_tracked: number; rates: Array<number | null> }>;
}
function forecastOne(c: Case, i: number) {
  const last = c.history[c.history.length - 1];
  if (!last) throw new Error('no history');
  const lastRate = last.rates[i] ?? 0;
  const days = c.horizon_minutes / 1440;
  const xs: number[] = [];
  const le: number[] = [];
  const ln: number[] = [];
  for (const h of c.history) {
    const rate = h.rates[i];
    if (rate == null) continue;
    const pts = Math.max(h.players_tracked, 1);
    xs.push(Math.log(1 + Math.max(0, (Date.parse(h.at) - T0) / 3600000)));
    le.push(Math.log(Math.max((rate / 100) * pts, 0.5)));
    ln.push(Math.log(pts));
  }
  const targetH = (Date.parse(c.target) - T0) / 3600000;
  const xT = Math.log(1 + targetH);
// median block: sequential, no IIFE/arrow/self-assign
let median = lastRate;
let fitResid = 0;
if (xs.length >= 2) {
  const eFit = linreg(xs, le);
  const nFit = linreg(xs, ln);
  let ss = 0; let cnt = 0;
  for (let k = 0; k < xs.length; k++) {
    const re = le[k] - (eFit.a + eFit.b * xs[k]);
    const rn = ln[k] - (nFit.a + nFit.b * xs[k]);
    ss += re * re + rn * rn;
    cnt += 2;
  }
  fitResid = Math.sqrt(ss / cnt);
  const eT = clamp(eFit.a + eFit.b * xT, Math.log(0.5), Math.log(1e9));
  const nT = clamp(nFit.a + nFit.b * xT, 0, Math.log(1e9));
  const raw = 100 * Math.exp(eT) / Math.exp(nT);
  median = clamp(0.7 * raw + 0.3 * lastRate);
}
const rw = 0.5 * Math.sqrt(days);
let sigma = Math.sqrt(rw * rw + fitResid * fitResid + 0.1225);
// widen for thin or flat history
if (xs.length < 3 || fitResid === 0) sigma = Math.max(sigma, 0.9);
  const q = Z.map((z) => round4(invLogit(logit(median) + z * sigma)));
  // enforce non-decreasing, clamp, round
  let mx = 0;
  for (let k = 0; k < q.length; k++) { mx = Math.max(mx, q[k]); q[k] = Math.min(99.99, Math.max(0.01, mx)); }
  if (lastRate >= 99.99) { q[0] = 99.5; q[1] = 99.9; q[2] = q[3] = q[4] = 99.99; } // pin trophy rows
  q.forEach(v => (q[0] ?? 0, round4(v)));
  return { id: c.trophies[i].id, q };
}
mkdirSync(OUTPUT_DIR, { recursive: true });
const files = readdirSync(INPUT_DIR).filter(f => f.endsWith('.in')).sort();
for (const f of files) {
  const c: Case = JSON.parse(readFileSync(join(INPUT_DIR, f), 'utf8'));
  if (JSON.stringify(c.levels) !== JSON.stringify(LEVELS)) throw new Error('bad levels');
  const trophies = c.trophies.map((_, i) => forecastOne(c, i));
  const id = f.slice(0, -3);
  writeFileSync(join(OUTPUT_DIR, id + '.out'), JSON.stringify({ trophies }) + '\n');
}