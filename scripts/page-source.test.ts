import { test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { HEAD_END, STATE_SLOT, SOURCE_SLOT, toFullDocument, encodeSource, fill } from "./page-source.ts";
import { extractState, stateToJson } from "./portfolio-state.ts";

const ROOT = join(import.meta.dir, "..");
const DASH = join(ROOT, "dashboard.html");

/** O que a pagina faz no browser: ler a fonte embutida e preencher os placeholders. */
function republish(html: string, stateJson: string): string {
  const m = html.match(/<script[^>]*\bid=["']page-source["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) throw new Error("sem #page-source");
  return fill(JSON.parse(m[1]), stateJson);
}

/** O conteudo de um dos blocos de dados, como esta na pagina. */
function block(html: string, id: string): string {
  const m = html.match(new RegExp(`<script[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i"));
  if (!m) throw new Error(`sem #${id}`);
  return m[1];
}

const state = (ticker: string) =>
  stateToJson({
    schema: 1, updated: "2026-08-26T10:00:00.000Z",
    positions: [{ id: "id-1", date: "2026-08-26", ticker, name: "N", theme: "T",
                  units: 1, cost_eur: 10, value_eur: null }],
  });

test("toFullDocument produz um documento completo com doctype e head/body separados", () => {
  const doc = toFullDocument(`<title>x</title><style>a{}</style>${HEAD_END}<div>corpo</div>`);
  expect(doc.startsWith("<!doctype html>")).toBe(true);
  expect(doc).toContain("<head>");
  expect(doc).toContain('<meta charset="utf-8">');
  expect(doc.indexOf("<title>x</title>")).toBeLessThan(doc.indexOf("</head>"));
  expect(doc.indexOf("<div>corpo</div>")).toBeGreaterThan(doc.indexOf("<body>"));
});

test("encodeSource nao deixa `<` literal — a fonte nunca fecha o script que a transporta", () => {
  const encoded = encodeSource("<!doctype html><script>x</script>");
  expect(encoded).not.toContain("<");
  expect(JSON.parse(encoded)).toBe("<!doctype html><script>x</script>");
});

test("fill: o state entra e a fonte fica reinserida com os placeholders intactos", () => {
  const tpl = `<!doctype html><a>${STATE_SLOT}</a><b>${SOURCE_SLOT}</b>`;
  const out = fill(tpl, '{"schema":1}');
  expect(out).toContain('<a>{"schema":1}</a>');
  const reembedded = JSON.parse(out.slice(out.indexOf("<b>") + 3, out.indexOf("</b>")));
  expect(reembedded).toBe(tpl);
});

test("state com `$&` no texto nao e interpretado como referencia de captura", () => {
  const tpl = `${STATE_SLOT}|${SOURCE_SLOT}`;
  expect(fill(tpl, '{"n":"$& $\' $`"}')).toContain(`{"n":"$& $' $\`"}`);
});

if (existsSync(DASH)) {
  const built = readFileSync(DASH, "utf-8");

  test("o dashboard construido tem os dois blocos vivos ja preenchidos", () => {
    // Os placeholders CONTINUAM a existir dentro da fonte embutida — e o que faz a
    // geracao seguinte funcionar. O que nao pode e sobrarem nos blocos vivos.
    expect(block(built, "portfolio-state")).not.toContain(STATE_SLOT);
    expect(JSON.parse(block(built, "portfolio-state")).schema).toBe(1);
    expect(built).not.toContain(HEAD_END);

    // A fonte embutida guarda os placeholders por preencher — e o que faz a
    // geracao seguinte funcionar.
    const embedded = JSON.parse(block(built, "page-source"));
    expect(embedded.startsWith("<!doctype html>")).toBe(true);
    expect(embedded).toContain(STATE_SLOT);
    expect(embedded).toContain(SOURCE_SLOT);
  });

  test("o fragmento nao traz doctype nem <html> literal (a ferramenta e que embrulha)", () => {
    expect(built.trimStart().startsWith("<!doctype")).toBe(false);
    expect(built).not.toContain("<html");
  });

  test("republicar da um documento completo que ainda contem a carteira", () => {
    const v2 = republish(built, state("LEU"));
    expect(v2.startsWith("<!doctype html>")).toBe(true);
    expect(v2).toContain("</html>");
    expect(extractState(v2).state!.positions[0].ticker).toBe("LEU");
  });

  test("geracao 3 e 4: a fonte nao deriva nem cresce a cada publish", () => {
    const v2 = republish(built, state("LEU"));
    const v3 = republish(v2, state("NXE"));
    const v4 = republish(v3, state("NXE"));
    expect(extractState(v3).state!.positions[0].ticker).toBe("NXE");
    // Ponto fixo: o mesmo state produz o mesmo documento, geracao apos geracao.
    expect(v4).toBe(v3);
    expect(block(v3, "page-source")).toBe(block(v2, "page-source"));
  });

  test("os dados do scan sobrevivem a republicacao (a pagina nao perde a analise)", () => {
    const v2 = republish(built, state("LEU"));
    expect(v2).toContain("Centrus Energy");
    expect(v2.length).toBeGreaterThan(100_000);
  });
}
