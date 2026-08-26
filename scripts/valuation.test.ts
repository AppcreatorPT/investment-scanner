import { test, expect } from "bun:test";
import { parseBook, applyQuotes, quoteErrors, toEur, benchAt, emptyBook, type PriceBook } from "./prices.ts";
import { valuePositions } from "./valuation.ts";
import type { Position } from "./portfolio-state.ts";

const book = (over: Partial<PriceBook> = {}): PriceBook => ({
  ...emptyBook(),
  asof: "2026-08-26",
  fx: { USD: { per_eur: 2, asof: "2026-08-26", source: "https://ecb.example/x" } },
  prices: { LEU: { price: 200, currency: "USD", asof: "2026-08-26", source: "https://src.example/leu" } },
  benchmark: {
    ticker: "SPY", currency: "USD", source: "https://src.example/spy",
    history: {
      "2026-01-01": { spy: 700, usd_per_eur: 2 },
      "2026-08-26": { spy: 770, usd_per_eur: 2 },
    },
  },
  ...over,
});

const pos = (o: Partial<Position> = {}): Position => ({
  id: "p1", date: "2026-01-01", ticker: "LEU", name: "Centrus", theme: "Materiais & Energia",
  units: 1, cost_eur: 80, value_eur: null, ...o,
});

// ─── o guarda: nada entra sem fonte e sem data ───

test("cotacao sem source e recusada — e a Licao #23 codificada", () => {
  const e = quoteErrors("LEU", { price: 100, currency: "USD", asof: "2026-08-26" });
  expect(e.join(" ")).toContain("source");
});

test("cotacao sem asof, com preco nao numerico ou negativo e recusada", () => {
  expect(quoteErrors("X", { price: 1, currency: "USD", source: "https://a.b" }).join(" ")).toContain("asof");
  expect(quoteErrors("X", { price: "1", currency: "USD", asof: "2026-08-26", source: "https://a.b" }).join(" ")).toContain("price");
  expect(quoteErrors("X", { price: -1, currency: "USD", asof: "2026-08-26", source: "https://a.b" }).join(" ")).toContain("price");
});

test("applyQuotes recusa a nova e mantem a anterior", () => {
  const b = book();
  const { book: next, log } = applyQuotes(b, { LEU: { price: 999, currency: "USD", asof: "hoje", source: "" } });
  expect(next.prices.LEU.price).toBe(200);
  expect(log.join(" ")).toContain("fica o preco anterior");
});

test("parseBook: ficheiro ausente ou corrompido devolve livro vazio, nao lanca", () => {
  expect(parseBook(null).book.prices).toEqual({});
  expect(parseBook("{nao json").book.prices).toEqual({});
  expect(parseBook("{nao json").reason).toContain("malformado");
});

test("parseBook deixa de fora cotacoes sem proveniencia e di-lo", () => {
  const raw = JSON.stringify({ prices: { OK: { price: 1, currency: "USD", asof: "2026-08-26", source: "https://a.b" }, MAU: { price: 2 } } });
  const { book: b, reason } = parseBook(raw);
  expect(Object.keys(b.prices)).toEqual(["OK"]);
  expect(reason).toContain("rejeitada");
});

test("toEur nao assume paridade quando o cambio e desconhecido", () => {
  expect(toEur(100, "USD", book())).toBe(50);
  expect(toEur(100, "EUR", book())).toBe(100);
  expect(toEur(100, "GBP", book())).toBeNull();
});

// ─── valorizacao ───

test("sem preco: posicao sem P/L em vez de P/L inventado", () => {
  const v = valuePositions([pos({ ticker: "ZZZ" })], book(), "2026-08-26");
  expect(v.positions[0].value).toBeNull();
  expect(v.positions[0].pl).toBeNull();
  expect(v.totals.value).toBeNull();
  expect(v.totals.unpriced).toBe(1);
});

test("com preco: valor = unidades x preco convertido a euros", () => {
  const v = valuePositions([pos({ units: 2, cost_eur: 150 })], book(), "2026-08-26");
  expect(v.positions[0].value).toBe(200);          // 2 x $200 / 2 USD-por-EUR
  expect(v.positions[0].valueFrom).toBe("mercado");
  expect(v.positions[0].pl).toBe(50);
  expect(v.positions[0].plPct).toBeCloseTo(33.33, 1);
});

