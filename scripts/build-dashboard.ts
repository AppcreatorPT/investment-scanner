#!/usr/bin/env bun
/**
 * Constroi dashboard.html a partir dos ficheiros do repo.
 *
 *   bun run scripts/build-dashboard.ts
 *
 * Le: PORTFOLIO.md, DELTA.md, BUYLIST.md, output/*_sintese-semanal.md, output/*.json
 * Escreve: dashboard.html (auto-contido, dados embutidos)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { sections, table, num, blocks } from "./md.ts";
import { readPositions } from "./portfolio-md.ts";
import { makeState, stateToJson, type Position } from "./portfolio-state.ts";
import { HEAD_END, STATE_SLOT, SOURCE_SLOT, toFullDocument, encodeSource } from "./page-source.ts";
import { parseBook, STALE_AFTER_DAYS } from "./prices.ts";
import { valuePositions, themeRows, type ValuedPosition } from "./valuation.ts";

const ROOT = join(import.meta.dir, "..");
const OUTPUT_DIR = join(ROOT, "output");

/** Ficheiro mais recente em output/ que corresponde ao sufixo. */
function latest(suffix: string): string | null {
  if (!existsSync(OUTPUT_DIR)) return null;
  const files = readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(suffix))
    .sort();
  return files.length ? files[files.length - 1] : null;
}

function read(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf-8") : "";
}

// ─────────────────────────── parsers ───────────────────────────

interface Target { theme: string; pct: number; rationale: string }

