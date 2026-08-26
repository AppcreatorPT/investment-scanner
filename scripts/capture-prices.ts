#!/usr/bin/env bun
/**
 * Passo 3 da rotina: escrever os precos do dia em `output/prices.json`.
 *
 *   bun run scripts/capture-prices.ts --date 2026-08-26 <<'JSON'
 *   { "prices": { "LEU": {"price":187.63,"currency":"USD","asof":"2026-08-26",
 *                         "source":"https://stockanalysis.com/stocks/leu/"} },
 *     "fx":     { "USD": {"per_eur":1.1669,"asof":"2026-08-26","source":"https://ecb..."} },
 *     "bench":  { "spy": 766.08, "usd_per_eur": 1.1669 } }
 *   JSON
 *
 * O agente da rotina traz os numeros (WebFetch de fonte citavel); este script e a
 * guarda: **cotacao sem `source` e sem `asof` e recusada**, e o preco anterior fica.
 * Nao ha caminho neste script para escrever um preco sem proveniencia.
 *
 * --tickers imprime a lista de quem precisa de preco (carteira + top da buy-list).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { applyQuotes, parseBook, quoteErrors, type Fx } from "./prices.ts";
import { readPositions } from "./portfolio-md.ts";
import { sections, table, num } from "./md.ts";

const ROOT = join(import.meta.dir, "..");
const FILE = join(ROOT, "output", "prices.json");
const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf-8") : "");

const args = process.argv.slice(2);
const flag = (k: string) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };

/**
 * Quem precisa de preco: tudo o que esta na carteira, mais **o melhor de cada tema**
 * (que e de onde o cabaz do mes sai, seja qual for o tema mais descoberto), mais o
 * topo geral da buy-list. Cobrir os temas todos evita o cabaz aparecer sem preco.
 */
function neededTickers(limit = 8): string[] {
  const held = readPositions(read(join(ROOT, "PORTFOLIO.md"))).map((p) => p.ticker);
  const picks = table(read(join(ROOT, "BUYLIST.md")))
    .filter((r) => r["Ticker"])
    .sort((a, b) => num(b["Score"]) - num(a["Score"]));

  const bestPerTheme: string[] = [];
  const seenTheme = new Set<string>();
  for (const p of picks) {
    if (seenTheme.has(p["Tema"])) continue;
    seenTheme.add(p["Tema"]);
    bestPerTheme.push(p["Ticker"]);
  }
  return [...new Set([...held, ...bestPerTheme, ...picks.slice(0, limit).map((p) => p["Ticker"])])];
}

if (args.includes("--tickers")) {
  console.log(neededTickers(Number(flag("--limit") ?? 8)).join(" "));
  process.exit(0);
}

const { book, reason } = parseBook(read(FILE));
console.log(`prices.json: ${reason}`);

const stdin = await Bun.stdin.text();
if (!stdin.trim()) {
  console.log("Nada no stdin — nenhum preco alterado.");
  console.log(`Precisam de preco: ${neededTickers().join(" ")}`);
  process.exit(0);
}

let patch: any;
try { patch = JSON.parse(stdin); } catch (e: any) {
  console.error(`stdin nao e JSON valido: ${e.message}`);
  process.exit(1);
}

const { book: next, log } = applyQuotes(book, patch.prices ?? {});
for (const line of log) console.log("  " + line);

for (const [code, fx] of Object.entries((patch.fx ?? {}) as Record<string, Fx>)) {
  const errs = quoteErrors(code, { price: fx?.per_eur, currency: code, asof: fx?.asof, source: fx?.source });
  if (errs.length) { console.log(`  recusado cambio — ${errs.join("; ")}`); continue; }
  next.fx[code] = fx;
  console.log(`  cambio ${code}: ${fx.per_eur} por EUR (${fx.asof})`);
}

const date = flag("--date") ?? patch.date ?? new Date().toISOString().slice(0, 10);
if (patch.bench) {
  const { spy, usd_per_eur } = patch.bench;
  if (spy > 0 && usd_per_eur > 0) {
    next.benchmark.history[date] = { spy, usd_per_eur };
    console.log(`  benchmark ${date}: SPY ${spy} · USD/EUR ${usd_per_eur}`);
  } else {
    console.log("  recusado benchmark — precisa de spy e usd_per_eur positivos");
  }
}
next.asof = date;

const NOTA = "Capturado pela rotina diaria. Cada cotacao TEM de trazer asof e source — " +
  "scripts/prices.ts recusa as que nao trouxerem. Sem preco fiavel o anterior fica e o " +
  "dashboard marca-o stale. Ver licoes #15/#22/#23 do TRACK_RECORD.md.";
writeFileSync(FILE, JSON.stringify({ asof: next.asof, _nota: NOTA, ...next }, null, 2) + "\n");
console.log(`output/prices.json escrito — ${Object.keys(next.prices).length} cotacoes, ` +
  `${Object.keys(next.benchmark.history).length} pontos de benchmark.`);
