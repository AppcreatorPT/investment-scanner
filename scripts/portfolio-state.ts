/**
 * Contrato de state das posicoes (ADR-1 do spec dashboard-v3).
 *
 * A carteira vive em dois sitios:
 *   - `PORTFOLIO.md`, tabela "Posicoes"      — o que os agentes de analise leem
 *   - `<script id="portfolio-state">` na pagina publicada — onde o utilizador escreve
 *
 * Este modulo e a unica implementacao do schema, do parse e do merge, para os dois
 * lados nunca divergirem. A regra de ouro esta em `merge()`: em qualquer duvida de
 * leitura o resultado e um no-op que preserva o que ja existe. Perder uma edicao e
 * mau; apagar a carteira e inaceitavel.
 */

export const STATE_SCHEMA = 1;
export const STATE_SCRIPT_ID = "portfolio-state";

export interface Position {
  id: string;
  date: string;      // YYYY-MM-DD
  ticker: string;
  name: string;
  theme: string;
  units: number;
  cost_eur: number;
  /** Valor de mercado escrito a mao (extracto do broker). Opcional — o build
   *  prefere `output/prices.json`; isto e o override manual. */
  value_eur?: number | null;
}

export interface PortfolioState {
  schema: number;
  updated: string;   // ISO
  positions: Position[];
}

export interface MergeResult {
  positions: Position[];
  /** true quando o resultado difere do que o repo tinha. */
  changed: boolean;
  /** Linhas legiveis para o log da rotina — sempre explicito sobre o que fez e nao fez. */
  log: string[];
}

// ─────────────────────────── helpers ───────────────────────────