function parsePortfolio() {
  const md = read(join(ROOT, "PORTFOLIO.md"));
  const secs = sections(md);

  const targets: Target[] = table(secs["Alocacao alvo por tema"] ?? "").map((r) => ({
    theme: r["Tema"],
    pct: num(r["Alvo"]),
    rationale: r["Porque este peso"] ?? "",
  }));

  const positions: Position[] = readPositions(md);

  const monthly = num((md.match(/\*\*Aporte:\*\*\s*€?([\d.,]+)/) ?? [])[1] ?? "100");
  const lines = num((md.match(/\*\*Linhas por mes:\*\*\s*(\d+)/) ?? [])[1] ?? "4") || 4;

  // Nomes que a app recusou — nunca propor.
  const unavailable = ((md.match(/\*\*Indisponiveis:\*\*\s*(.+)/) ?? [])[1] ?? "")
    .split(/[,·]/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s && !/^_?\(?NENHUM/i.test(s));

  return { targets, positions, monthly, lines, unavailable };
}

interface Alert { ticker: string; level: string; title: string; body: string }

function parseDelta() {
  const md = read(join(ROOT, "DELTA.md"));
  const date = (md.match(/^#\s*Delta\s+(\S+)/m) ?? [])[1] ?? "";
  const secs = sections(md);

  // Alertas: blocos "**TICKER ... — titulo**\ncorpo"
  const alerts: Alert[] = [];
  let carried = "";
  for (const block of (secs["Alertas"] ?? "").split(/\n\n+/)) {
    const m = block.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)$/);
    if (!m) continue;
    const head = m[1].trim();
    if (/^Carry sem novidade/i.test(head)) {
      carried = (head.replace(/^Carry sem novidade[^:]*:\s*/i, "") + " " + m[2]).trim();
      continue;
    }
    const ticker = (head.match(/^([A-Z0-9.]{2,10})\b/) ?? [])[1] ?? "";
    const level = /⚠️⚠️/.test(head) ? "high" : /⚠️/.test(head) ? "warn" : "info";
    alerts.push({
      ticker,
      level,
      title: head.replace(/^[A-Z0-9.]{2,10}\s*/, "").replace(/[⚠️✅➡️❌/]+\s*/g, "").trim(),
      body: m[2].trim(),
    });
  }

  const moves = table(secs["Movimentos"] ?? "").map((r) => ({
    ticker: r["Ticker"],
    move: r["Movimento"],
    note: r["Nota"],
  }));

  const newNamesRaw = secs["Novos nomes"] ?? "";
  const newNames = table(newNamesRaw);

  return {
    date,
    alerts,
    carried,
    moves,
    newNames,
    newNamesText: newNames.length ? "" : newNamesRaw.trim(),
    unchanged: (secs["Sem alteracao"] ?? "").split("\n")[0].trim(),
  };
}

function parseBuylist() {
  const md = read(join(ROOT, "BUYLIST.md"));
  const date = (md.match(/^#\s*Buy-list\s+(\S+)/m) ?? [])[1] ?? "";

  const picks = table(md).map((r) => ({
    score: num(r["Score"]),
    ticker: r["Ticker"],
    name: r["Nome"],
    theme: r["Tema"],
    account: r["Conta"],
    entry: r["Entrada"],
    catalyst: r["Catalisador (data)"],
    why: r["Porque agora"],
  }));

  const secs = sections(md);
  const excluded = table(secs["Fora do perimetro desde 2026-08-26"] ?? "").map((r) => ({
    ticker: r["Ticker"], name: r["Nome"], reason: r["Motivo"],
  }));
  const carry = table(secs["Alertas de carry (nao aumentar)"] ?? "").map((r) => ({
    ticker: r["Ticker"], flag: r["Flag"], note: r["Nota"],
  }));

  return { date, picks, excluded, carry };
}

function parseWeekly() {
  const file = latest("_sintese-semanal.md");
  if (!file) return { date: "", blocks: [] as { title: string; body: string }[] };
  const md = read(join(OUTPUT_DIR, file));
  const secs = sections(md);
  const blocks = Object.entries(secs)
    .filter(([t]) => !/^Eventos$/i.test(t))
    .map(([title, body]) => ({ title, body: body.slice(0, 4000) }));
  return { date: file.slice(0, 10), blocks };
}

/**
 * Tese profunda (`output/YYYY-MM-DD_tese-profunda.md`, ver prompts/10).
 *
 * Um `##` por nome, um `###` por lente. O parser e generico sobre as lentes — se a
 * rotina de sabado acrescentar uma quinta, aparece sem mexer no build. So dois
 * campos sao extraidos por nome: o veredicto de valor (a pill) e o falsificador
 * (o rodape), porque sao os dois que o dashboard trata como dados e nao como texto.
 */
function parseThesis() {
  const file = latest("_tese-profunda.md");
  if (!file) return { date: "", intro: "", names: [] as ThesisName[] };
  const md = read(join(OUTPUT_DIR, file));

  const head = md.split(/^##\s/m)[0];
  const intro = (head.match(/^>\s?(.+(?:\n>\s?.+)*)/m) ?? ["", ""])[1]
    .split("\n").map((l) => l.replace(/^>\s?/, "").trim()).join(" ").trim();

  const names: ThesisName[] = blocks(md, 2).map((b) => {
    const [ticker, ...rest] = b.title.split(/\s+—\s+/);
    const meta = (k: string) =>
      (b.body.match(new RegExp(`\\*\\*${k}:\\*\\*\\s*([^·\\n]+)`)) ?? ["", ""])[1].trim();

    const lenses = blocks(b.body, 3).map((l) => {
      let body = l.body;
      let verdict = "";
      const v = body.match(/^\*\*Juizo:\*\*\s*(.+)$/m);
      if (v) { verdict = v[1].trim(); body = body.replace(v[0], "").trim(); }
      let falsifier = "";
      const f = body.match(/^\*\*Falsificador:\*\*\s*([\s\S]+)$/m);
      if (f) { falsifier = f[1].replace(/\s+/g, " ").trim(); body = body.replace(f[0], "").trim(); }
      return { title: l.title, body, verdict, falsifier };
    });

    return {
      ticker: ticker.trim(),
      name: rest.join(" — ").trim(),
      theme: meta("Tema"),
      why: meta("Porque entrou"),
      confidence: meta("Confianca"),
      lenses,
      verdict: lenses.find((l) => l.verdict)?.verdict ?? "",
      verdictKey: verdictKey(lenses.find((l) => l.verdict)?.verdict ?? ""),
      falsifier: lenses.find((l) => l.falsifier)?.falsifier ?? "",
    };
  });

  return { date: file.slice(0, 10), intro, names };
}

/** Normaliza o veredicto para a pill: quatro estados, nada de texto livre. */
function verdictKey(v: string): "barato" | "justo" | "caro" | "incerto" | "" {
  const t = v.toLowerCase();
  if (!t) return "";
  if (t.startsWith("barato")) return "barato";
  if (t.startsWith("justo")) return "justo";
  if (t.startsWith("caro")) return "caro";
  return "incerto";
}

interface ThesisLens { title: string; body: string; verdict: string; falsifier: string }
interface ThesisName {
  ticker: string; name: string; theme: string; why: string; confidence: string;
  lenses: ThesisLens[]; verdict: string; verdictKey: string; falsifier: string;
}

/**
 * Digest diario (`NEWS.md`, ver prompts/11). Uma tabela e duas notas.
 *
 * O cruzamento com a carteira e feito aqui e nao no prompt: quem esta em
 * PORTFOLIO.md muda de um dia para o outro, e uma noticia que toca uma posicao
 * real merece destaque diferente de uma que toca um candidato.
 */
function parseNews(held: Set<string>, basket: Set<string>) {
  const md = read(join(ROOT, "NEWS.md"));
  if (!md.trim()) return { date: "", window: "", scope: "", items: [] as NewsItem[], quiet: "", note: "" };

  const date = (md.match(/^#\s*Noticias\s+(\S+)/m) ?? [])[1] ?? "";
  const field = (k: string) =>
    (md.match(new RegExp(`\\*\\*${k}:\\*\\*\\s*([^·\\n]+)`)) ?? [])[1]?.trim() ?? "";
  const window = field("Janela");
  const scope = field("Perimetro");

  const items: NewsItem[] = table(md).map((r) => {
    const ticker = (r["Ticker"] ?? "").trim();
    return {
      ticker,
      name: r["Nome"] ?? "",
      what: r["O que aconteceu"] ?? "",
      why: r["Porque importa"] ?? "",
      source: r["Fonte"] ?? "",
      // Tres niveis de relevancia, nao dois: o que se tem, o que se vai comprar, o resto.
      relevance: held.has(ticker) ? "carteira" : basket.has(ticker) ? "cabaz" : "vigiar",
    };
  });

  const quiet = (md.match(/\*\*Sem noticia material:\*\*\s*([\s\S]*?)(?:\n\n|\n>|$)/) ?? [])[1]
    ?.replace(/\s+/g, " ").trim() ?? "";
  // Um bloco de citacao pode ter varias linhas — sem o `m`, `$` seria fim de linha
  // e a nota ficava truncada na primeira.
  const note = (md.match(/(?:^>.*(?:\n|$))+/m) ?? [""])[0]
    .split("\n").map((l) => l.replace(/^>\s?/, "").trim()).filter(Boolean).join(" ").trim();

  return { date, window, scope, items, quiet, note };
}

interface NewsItem {
  ticker: string; name: string; what: string; why: string; source: string;
  relevance: "carteira" | "cabaz" | "vigiar";
}

// ─────────────────────────── recomendacao mensal ───────────────────────────

/** Flags na buy-list que travam uma compra. */
function blocked(ticker: string, carry: { ticker: string; flag: string; note: string }[]) {
  const f = carry.find((c) => c.ticker === ticker);
  if (!f) return null;
  if (/INVALIDADO/i.test(f.flag)) return "invalidado";
  if (/nao aumentar|nao reforcar|nao entrar|aguardar|lockup/i.test(f.note)) return f.note;
  return null;
}

function recommend(
  targets: Target[],
  positions: ValuedPosition[],
  picks: ReturnType<typeof parseBuylist>["picks"],
  carry: ReturnType<typeof parseBuylist>["carry"],
  monthly: number,
  lines: number,
  unavailable: string[],
) {
  // Mesma conta que a pagina refaz quando o utilizador regista uma posicao.
  const { rows, total } = themeRows(positions, targets);

  // Candidatos compraveis de um tema, melhor score primeiro.
  const candidatesFor = (theme: string) =>
    picks
      .filter((p) => p.theme === theme && p.account !== "verificar")
      .filter((p) => !unavailable.includes(p.ticker.toUpperCase()))
      .filter((p) => !blocked(p.ticker, carry))
      .sort((a, b) => b.score - a.score);

  // Ordena por gap; empates (<0.5pp) desempatam pelo melhor score disponivel no tema.
  const EPS = 0.5;
  const ranked = rows
    .map((r) => ({ row: r, best: candidatesFor(r.theme) }))
    .sort((a, b) => {
      if (Math.abs(b.row.gap - a.row.gap) > EPS) return b.row.gap - a.row.gap;
      return (b.best[0]?.score ?? 0) - (a.best[0]?.score ?? 0);
    });

  // Os N temas mais descobertos que tenham candidato compravel.
  const chosen = ranked.filter((r) => r.best.length).slice(0, lines);
  if (!chosen.length) return { basket: [], rows, total };

  // Reparte o aporte proporcionalmente ao gap, a €5, com minimo por linha.
  const MIN = 20, STEP = 5;
  const weights = chosen.map((c) => Math.max(c.row.gap, 0.1));
  const sum = weights.reduce((a, b) => a + b, 0);
  const amounts = weights.map((w) =>
    Math.max(MIN, Math.round((w / sum) * monthly / STEP) * STEP),
  );

  // Reconcilia o arredondamento contra o aporte, mexendo na maior linha.
  const drift = monthly - amounts.reduce((a, b) => a + b, 0);
  if (drift !== 0) {
    const i = amounts.indexOf(Math.max(...amounts));
    amounts[i] = Math.max(MIN, amounts[i] + drift);
  }

  const basket = chosen.map((c, i) => ({
    theme: c.row.theme,
    gap: c.row.gap,
    amount: amounts[i],
    pick: c.best[0],
    alternatives: c.best.slice(1, 3),
  }));

  return { basket, rows, total };
}

// ─────────────────────────── build ───────────────────────────

const portfolio = parsePortfolio();
const delta = parseDelta();
const buylist = parseBuylist();
const weekly = parseWeekly();
const thesis = parseThesis();
const built = new Date().toISOString().slice(0, 10);
const { book, reason: priceReason } = parseBook(read(join(OUTPUT_DIR, "prices.json")));
const valuation = valuePositions(portfolio.positions, book, built);

const rec = recommend(
  portfolio.targets, valuation.positions, buylist.picks, buylist.carry,
  portfolio.monthly, portfolio.lines, portfolio.unavailable,
);

const news = parseNews(
  new Set(portfolio.positions.map((p) => p.ticker)),
  new Set(rec.basket.map((b) => b.pick.ticker)),
);

const DATA = {
  built,
  portfolio,
  // O livro de precos inteiro vai para a pagina: e o que lhe permite recalcular o
  // P/L com a mesma conta do build assim que o utilizador regista uma compra.
  book,
  staleAfterDays: STALE_AFTER_DAYS,
  valuation,
  delta,
  buylist,
  weekly,
  thesis,
  news,
  rec,
};

const json = JSON.stringify(DATA).replace(/</g, "\\u003c");
const template = read(join(ROOT, "scripts", "dashboard-template.html"));
if (!template) {
  console.error("Falta scripts/dashboard-template.html");
  process.exit(1);
}

/**
 * O mesmo codigo de valorizacao dos dois lados.
 *
 * O build calcula o P/L a partir de PORTFOLIO.md; a pagina tem de o recalcular
 * assim que o utilizador regista uma compra, sem esperar pela rotina. Em vez de
 * escrever a conta duas vezes (e ve-las divergir), transpilamos os modulos e
 * injectamo-los na pagina. Uma implementacao, dois sitios a corre-la.
 */
function inlineModule(file: string): string {
  const ts = new Bun.Transpiler({ loader: "ts" });
  return ts
    .transformSync(read(join(ROOT, "scripts", file)))
    .replace(/^import\s[\s\S]*?from\s+"[^"]+";\s*$/gm, "")
    .replace(/^export\s+(?=(function|const|let|var|class))/gm, "")
    .replace(/^export\s*\{[\s\S]*?\};\s*$/gm, "")
    .trim();
}
const shared = [inlineModule("prices.ts"), inlineModule("valuation.ts")].join("\n\n");

const withData = template
  .replace("/*__SHARED__*/", () => shared)
  .replace("/*__DATA__*/null", () => json);
if (template.includes("/*__SHARED__*/") === false) {
  console.error("Template sem o marcador /*__SHARED__*/");
  process.exit(1);
}
for (const marker of [HEAD_END, STATE_SLOT, SOURCE_SLOT]) {
  if (!withData.includes(marker)) {
    console.error(`Template sem o marcador ${marker}`);
    process.exit(1);
  }
}

// O fragmento vai para a ferramenta Artifact; leva embutida a fonte do documento
// completo para a propria pagina se poder republicar (ver scripts/page-source.ts).
const stateJson = stateToJson(makeState(portfolio.positions));
const out = withData
  .replace(HEAD_END, () => "")
  .replace(STATE_SLOT, () => stateJson)
  .replace(SOURCE_SLOT, () => encodeSource(toFullDocument(withData)));

writeFileSync(join(ROOT, "dashboard.html"), out);

const basket = rec.basket.map((b) => `${b.pick.ticker} €${b.amount}`).join(", ");
console.log(
  `dashboard.html construido — ${buylist.picks.length} picks, ${delta.alerts.length} alertas, ` +
    `${portfolio.positions.length} posicoes, ${thesis.names.length} teses, ${news.items.length} noticias, ${(out.length / 1024).toFixed(0)} KB\n` +
    `precos: ${priceReason} — ${Object.keys(book.prices).length} cotacoes, ` +
    `${valuation.totals.priced}/${portfolio.positions.length} posicoes valorizadas\n` +
    `cabaz do mes: ${basket || "nenhum"}`,
);
