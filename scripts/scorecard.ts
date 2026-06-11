/**
 * P0 — Scorecard retrospectivo: performance dos picks de cada scan vs ETF mundial (VT).
 * Uso: bun run scripts/scorecard.ts [--out output/YYYY-MM-DD_scorecard.md]
 * Fonte de precos: Yahoo Finance chart API (close ajustado nao usado; close simples).
 */

import { readdirSync } from "node:fs";
import type { ScanOutput, Entity } from "./validate.ts";

const OUTPUT_DIR = new URL("../output/", import.meta.url).pathname;
const BENCHMARK = "VT"; // Vanguard Total World — proxy de "ETF mundial"
const UA = { "User-Agent": "Mozilla/5.0" };

interface PricePoint { entry: number; entryDate: string; last: number; lastDate: string; }
interface Scored {
  file: string; scanDate: string; category: string;
  id: string; name: string; ticker: string; symbol: string;
  asymmetry: number; confidence: string;
  ret: number | null; note: string | null;
}

function toYahooSymbol(e: Entity): string | null {
  let t = (e.ticker || "").trim();
  if (!t) return null;
  if (e.status === "token") return `${t.toUpperCase()}-USD`;
  if (t.includes(":")) t = t.split(":")[0]; // formatos Bloomberg tipo "H2OVNCE:FP"
  if (t.endsWith(".ASX")) return t.replace(/\.ASX$/, ".AX");
  if (t.includes(".")) return t;
  const g = (e.geography || "").toLowerCase();
  if (/nasdaq|nyse|eua|usa|amex/.test(g)) return t;
  if (/euronext paris|franca|france|paris/.test(g)) return `${t}.PA`;
  if (/xetra|frankfurt|alemanha|germany/.test(g)) return `${t}.DE`;
  if (/lse|londres|london/.test(g)) return `${t}.L`;
  if (/amsterdam|holanda/.test(g)) return `${t}.AS`;
  if (/toronto|tsx/.test(g)) return `${t}.TO`;
  if (/asx|austral/.test(g)) return `${t}.AX`;
  if (/copenhaga|copenhagen|dinamarca/.test(g)) return `${t}.CO`;
  if (/oslo|noruega/.test(g)) return `${t}.OL`;
  if (/milao|milan|italia/.test(g)) return `${t}.MI`;
  if (/madrid|espanha/.test(g)) return `${t}.MC`;
  if (/six|suica|zurich/.test(g)) return `${t}.SW`;
  if (/estocolmo|stockholm|suecia/.test(g)) return `${t}.ST`;
  return t;
}

const cache = new Map<string, PricePoint | null>();