export function newId(): string {
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback determinista o suficiente para ids locais.
  return "pos-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Numero a partir de texto de tabela ("€30,00", "0.53", "~€10"). NaN → null. */
export function parseNum(s: unknown): number | null {
  if (typeof s === "number") return Number.isFinite(s) ? s : null;
  const raw = String(s ?? "").trim();
  if (!raw || raw === "—" || raw === "-") return null;
  // "1.234,56" e "1,234.56" aparecem os dois. Manda o separador mais a direita:
  // e esse o decimal, o outro e milhares.
  let t = raw.replace(/[^\d.,-]/g, "");
  if (t.lastIndexOf(",") > t.lastIndexOf(".")) t = t.replace(/\./g, "").replace(/,/g, ".");
  else t = t.replace(/,/g, "");
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : null;
}

/** Formata unidades sem zeros a direita (0.53, 1, 12.345678). */
export function fmtUnits(n: number): string {
  return String(Number(n.toFixed(6)));
}

const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * Normaliza uma linha vinda de qualquer lado. Devolve null se a linha nao for
 * utilizavel — sem ticker, sem unidades positivas ou sem custo valido nao ha
 * posicao nenhuma para representar.
 */
export function normalizePosition(raw: any): Position | null {
  if (!raw || typeof raw !== "object") return null;
  const ticker = String(raw.ticker ?? "").trim();
  if (!ticker) return null;

  const units = parseNum(raw.units);
  const cost = parseNum(raw.cost_eur ?? raw.cost);
  if (units === null || !(units > 0)) return null;
  if (cost === null || cost < 0) return null;

  const value = parseNum(raw.value_eur ?? raw.value);

  return {
    id: String(raw.id ?? "").trim() || newId(),
    date: isDate(raw.date) ? raw.date : "",
    ticker,
    name: String(raw.name ?? "").trim(),
    theme: String(raw.theme ?? "").trim(),
    units,
    cost_eur: cost,
    value_eur: value !== null && value > 0 ? value : null,
  };
}

export function makeState(positions: Position[], updated?: string): PortfolioState {
  return {
    schema: STATE_SCHEMA,
    updated: updated ?? new Date().toISOString(),
    positions,
  };
}

/** JSON seguro para embutir num `<script>` — nenhum `<` sobrevive literal. */
export function stateToJson(state: PortfolioState): string {
  return JSON.stringify(state).replace(/</g, "\\u003c");
}

// ─────────────────────────── ler a pagina viva ───────────────────────────

export interface ExtractResult {
  state: PortfolioState | null;
  /** Porque falhou (ou "ok"). Vai para o log da rotina — nunca falhar em silencio. */
  reason: string;
}

/**
 * Extrai `#portfolio-state` do HTML publicado. Qualquer falha devolve
 * `state: null` com motivo: quem chama trata isso como "nao mexer na carteira".
 */
export function extractState(html: string | null | undefined): ExtractResult {
  if (typeof html !== "string" || !html.trim()) {
    return { state: null, reason: "HTML do artifact vazio ou indisponivel (read falhou?)" };
  }

  const re = new RegExp(
    `<script[^>]*\\bid=["']${STATE_SCRIPT_ID}["'][^>]*>([\\s\\S]*?)<\\/script>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return { state: null, reason: `pagina sem bloco #${STATE_SCRIPT_ID} (versao antiga?)` };

  const body = m[1].trim();
  if (!body) return { state: null, reason: `bloco #${STATE_SCRIPT_ID} vazio` };

  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch (e: any) {
    return { state: null, reason: `bloco #${STATE_SCRIPT_ID} com JSON malformado: ${e.message}` };
  }

  if (!parsed || typeof parsed !== "object") {
    return { state: null, reason: `bloco #${STATE_SCRIPT_ID} nao e um objecto` };
  }
  if (parsed.schema !== STATE_SCHEMA) {
    return { state: null, reason: `schema ${parsed.schema} desconhecido (esperado ${STATE_SCHEMA})` };
  }
  if (!Array.isArray(parsed.positions)) {
    return { state: null, reason: `bloco #${STATE_SCRIPT_ID} sem array "positions"` };
  }

  const positions: Position[] = [];
  let dropped = 0;
  for (const raw of parsed.positions) {
    const p = normalizePosition(raw);
    if (p) positions.push(p);
    else dropped++;
  }
  // Linhas ilegiveis dentro de um bloco valido sao ruido, nao motivo para abortar
  // o merge todo — mas ficam no log.
  const note = dropped ? ` (${dropped} linha(s) ilegivel(eis) ignorada(s))` : "";

  return {
    state: { schema: STATE_SCHEMA, updated: String(parsed.updated ?? ""), positions },
    reason: "ok" + note,
  };
}

// ─────────────────────────── merge ───────────────────────────

/**
 * Reconcilia a carteira do repo com a que veio da pagina.
 *
 * ADR-1: para posicoes (units/cost/date/ticker) **a pagina ganha** — e onde o
 * utilizador escreve. Duas travas por cima disso:
 *
 *  1. `page === null` (read falhou, pagina sem bloco, JSON partido) → NO-OP.
 *  2. A pagina traz zero posicoes e o repo tem posicoes → NO-OP. Um wipe total
 *     e a assinatura de um build/read defeituoso; apagar a carteira toda tem de
 *     ser um gesto deliberado em PORTFOLIO.md, nao um efeito lateral da rotina.
 *
 * Apagar linhas individuais na pagina e honrado — e uma accao explicita com
 * confirmacao no UI.
 */
export function merge(repo: Position[], page: PortfolioState | null, reason = ""): MergeResult {
  const log: string[] = [];

  if (!page) {
    log.push(`merge NO-OP — ${reason || "sem state da pagina"}; PORTFOLIO.md fica como esta (${repo.length} posicoes)`);
    return { positions: repo, changed: false, log };
  }

  if (page.positions.length === 0 && repo.length > 0) {
    log.push(
      `merge NO-OP — a pagina veio com 0 posicoes e o repo tem ${repo.length}. ` +
        `Um wipe total nao passa pela rotina: se e mesmo para esvaziar, apaga as linhas em PORTFOLIO.md.`,
    );
    return { positions: repo, changed: false, log };
  }

  const byId = new Map(repo.map((p) => [p.id, p]));
  const out: Position[] = [];

  for (const p of page.positions) {
    const before = byId.get(p.id);
    if (!before) {
      log.push(`+ nova posicao da pagina: ${p.ticker} ${fmtUnits(p.units)}un €${p.cost_eur.toFixed(2)}`);
    } else {
      const diffs = (["date", "ticker", "name", "theme", "units", "cost_eur"] as const)
        .filter((k) => String(before[k] ?? "") !== String(p[k] ?? ""));
      if (diffs.length) {
        // Caso (d) do spec: editado nos dois lados desde o ultimo build. A pagina
        // ganha, mas a divergencia fica visivel em vez de desaparecer em silencio.
        log.push(
          `~ ${p.ticker} (${p.id.slice(0, 8)}): a pagina ganha em ${diffs.join(", ")} — ` +
            diffs.map((k) => `${k} ${String(before[k] ?? "—")}→${String(p[k] ?? "—")}`).join("; "),
        );
      }
      byId.delete(p.id);
    }
    out.push(p);
  }

  for (const gone of byId.values()) {
    log.push(`- apagada na pagina: ${gone.ticker} ${fmtUnits(gone.units)}un €${gone.cost_eur.toFixed(2)}`);
  }

  const changed = JSON.stringify(repo) !== JSON.stringify(out);
  if (!changed) log.push(`merge sem alteracoes — ${out.length} posicoes iguais dos dois lados`);
  return { positions: out, changed, log };
}
