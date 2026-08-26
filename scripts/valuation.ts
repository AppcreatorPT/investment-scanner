/**
 * P/L da carteira contra `output/prices.json`.
 *
 * Regras que o dashboard herda daqui:
 *  - Precedencia de valor: **valor manual** (extracto do broker) → **preco diario ×
 *    unidades** → nada. Sem preco, a posicao aparece sem P/L em vez de aparecer com
 *    um P/L inventado.
 *  - Um preco mais velho que `STALE_AFTER_DAYS` e marcado, nunca escondido.
 *  - A comparacao com o SPY e feita **em euros** (usa o cambio do proprio dia), e so
 *    para as posicoes cujas datas o historico do benchmark cobre. As outras contam-se
 *    a parte — nunca se extrapola cobertura.
 */

import type { Position } from "./portfolio-state.ts";
import {
  type PriceBook, STALE_AFTER_DAYS, benchAt, benchLatest, daysBetween, toEur,
} from "./prices.ts";

export interface ValuedPosition extends Position {
  price: number | null;
  priceCurrency: string;
  priceAsof: string;
  priceSource: string;
  stale: boolean;
  value: number | null;
  valueFrom: "manual" | "mercado" | null;
  pl: number | null;
  plPct: number | null;
}

export interface Holding {
  ticker: string; name: string; theme: string;
  units: number; cost: number; lines: number;
  avgCost: number;                        // custo medio por unidade, em EUR
  value: number | null; pl: number | null; plPct: number | null;
  price: number | null; priceCurrency: string; priceAsof: string; stale: boolean;
}

export interface PortfolioTotals {
  invested: number;
  value: number | null;
  pl: number | null;
  plPct: number | null;
  priced: number;
  unpriced: number;
  anyStale: boolean;
  /** O que o mesmo dinheiro valeria em SPY, em euros, no mesmo periodo. */
  bench: {
    ticker: string;
    covered: number; uncovered: number;
    cost: number; value: number | null; plPct: number | null;
    asof: string;
  } | null;
}

export function valuePositions(
  positions: Position[], book: PriceBook, today: string,
): { positions: ValuedPosition[]; holdings: Holding[]; totals: PortfolioTotals } {
  const valued: ValuedPosition[] = positions.map((p) => {
    const q = book.prices[p.ticker];
    const eur = q ? toEur(q.price, q.currency, book) : null;

    let value: number | null = null;
    let valueFrom: ValuedPosition["valueFrom"] = null;
    if (p.value_eur && p.value_eur > 0) { value = p.value_eur; valueFrom = "manual"; }
    else if (eur !== null) { value = eur * p.units; valueFrom = "mercado"; }

    return {
      ...p,
      price: q ? q.price : null,
      priceCurrency: q?.currency ?? "",
      priceAsof: q?.asof ?? "",
      priceSource: q?.source ?? "",
      stale: !!q && daysBetween(q.asof, today) > STALE_AFTER_DAYS,
      value,
      valueFrom,
      pl: value === null ? null : value - p.cost_eur,
      plPct: value === null || !p.cost_eur ? null : ((value - p.cost_eur) / p.cost_eur) * 100,
    };
  });

  // Agregacao por ticker — varias compras do mesmo nome acumulam-se em custo medio.
  const byTicker = new Map<string, Holding>();
  for (const p of valued) {
    const h = byTicker.get(p.ticker) ?? {
      ticker: p.ticker, name: p.name, theme: p.theme,
      units: 0, cost: 0, lines: 0, avgCost: 0,
      value: null, pl: null, plPct: null,
      price: p.price, priceCurrency: p.priceCurrency, priceAsof: p.priceAsof, stale: p.stale,
    };
    h.units += p.units;
    h.cost += p.cost_eur;
    h.lines += 1;
    if (p.value !== null) h.value = (h.value ?? 0) + p.value;
    byTicker.set(p.ticker, h);
  }
  const holdings = [...byTicker.values()].map((h) => ({
    ...h,
    avgCost: h.units ? h.cost / h.units : 0,
    pl: h.value === null ? null : h.value - h.cost,
    plPct: h.value === null || !h.cost ? null : ((h.value - h.cost) / h.cost) * 100,
  }));

  const invested = valued.reduce((s, p) => s + p.cost_eur, 0);
  const pricedRows = valued.filter((p) => p.value !== null);
  const value = pricedRows.length ? pricedRows.reduce((s, p) => s + (p.value ?? 0), 0) : null;

  // O total so e comparavel com o investido se TODAS as linhas tiverem valor —
  // senao estariamos a comparar uma carteira parcial com o custo inteiro.
  const complete = pricedRows.length === valued.length && valued.length > 0;

  return {
    positions: valued,
    holdings,
    totals: {
      invested,
      value,
      pl: complete && value !== null ? value - invested : null,
      plPct: complete && value !== null && invested ? ((value - invested) / invested) * 100 : null,
      priced: pricedRows.length,
      unpriced: valued.length - pricedRows.length,
      anyStale: valued.some((p) => p.stale),
      bench: benchmark(valued, book),
    },
  };
}

/** O mesmo dinheiro, nas mesmas datas, em SPY — convertido a euros com o cambio de cada dia. */
function benchmark(positions: ValuedPosition[], book: PriceBook): PortfolioTotals["bench"] {
  const now = benchLatest(book);
  if (!now || !positions.length) return null;

  const eurNow = now.point.spy / now.point.usd_per_eur;
  let cost = 0, value = 0, covered = 0, uncovered = 0;

  for (const p of positions) {
    const then = p.date ? benchAt(book, p.date) : null;
    if (!then || !(then.point.usd_per_eur > 0) || !(then.point.spy > 0)) { uncovered++; continue; }
    const eurThen = then.point.spy / then.point.usd_per_eur;
    cost += p.cost_eur;
    value += p.cost_eur * (eurNow / eurThen);
    covered++;
  }

  if (!covered) return { ticker: book.benchmark.ticker, covered, uncovered, cost: 0, value: null, plPct: null, asof: now.date };
  return {
    ticker: book.benchmark.ticker,
    covered, uncovered, cost, value,
    plPct: cost ? ((value - cost) / cost) * 100 : null,
    asof: now.date,
  };
}

export interface ThemeRow { theme: string; pct: number; rationale: string; value: number; actual: number; gap: number }

/**
 * Peso actual por tema contra o alvo. **Valor de mercado quando ha preco, custo quando
 * nao ha** (PORTFOLIO.md: "peso usa valor de mercado, nao custo").
 *
 * Corre nos dois lados: no build, e outra vez no browser quando o utilizador regista
 * uma posicao — e por isso que este ficheiro e injectado na pagina, para nao existirem
 * duas versoes desta conta.
 */
export function themeRows(
  positions: { theme: string; cost_eur: number; value?: number | null }[],
  targets: { theme: string; pct: number; rationale: string }[],
): { rows: ThemeRow[]; total: number } {
  const byTheme: Record<string, number> = {};
  let total = 0;
  for (const p of positions) {
    const v = p.value ?? p.cost_eur;
    byTheme[p.theme] = (byTheme[p.theme] ?? 0) + v;
    total += v;
  }
  const rows = targets.map((t) => {
    const value = byTheme[t.theme] ?? 0;
    const actual = total > 0 ? (value / total) * 100 : 0;
    return { ...t, value, actual, gap: t.pct - actual };
  });
  return { rows, total };
}
