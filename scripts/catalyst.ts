/**
 * Prazos de catalisador a partir de texto livre.
 *
 * Vive num modulo proprio para poder ser testado sem correr o build.
 */

/**
 * Data-limite de um catalisador escrito em texto livre.
 *
 * Os catalisadores da buy-list sao frases ("PM647 IND/CTA antes fim Set 2026",
 * "Q3 Nov 2026", "Voto LivePerson 2-Set-2026"). Isto extrai a data **quando
 * consegue** e devolve null quando nao consegue — o dashboard so poe prazo no que
 * foi mesmo lido. Adivinhar uma data seria inventar urgencia.
 */
const MONTHS: Record<string, number> = {
  jan: 1, fev: 2, feb: 2, mar: 3, abr: 4, apr: 4, mai: 5, may: 5, jun: 6,
  jul: 7, ago: 8, aug: 8, set: 9, sep: 9, out: 10, oct: 10, nov: 11, dez: 12, dec: 12,
};
const endOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

export function catalystDeadline(text: string): string | null {
  const t = (text ?? "").toLowerCase();
  const mon = `(${Object.keys(MONTHS).join("|")})`;

  // "2-Set-2026", "2 Set 2026" — dia explicito
  let m = t.match(new RegExp(`\\b(\\d{1,2})[-\\s]${mon}[a-z]*[-\\s](\\d{4})`));
  if (m) return `${m[3]}-${String(MONTHS[m[2]]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;

  // "Q3 2026" / "Q4 2026" — fim do trimestre
  m = t.match(/\bq([1-4])\s*(\d{4})/);
  if (m) return endOfMonth(Number(m[2]), Number(m[1]) * 3);

  // "H1 2026" / "H2 2026" — fim do semestre
  m = t.match(/\bh([12])\s*(\d{4})/);
  if (m) return endOfMonth(Number(m[2]), Number(m[1]) * 6);

  // "fim Set 2026", "Set 2026", "late 2027" → fim do mes / do ano
  m = t.match(new RegExp(`${mon}[a-z]*\\s*(\\d{4})`));
  if (m) return endOfMonth(Number(m[2]), MONTHS[m[1]]);
  m = t.match(/\b(?:late|fim de|ate)\s*(20\d{2})\b/);
  if (m) return `${m[1]}-12-31`;

  return null;
}

/** Dias ate uma data ISO a partir de hoje; negativo = ja passou. */
export function daysUntil(iso: string, today: string): number {
  const a = Date.parse(today + "T00:00:00Z"), b = Date.parse(iso + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}
