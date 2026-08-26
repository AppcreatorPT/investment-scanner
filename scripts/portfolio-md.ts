/**
 * Leitura e escrita da tabela "Posicoes" do PORTFOLIO.md.
 *
 * A tabela ganhou uma coluna `ID` (uuid por linha, exigida pelo ADR-1): e o que
 * permite reconciliar com a pagina viva depois de reordenar, editar ou apagar
 * linhas. Ficheiros antigos sem a coluna sao lidos na mesma — o id e gerado na
 * primeira escrita.
 */

import { sections, table } from "./md.ts";
import { fmtUnits, normalizePosition, type Position } from "./portfolio-state.ts";

const HEADER =
  "| Data | Ticker | Nome | Tema | Unidades | Custo total (€) | Valor atual (€) | ID |";
const RULE = "|------|--------|------|------|----------|-----------------|-----------------|----|";
const EMPTY_ROW = "| | | | | | | | |";

/** Le as posicoes do texto de PORTFOLIO.md. Linhas ilegiveis sao ignoradas. */
export function readPositions(md: string): Position[] {
  const block = sections(md)["Posicoes"] ?? "";
  const out: Position[] = [];
  for (const r of table(block)) {
    const p = normalizePosition({
      id: r["ID"],
      date: r["Data"],
      ticker: r["Ticker"],
      name: r["Nome"],
      theme: r["Tema"],
      units: r["Unidades"],
      cost_eur: r["Custo total (€)"],
      value_eur: r["Valor atual (€)"],
    });
    if (p) out.push(p);
  }
  return out;
}

/** A tabela markdown das posicoes (com a linha vazia quando a carteira esta vazia). */
export function renderPositionsTable(positions: Position[]): string {
  const rows = positions.length
    ? positions.map((p) =>
        `| ${p.date} | ${p.ticker} | ${p.name} | ${p.theme} | ${fmtUnits(p.units)} | ` +
        `${p.cost_eur.toFixed(2)} | ${p.value_eur ? p.value_eur.toFixed(2) : ""} | ${p.id} |`,
      )
    : [EMPTY_ROW];
  return [HEADER, RULE, ...rows].join("\n");
}

/**
 * Devolve o PORTFOLIO.md com a tabela de posicoes e o total investido
 * substituidos. Todo o resto do ficheiro — alvos, regra mensal, notas — fica
 * intacto: a rotina so escreve o que a pagina possui.
 *
 * Se a seccao "Posicoes" nao existir, devolve o markdown inalterado (no-op).
 */
export function writePositions(md: string, positions: Position[]): string {
  const heading = md.match(/^##\s+Posicoes\s*$/m);
  if (!heading || heading.index === undefined) return md;

  const start = heading.index + heading[0].length;
  const rest = md.slice(start);

  // A tabela vai do primeiro `|` ate a ultima linha consecutiva que comeca por `|`.
  const lines = rest.split("\n");
  const first = lines.findIndex((l) => l.trim().startsWith("|"));
  if (first === -1) return md;
  let last = first;
  while (last + 1 < lines.length && lines[last + 1].trim().startsWith("|")) last++;

  const total = positions.reduce((s, p) => s + p.cost_eur, 0);
  const replaced = [
    ...lines.slice(0, first),
    renderPositionsTable(positions),
    ...lines.slice(last + 1),
  ].join("\n");

  return (md.slice(0, start) + replaced).replace(
    /^\*\*Total investido:\*\*.*$/m,
    `**Total investido:** €${total.toFixed(2)}`,
  );
}
