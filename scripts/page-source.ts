/**
 * A pagina que se reescreve a si propria.
 *
 * `artifact.publish()` exige um **documento completo** com doctype; o ficheiro
 * que damos a ferramenta Artifact e um **fragmento** (a ferramenta e que embrulha).
 * E o contrato proibe serializar o DOM vivo — ele traz state de sessao e scripts
 * injectados pelo runtime.
 *
 * Solucao: o fragmento transporta, num `<script type="application/json">`, a fonte
 * canonica do documento completo com dois placeholders por preencher. Publicar e
 * preencher o state e reinserir a fonte verbatim — a versao seguinte herda a mesma
 * capacidade, geracao apos geracao, sem deriva.
 */

export const HEAD_END = "<!--__HEAD_END__-->";
export const STATE_SLOT = "%%PORTFOLIO_STATE%%";
export const SOURCE_SLOT = "%%PAGE_SOURCE%%";

/** Fragmento (com os dados ja substituidos) → documento completo, placeholders intactos. */
export function toFullDocument(withData: string): string {
  const i = withData.indexOf(HEAD_END);
  if (i === -1) throw new Error(`template sem ${HEAD_END}`);
  const head = withData.slice(0, i).trim();
  const body = withData.slice(i + HEAD_END.length).trim();
  return (
    `<!doctype html>\n<html lang="pt">\n<head>\n` +
    `<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
    head +
    `\n</head>\n<body>\n` +
    body +
    `\n</body>\n</html>\n`
  );
}

/** JSON de uma string para dentro de um `<script>` — nenhum `<` sobrevive literal. */
export function encodeSource(tpl: string): string {
  return JSON.stringify(tpl).replace(/</g, "\\u003c");
}

/**
 * Preenche os dois placeholders. **A ordem importa**: o state primeiro, porque a
 * fonte reinserida contem ela propria um `%%PORTFOLIO_STATE%%` (escapado) que nao
 * deve ser tocado. As substituicoes usam funcao para `$&` e companhia nao serem
 * interpretados como referencias de captura.
 *
 * Esta funcao e o espelho exacto das linhas que correm no browser (ver o bloco
 * `publicar()` em dashboard-template.html) — se uma mudar, muda a outra.
 */
export function fill(tpl: string, stateJson: string): string {
  return tpl
    .replace(STATE_SLOT, () => stateJson)
    .replace(SOURCE_SLOT, () => encodeSource(tpl));
}
