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

const ROOT = join(import.meta.dir, "..");
const OUTPUT_DIR = join(ROOT, "output");

// ─────────────────────────── markdown helpers ───────────────────────────

/** Divide um documento em seccoes por heading `## `. */
function sections(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = md.split(/^##\s+/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    if (nl === -1) continue;
    // Remove a regua "---" que separa seccoes e o rodape do ficheiro.
    out[part.slice(0, nl).trim()] = part
      .slice(nl + 1)
      .replace(/\n-{3,}\s*$/, "")
      .replace(/\n-{3,}\n[\s\S]*$/, "")
      .trim();
  }
  return out;
}

/** Extrai a primeira tabela markdown de um bloco, como array de objectos. */
function table(block: string): Record<string, string>[] {
  const lines = block.split("\n");
  const start = lines.findIndex(
    (l, i) => l.trim().startsWith("|") && /^\|[\s:|-]+\|$/.test((lines[i + 1] ?? "").trim()),
  );
  if (start === -1) return [];

  const cells = (l: string) =>
    l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

  const headers = cells(lines[start]);
  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.trim().startsWith("|")) break;
    const vals = cells(line);
    if (vals.every((v) => !v)) continue; // linha placeholder vazia
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = vals[i] ?? ""));
    rows.push(row);
  }
  return rows;
}

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

const num = (s: string) => {
  const m = (s ?? "").replace(/[^\d.,-]/g, "").replace(",", ".");
  const v = parseFloat(m);
  return Number.isFinite(v) ? v : 0;
};

// ─────────────────────────── parsers ───────────────────────────

interface Target { theme: string; pct: number; rationale: string }
interface Position {
  date: string; ticker: string; name: string; theme: string;
  units: string; cost: number; value: number;
}

function parsePortfolio() {
  const md = read(join(ROOT, "PORTFOLIO.md"));
  const secs = sections(md);

  const targets: Target[] = table(secs["Alocacao alvo por tema"] ?? "").map((r) => ({
    theme: r["Tema"],
    pct: num(r["Alvo"]),
    rationale: r["Porque este peso"] ?? "",
  }));

  const positions: Position[] = table(secs["Posicoes"] ?? "")
    .filter((r) => r["Ticker"])
    .map((r) => ({
      date: r["Data"],
      ticker: r["Ticker"],
      name: r["Nome"],
      theme: r["Tema"],
      units: r["Unidades"],
      cost: num(r["Custo total (€)"]),
      value: num(r["Valor atual (€)"]),
    }));

  const monthly = num((md.match(/\*\*Aporte:\*\*\s*€?([\d.,]+)/) ?? [])[1] ?? "100");
  return { targets, positions, monthly };
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
  positions: Position[],
  picks: ReturnType<typeof parseBuylist>["picks"],
  carry: ReturnType<typeof parseBuylist>["carry"],
) {
  // Peso actual por tema — valor de mercado se disponivel, senao custo.
  const byTheme: Record<string, number> = {};
  let total = 0;
  for (const p of positions) {
    const v = p.value || p.cost;
    byTheme[p.theme] = (byTheme[p.theme] ?? 0) + v;
    total += v;
  }

  const rows = targets.map((t) => {
    const value = byTheme[t.theme] ?? 0;
    const actual = total > 0 ? (value / total) * 100 : 0;
    return { ...t, value, actual, gap: t.pct - actual };
  });

  // Candidatos compraveis de um tema, melhor score primeiro.
  const candidatesFor = (theme: string) =>
    picks
      .filter((p) => p.theme === theme && p.account !== "verificar")
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

  for (const { row, best } of ranked) {
    if (best.length) {
      return { theme: row.theme, gap: row.gap, pick: best[0], rows, total, alternatives: best.slice(1, 3) };
    }
  }
  return { theme: "", gap: 0, pick: null, rows, total, alternatives: [] };
}

// ─────────────────────────── build ───────────────────────────

const portfolio = parsePortfolio();
const delta = parseDelta();
const buylist = parseBuylist();
const weekly = parseWeekly();
const rec = recommend(portfolio.targets, portfolio.positions, buylist.picks, buylist.carry);

const DATA = {
  built: new Date().toISOString().slice(0, 10),
  portfolio,
  delta,
  buylist,
  weekly,
  rec,
};

const json = JSON.stringify(DATA).replace(/</g, "\\u003c");
const template = read(join(ROOT, "scripts", "dashboard-template.html"));
if (!template) {
  console.error("Falta scripts/dashboard-template.html");
  process.exit(1);
}

writeFileSync(join(ROOT, "dashboard.html"), template.replace("/*__DATA__*/null", json));

console.log(
  `dashboard.html construido — ${buylist.picks.length} picks, ${delta.alerts.length} alertas, ` +
    `${portfolio.positions.length} posicoes, recomendacao: ${rec.pick?.ticker ?? "nenhuma"}`,
);
