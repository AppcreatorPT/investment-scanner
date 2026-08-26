/**
 * Helpers de markdown partilhados pelo build e pelos scripts da rotina.
 * Extraidos de build-dashboard.ts para o parse da tabela de posicoes ser
 * exactamente o mesmo nos dois sitios.
 */

/** Divide um documento em seccoes por heading `## `. */
export function sections(md: string): Record<string, string> {
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
export function table(block: string): Record<string, string>[] {
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

/** Numero a partir de texto de tabela; 0 quando nao ha numero (uso em somas). */
export function num(s: string): number {
  const m = (s ?? "").replace(/[^\d.,-]/g, "").replace(",", ".");
  const v = parseFloat(m);
  return Number.isFinite(v) ? v : 0;
}

/**
 * Divide markdown em blocos por nivel de heading, **preservando a ordem**
 * (ao contrario de `sections()`, que devolve um mapa). Usado pela tese profunda,
 * onde a ordem das lentes e parte do argumento.
 */
export function blocks(md: string, level: 2 | 3): { title: string; body: string }[] {
  const re = new RegExp(`^${"#".repeat(level)} (?!#)(.+)$`, "gm");
  const out: { title: string; body: string }[] = [];
  let m: RegExpExecArray | null;
  let open: { title: string; from: number } | null = null;

  while ((m = re.exec(md))) {
    if (open) out.push({ title: open.title, body: md.slice(open.from, m.index).trim() });
    open = { title: m[1].trim(), from: m.index + m[0].length };
  }
  if (open) out.push({ title: open.title, body: md.slice(open.from).trim() });

  // A regua "---" que separa blocos irmaos nao pertence a nenhum deles.
  return out.map((b) => ({ ...b, body: b.body.replace(/\n*^-{3,}\s*$/m, "").trim() }));
}