async function fetchPrices(symbol: string, fromISO: string): Promise<PricePoint | null> {
  const key = `${symbol}@${fromISO}`;
  if (cache.has(key)) return cache.get(key)!;
  const p1 = Math.floor(Date.parse(fromISO) / 1000);
  const p2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${p1}&period2=${p2}&interval=1d`;
  let out: PricePoint | null = null;
  try {
    const res = await fetch(url, { headers: UA });
    if (res.ok) {
      const j: any = await res.json();
      const r = j?.chart?.result?.[0];
      const ts: number[] = r?.timestamp || [];
      const closes: (number | null)[] = r?.indicators?.quote?.[0]?.close || [];
      const pts = ts.map((t, i) => ({ t, c: closes[i] })).filter(p => p.c != null) as { t: number; c: number }[];
      if (pts.length >= 2) {
        const d = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
        out = { entry: pts[0].c, entryDate: d(pts[0].t), last: pts[pts.length - 1].c, lastDate: d(pts[pts.length - 1].t) };
      }
    }
  } catch { /* sem rede ou simbolo invalido — fica null */ }
  cache.set(key, out);
  await new Promise(r => setTimeout(r, 200)); // nao martelar a API
  return out;
}

const pct = (p: PricePoint) => ((p.last - p.entry) / p.entry) * 100;
// retornos absurdos = quase sempre ticker reutilizado, reverse split ou penny sub-centimo intratavel
const OUTLIER_PCT = 300;
const isOutlier = (r: number | null): boolean => r != null && Math.abs(r) > OUTLIER_PCT;
const fmt = (n: number | null) => n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

async function main() {
  const files = readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith(".json") && !f.includes("agregado") && !f.includes("scorecard"))
    .sort();

  const scored: Scored[] = [];
  const benchByDate = new Map<string, number | null>();

  for (const file of files) {
    const data = JSON.parse(await Bun.file(OUTPUT_DIR + file).text()) as ScanOutput;
    if (!Array.isArray(data.entities)) continue;
    if (!benchByDate.has(data.scan_date)) {
      const b = await fetchPrices(BENCHMARK, data.scan_date);
      benchByDate.set(data.scan_date, b ? pct(b) : null);
    }
    for (const e of data.entities) {
      const symbol = toYahooSymbol(e);
      const base = {
        file, scanDate: data.scan_date, category: data.category,
        id: e.id, name: e.name, ticker: e.ticker || "—", symbol: symbol || "—",
        asymmetry: e.asymmetry_score, confidence: e.confidence,
      };
      if (!symbol) { scored.push({ ...base, ret: null, note: "sem ticker" }); continue; }
      const p = await fetchPrices(symbol, data.scan_date);
      scored.push(p ? { ...base, ret: pct(p), note: null } : { ...base, ret: null, note: "sem dados de preco" });
    }
    console.log(`scored: ${file}`);
  }

  // --- Relatorio ---
  const lines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  lines.push(`# Scorecard retrospectivo — ${today}`, "");
  lines.push(`Benchmark: **${BENCHMARK}** (Vanguard Total World). Retorno = close no scan_date → close mais recente. Sem dividendos, sem FX. Retornos >±${OUTLIER_PCT}% sao excluidos das medias e listados como outliers a verificar.`, "");

  lines.push(`## Por scan`, "");
  lines.push(`| Scan | N | Com preco | Media | Mediana | % positivos | ${BENCHMARK} | Alpha medio |`);
  lines.push(`|---|---|---|---|---|---|---|---|`);
  const byFile = new Map<string, Scored[]>();
  for (const s of scored) (byFile.get(s.file) ?? byFile.set(s.file, []).get(s.file)!).push(s);
  for (const [file, rows] of byFile) {
    const rets = rows.map(r => r.ret).filter((r): r is number => r != null && !isOutlier(r));
    const bench = benchByDate.get(rows[0].scanDate) ?? null;
    const m = mean(rets);
    const alpha = m != null && bench != null ? m - bench : null;
    const posPct = rets.length ? (rets.filter(r => r > 0).length / rets.length) * 100 : null;
    lines.push(`| ${file.replace(".json", "")} | ${rows.length} | ${rets.length} | ${fmt(m)} | ${fmt(median(rets))} | ${posPct == null ? "—" : posPct.toFixed(0) + "%"} | ${fmt(bench)} | ${fmt(alpha)} |`);
  }

  for (const [label, keyFn] of [
    ["Por asymmetry_score", (s: Scored) => `score ${s.asymmetry}`],
    ["Por confidence", (s: Scored) => s.confidence],
  ] as const) {
    lines.push("", `## ${label}`, "", `| Grupo | N com preco | Media | Mediana | % positivos |`, `|---|---|---|---|---|`);
    const groups = new Map<string, number[]>();
    for (const s of scored) {
      if (s.ret == null || isOutlier(s.ret)) continue;
      const k = keyFn(s) || "(sem campo — schema antigo)";
      (groups.get(k) ?? groups.set(k, []).get(k)!).push(s.ret);
    }
    for (const [k, rets] of [...groups].sort()) {
      lines.push(`| ${k} | ${rets.length} | ${fmt(mean(rets))} | ${fmt(median(rets))} | ${((rets.filter(r => r > 0).length / rets.length) * 100).toFixed(0)}% |`);
    }
  }

  const withRet = scored.filter(s => s.ret != null && !isOutlier(s.ret)) as (Scored & { ret: number })[];
  withRet.sort((a, b) => b.ret - a.ret);
  lines.push("", `## Top 10 / Bottom 10`, "", `| Pick | Scan | Retorno |`, `|---|---|---|`);
  for (const s of [...withRet.slice(0, 10), ...withRet.slice(-10)]) {
    lines.push(`| ${s.id} ${s.name} (${s.symbol}) | ${s.scanDate} | ${fmt(s.ret)} |`);
  }

  const outliers = scored.filter(s => isOutlier(s.ret));
  if (outliers.length) {
    lines.push("", `## Outliers excluidos (>±${OUTLIER_PCT}% — verificar split/ticker reutilizado/penny intratavel)`, "");
    for (const s of outliers) lines.push(`- ${s.id} ${s.name} (${s.symbol}) ${s.scanDate}: ${fmt(s.ret)}`);
  }

  const missing = scored.filter(s => s.ret == null);
  lines.push("", `## Sem preco (${missing.length})`, "");
  lines.push(missing.map(s => `${s.id} ${s.ticker} [${s.note}]`).join(" · ") || "—");

  const outFlag = process.argv.indexOf("--out");
  const outPath = outFlag > -1 ? process.argv[outFlag + 1] : `${OUTPUT_DIR}${today}_scorecard.md`;
  await Bun.write(outPath, lines.join("\n") + "\n");
  console.log(`\nEscrito: ${outPath}`);
  console.log(lines.slice(0, 30).join("\n"));
}

await main();
