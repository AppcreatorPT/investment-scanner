/**
 * `output/prices.json` — os precos capturados pela rotina diaria.
 *
 * A invariante que este modulo existe para garantir: **nenhum preco entra sem
 * `asof` e `source`**. As licoes #15, #22 e #23 do TRACK_RECORD sao todas o mesmo
 * erro — um numero "estimado" sem fonte que depois distorceu o hit-rate. Aqui um
 * preco sem proveniencia e rejeitado, nao arredondado para o que parece plausivel.
 *
 * Sem preco fiavel, o anterior fica e e marcado `stale`. Nunca se adivinha.
 */

export interface Quote {
  price: number;
  currency: string;
  /** Data do fecho a que o preco se refere (YYYY-MM-DD). */
  asof: string;
  /** URL de onde veio. Obrigatorio. */
  source: string;
}

/** Cambio: quantas unidades desta moeda valem 1 EUR (USD 1.1669 = $1,1669 por €1). */
export interface Fx { per_eur: number; asof: string; source: string }

/** Fecho do benchmark e do cambio no mesmo dia — e o que torna a comparacao com o SPY honesta em euros. */
export interface BenchPoint { spy: number; usd_per_eur: number }

export interface PriceBook {
  asof: string;
  fx: Record<string, Fx>;
  prices: Record<string, Quote>;
  benchmark: { ticker: string; currency: string; source: string; history: Record<string, BenchPoint> };
}

export const emptyBook = (): PriceBook => ({
  asof: "",
  fx: {},
  prices: {},
  benchmark: { ticker: "SPY", currency: "USD", source: "", history: {} },
});

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\/\S+$/;

/** Erros que impedem uma cotacao de entrar. Lista vazia = aceite. */
export function quoteErrors(ticker: string, q: any): string[] {
  const e: string[] = [];
  if (!q || typeof q !== "object") return [`${ticker}: cotacao nao e um objecto`];
  if (typeof q.price !== "number" || !Number.isFinite(q.price) || q.price <= 0)
    e.push(`${ticker}: price tem de ser um numero positivo`);
  if (!q.currency || typeof q.currency !== "string") e.push(`${ticker}: falta currency`);
  if (!DATE.test(String(q.asof ?? ""))) e.push(`${ticker}: asof tem de ser YYYY-MM-DD`);
  if (!URL_RE.test(String(q.source ?? "")))
    e.push(`${ticker}: source tem de ser um URL — um preco sem fonte e inventado (Licao #23)`);
  return e;
}

/** Le o ficheiro. Ausente, vazio ou corrompido → livro vazio (a rotina segue sem precos). */
export function parseBook(raw: string | null | undefined): { book: PriceBook; reason: string } {
  if (!raw || !raw.trim()) return { book: emptyBook(), reason: "sem output/prices.json" };
  let d: any;
  try { d = JSON.parse(raw); } catch (err: any) {
    return { book: emptyBook(), reason: `prices.json com JSON malformado: ${err.message}` };
  }
  const base = emptyBook();
  const book: PriceBook = {
    asof: typeof d?.asof === "string" ? d.asof : "",
    fx: d?.fx && typeof d.fx === "object" ? d.fx : {},
    prices: {},
    benchmark: { ...base.benchmark, ...(d?.benchmark ?? {}) },
  };
  let dropped = 0;
  for (const [t, q] of Object.entries(d?.prices ?? {})) {
    if (quoteErrors(t, q).length) dropped++;
    else book.prices[t] = q as Quote;
  }
  if (!book.benchmark.history || typeof book.benchmark.history !== "object") book.benchmark.history = {};
  return { book, reason: dropped ? `ok (${dropped} cotacao(oes) rejeitada(s) por falta de fonte/data)` : "ok" };
}

/** Aplica cotacoes novas por cima das antigas. As invalidas sao recusadas e a antiga fica. */
export function applyQuotes(book: PriceBook, patch: Record<string, any>): { book: PriceBook; log: string[] } {
  const log: string[] = [];
  const out: PriceBook = { ...book, prices: { ...book.prices } };
  for (const [ticker, q] of Object.entries(patch ?? {})) {
    const errs = quoteErrors(ticker, q);
    if (errs.length) {
      log.push(`recusado — ${errs.join("; ")}` + (book.prices[ticker] ? " (fica o preco anterior)" : ""));
      continue;
    }
    const before = book.prices[ticker];
    out.prices[ticker] = q as Quote;
    log.push(before
      ? `${ticker}: ${before.price} (${before.asof}) → ${q.price} (${q.asof})`
      : `${ticker}: ${q.price} ${q.currency} (${q.asof}) — novo`);
  }
  return { book: out, log };
}

/** Dias inteiros entre duas datas ISO. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(from + "T00:00:00Z"), b = Date.parse(to + "T00:00:00Z");
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  return Math.round((b - a) / 86400000);
}

/** Um preco de sexta-feira lido na segunda nao esta velho; 5+ dias esta. */
export const STALE_AFTER_DAYS = 4;

/** Converte para EUR. Sem cambio conhecido → null (nunca assumir paridade). */
export function toEur(amount: number, currency: string, book: PriceBook): number | null {
  if (currency === "EUR") return amount;
  const fx = book.fx[currency];
  if (!fx || !(fx.per_eur > 0)) return null;
  return amount / fx.per_eur;
}

/** O ponto do benchmark na data pedida, ou o mais recente **antes** dela. */
export function benchAt(book: PriceBook, date: string): { date: string; point: BenchPoint } | null {
  const dates = Object.keys(book.benchmark.history ?? {}).filter((d) => DATE.test(d)).sort();
  let hit: string | null = null;
  for (const d of dates) { if (d <= date) hit = d; else break; }
  return hit ? { date: hit, point: book.benchmark.history[hit] } : null;
}

/** O ponto mais recente do benchmark. */
export function benchLatest(book: PriceBook): { date: string; point: BenchPoint } | null {
  const dates = Object.keys(book.benchmark.history ?? {}).filter((d) => DATE.test(d)).sort();
  return dates.length ? { date: dates.at(-1)!, point: book.benchmark.history[dates.at(-1)!] } : null;
}
