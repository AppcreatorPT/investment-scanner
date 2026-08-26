import { test, expect } from "bun:test";
import {
  extractState, merge, makeState, stateToJson, normalizePosition, parseNum,
  type Position,
} from "./portfolio-state.ts";
import { readPositions, writePositions, renderPositionsTable } from "./portfolio-md.ts";

function pos(over: Partial<Position> = {}): Position {
  return {
    id: "id-leu-1", date: "2026-08-26", ticker: "LEU", name: "Centrus Energy",
    theme: "Materiais & Energia", units: 0.53, cost_eur: 30, value_eur: null, ...over,
  };
}
const page = (positions: Position[]) =>
  `<html><body><script id="portfolio-state" type="application/json">` +
  stateToJson(makeState(positions, "2026-08-26T10:00:00.000Z")) +
  `</script></body></html>`;

// ─── extractState: os casos de falha do ADR-1 ───

test("(a) pagina sem o bloco #portfolio-state → state null com motivo", () => {
  const { state, reason } = extractState("<html><body><h1>dashboard antigo</h1></body></html>");
  expect(state).toBeNull();
  expect(reason).toContain("sem bloco");
});

test("(b) read devolveu null/vazio → state null com motivo", () => {
  expect(extractState(null).state).toBeNull();
  expect(extractState(undefined).state).toBeNull();
  expect(extractState("").state).toBeNull();
  expect(extractState(null).reason).toContain("indisponivel");
});

test("(c) JSON malformado → state null, nao lanca", () => {
  const html = `<script id="portfolio-state" type="application/json">{"schema":1,"positions":[</script>`;
  const { state, reason } = extractState(html);
  expect(state).toBeNull();
  expect(reason).toContain("malformado");
});

test("schema desconhecido → state null (nunca adivinhar um formato futuro)", () => {
  const html = `<script id="portfolio-state" type="application/json">{"schema":99,"positions":[]}</script>`;
  expect(extractState(html).state).toBeNull();
});

test("round-trip: o que a pagina embute e o que sai do extractor", () => {
  const { state } = extractState(page([pos(), pos({ id: "id-nxe-1", ticker: "NXE", units: 2, cost_eur: 10 })]));
  expect(state!.positions.map((p) => p.ticker)).toEqual(["LEU", "NXE"]);
  expect(state!.positions[0].units).toBe(0.53);
});

test("linha ilegivel dentro de um bloco valido e ignorada, o resto passa", () => {
  const html = `<script id="portfolio-state" type="application/json">` +
    JSON.stringify({ schema: 1, updated: "x", positions: [pos(), { ticker: "", units: 1, cost_eur: 1 }] }) +
    `</script>`;
  const { state, reason } = extractState(html);
  expect(state!.positions).toHaveLength(1);
  expect(reason).toContain("ignorada");
});

// ─── merge: a regra de ouro ───

test("(b) merge com state null e NO-OP que preserva o repo", () => {
  const repo = [pos()];
  const r = merge(repo, null, "read falhou");
  expect(r.positions).toEqual(repo);
  expect(r.changed).toBe(false);
  expect(r.log[0]).toContain("NO-OP");
});

test("wipe total nao passa pela rotina — repo preservado", () => {
  const repo = [pos(), pos({ id: "id-nxe-1", ticker: "NXE" })];
  const r = merge(repo, makeState([]), "");
  expect(r.positions).toEqual(repo);
  expect(r.changed).toBe(false);
  expect(r.log[0]).toContain("wipe total");
});

test("pagina vazia e repo vazio nao e wipe — passa em silencio", () => {
  const r = merge([], makeState([]), "");
  expect(r.positions).toEqual([]);
  expect(r.changed).toBe(false);
});

test("posicao nova escrita na pagina entra no repo", () => {
  const r = merge([], makeState([pos()]), "");
  expect(r.positions).toHaveLength(1);
  expect(r.changed).toBe(true);
  expect(r.log.join(" ")).toContain("nova posicao");
});

test("apagar UMA linha na pagina e honrado (accao explicita do utilizador)", () => {
  const repo = [pos(), pos({ id: "id-nxe-1", ticker: "NXE" })];
  const r = merge(repo, makeState([repo[0]]), "");
  expect(r.positions.map((p) => p.ticker)).toEqual(["LEU"]);
  expect(r.changed).toBe(true);
  expect(r.log.join(" ")).toContain("apagada na pagina");
});