test("valor manual do extracto ganha ao preco diario", () => {
  const v = valuePositions([pos({ value_eur: 111 })], book(), "2026-08-26");
  expect(v.positions[0].value).toBe(111);
  expect(v.positions[0].valueFrom).toBe("manual");
});

test("preco velho e marcado, nao escondido", () => {
  const b = book({ prices: { LEU: { price: 200, currency: "USD", asof: "2026-08-10", source: "https://a.b" } } });
  const v = valuePositions([pos()], b, "2026-08-26");
  expect(v.positions[0].stale).toBe(true);
  expect(v.positions[0].value).toBe(100);          // continua a valorizar — so avisa
  expect(v.totals.anyStale).toBe(true);
});

test("preco de sexta lido na segunda nao conta como velho", () => {
  const b = book({ prices: { LEU: { price: 200, currency: "USD", asof: "2026-08-21", source: "https://a.b" } } });
  expect(valuePositions([pos()], b, "2026-08-24").positions[0].stale).toBe(false);
});

test("cobertura parcial nao produz um total comparavel", () => {
  const v = valuePositions([pos(), pos({ id: "p2", ticker: "ZZZ", cost_eur: 50 })], book(), "2026-08-26");
  expect(v.totals.priced).toBe(1);
  expect(v.totals.unpriced).toBe(1);
  expect(v.totals.pl).toBeNull();                  // nao comparar carteira parcial com custo inteiro
  expect(v.totals.invested).toBe(130);
});

test("varias compras do mesmo ticker acumulam em custo medio", () => {
  const v = valuePositions([
    pos({ id: "a", units: 1, cost_eur: 80 }),
    pos({ id: "b", units: 3, cost_eur: 360, date: "2026-08-26" }),
  ], book(), "2026-08-26");
  expect(v.holdings).toHaveLength(1);
  const h = v.holdings[0];
  expect(h.units).toBe(4);
  expect(h.cost).toBe(440);
  expect(h.avgCost).toBe(110);
  expect(h.value).toBe(400);                       // 4 x €100
  expect(h.lines).toBe(2);
});

// ─── benchmark ───

test("SPY no mesmo periodo, em euros, so para datas cobertas", () => {
  const v = valuePositions([pos({ cost_eur: 100 })], book(), "2026-08-26");
  const b = v.totals.bench!;
  expect(b.covered).toBe(1);
  expect(b.uncovered).toBe(0);
  expect(b.value).toBeCloseTo(110, 6);             // 700 → 770 com cambio constante
  expect(b.plPct).toBeCloseTo(10, 6);
});

test("o cambio de cada dia entra na comparacao — nao e so o movimento do SPY", () => {
  const b = book({ benchmark: { ticker: "SPY", currency: "USD", source: "s", history: {
    "2026-01-01": { spy: 700, usd_per_eur: 2 },
    "2026-08-26": { spy: 770, usd_per_eur: 2.2 },   // dolar mais fraco anula a subida
  } } });
  expect(valuePositions([pos({ cost_eur: 100 })], b, "2026-08-26").totals.bench!.plPct).toBeCloseTo(0, 6);
});

test("posicao anterior ao historico do benchmark conta como nao coberta", () => {
  const v = valuePositions([pos({ date: "2025-01-01" })], book(), "2026-08-26");
  expect(v.totals.bench!.covered).toBe(0);
  expect(v.totals.bench!.uncovered).toBe(1);
  expect(v.totals.bench!.plPct).toBeNull();
});

test("benchAt usa o ponto mais recente ANTES da data, nao o seguinte", () => {
  expect(benchAt(book(), "2026-05-01")!.date).toBe("2026-01-01");
  expect(benchAt(book(), "2025-12-31")).toBeNull();
});

test("sem historico de benchmark nao ha comparacao (nem falsa)", () => {
  const v = valuePositions([pos()], book({ benchmark: { ticker: "SPY", currency: "USD", source: "", history: {} } }), "2026-08-26");
  expect(v.totals.bench).toBeNull();
});

test("carteira vazia: tudo a zero e sem benchmark, o build tem de aguentar", () => {
  const v = valuePositions([], book(), "2026-08-26");
  expect(v.totals.invested).toBe(0);
  expect(v.totals.value).toBeNull();
  expect(v.totals.bench).toBeNull();
  expect(v.holdings).toEqual([]);
});