test("(d) mesmo id editado nos dois lados — a pagina ganha e a divergencia fica no log", () => {
  const repo = [pos({ units: 0.53, cost_eur: 30 })];
  const paginaEditada = [pos({ units: 1.06, cost_eur: 60 })];
  const r = merge(repo, makeState(paginaEditada), "");
  expect(r.positions[0].units).toBe(1.06);
  expect(r.positions[0].cost_eur).toBe(60);
  expect(r.log.join(" ")).toContain("a pagina ganha");
  expect(r.log.join(" ")).toContain("0.53");
});

test("reordenar na pagina nao inventa nem perde linhas (o id manda, nao o indice)", () => {
  const a = pos(), b = pos({ id: "id-nxe-1", ticker: "NXE" });
  const r = merge([a, b], makeState([b, a]), "");
  expect(r.positions.map((p) => p.id)).toEqual(["id-nxe-1", "id-leu-1"]);
  expect(r.log.join(" ")).not.toContain("apagada");
});

test("merge idempotente: correr duas vezes da o mesmo", () => {
  const repo = [pos()];
  const once = merge(repo, makeState([pos()]), "");
  const twice = merge(once.positions, makeState([pos()]), "");
  expect(twice.positions).toEqual(once.positions);
  expect(twice.changed).toBe(false);
});

// ─── PORTFOLIO.md ───

test("PORTFOLIO.md: escrever e reler devolve as mesmas posicoes", () => {
  const md = `# t\n\n## Posicoes\n\n${renderPositionsTable([])}\n\n**Total investido:** €0\n`;
  const positions = [pos(), pos({ id: "id-nxe-1", ticker: "NXE", units: 2.5, cost_eur: 25.5 })];
  const out = writePositions(md, positions);
  expect(readPositions(out)).toEqual(positions);
  expect(out).toContain("**Total investido:** €55.50");
});

test("PORTFOLIO.md: o resto do ficheiro nao e tocado", () => {
  const md = `# t\n\n## Alocacao\n\nnao mexer\n\n## Posicoes\n\n${renderPositionsTable([])}\n\n` +
    `**Total investido:** €0\n\n> nota que fica\n\n## Regra\n\ntambem fica\n`;
  const out = writePositions(md, [pos()]);
  expect(out).toContain("nao mexer");
  expect(out).toContain("> nota que fica");
  expect(out).toContain("tambem fica");
});

test("PORTFOLIO.md sem seccao Posicoes → no-op, nunca corromper o ficheiro", () => {
  const md = "# so alvos\n\n## Alocacao\n\nx\n";
  expect(writePositions(md, [pos()])).toBe(md);
});

test("carteira vazia escreve a linha placeholder e le zero posicoes", () => {
  const md = `## Posicoes\n\n${renderPositionsTable([pos()])}\n\n**Total investido:** €30\n`;
  const out = writePositions(md, []);
  expect(readPositions(out)).toEqual([]);
  expect(out).toContain("**Total investido:** €0.00");
});

test("tabela antiga sem coluna ID e lida na mesma (id gerado na escrita)", () => {
  const md = `## Posicoes\n\n| Data | Ticker | Nome | Tema | Unidades | Custo total (€) | Valor atual (€) |\n` +
    `|---|---|---|---|---|---|---|\n| 2026-08-26 | LEU | Centrus | Materiais & Energia | 0.53 | 30.00 | |\n`;
  const read = readPositions(md);
  expect(read).toHaveLength(1);
  expect(read[0].id).toBeTruthy();
});

// ─── numeros ───

test("parseNum aceita os formatos que aparecem nas tabelas", () => {
  expect(parseNum("€30,00")).toBe(30);
  expect(parseNum("1.234,56")).toBe(1234.56);
  expect(parseNum("1,234.56")).toBe(1234.56);
  expect(parseNum("0.53")).toBe(0.53);
  expect(parseNum("")).toBeNull();
  expect(parseNum("—")).toBeNull();
});

test("posicao sem ticker, sem unidades ou com unidades zero e rejeitada", () => {
  expect(normalizePosition({ ticker: "", units: 1, cost_eur: 1 })).toBeNull();
  expect(normalizePosition({ ticker: "LEU", units: 0, cost_eur: 1 })).toBeNull();
  expect(normalizePosition({ ticker: "LEU", units: "abc", cost_eur: 1 })).toBeNull();
  expect(normalizePosition({ ticker: "LEU", units: 1, cost_eur: "" })).toBeNull();
});

test("stateToJson nunca deixa um `<` literal (nao pode fechar o script)", () => {
  const json = stateToJson(makeState([pos({ name: "</script><img onerror=x>" })]));
  expect(json).not.toContain("<");
  expect(JSON.parse(json).positions[0].name).toBe("</script><img onerror=x>");
});
