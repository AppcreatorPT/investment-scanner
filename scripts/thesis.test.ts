import { test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { blocks } from "./md.ts";

const OUT = join(import.meta.dir, "..", "output");
const files = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith("_tese-profunda.md")).sort() : [];

test("blocks() divide por nivel e preserva a ordem", () => {
  const md = "## A\n\ncorpo a\n\n### a1\n\nx\n\n### a2\n\ny\n\n---\n\n## B\n\ncorpo b\n";
  const h2 = blocks(md, 2);
  expect(h2.map((b) => b.title)).toEqual(["A", "B"]);
  expect(blocks(h2[0].body, 3).map((b) => b.title)).toEqual(["a1", "a2"]);
  expect(h2[1].body).toBe("corpo b");
});

test("blocks() nao confunde ### com ##", () => {
  expect(blocks("### so h3\n\nx", 2)).toEqual([]);
  expect(blocks("### so h3\n\nx", 3).map((b) => b.title)).toEqual(["so h3"]);
});

test("blocks() num documento sem headings devolve vazio", () => {
  expect(blocks("texto solto\n\nmais texto", 2)).toEqual([]);
});

// ─── lint do conteudo real contra o contrato de prompts/10-tese-profunda.md ───

const LENSES = ["Analogo historico", "O invisivel", "Under/over-value", "Cenarios"];
const VERDICTS = ["barato", "justo", "caro", "impossivel de dizer"];
const PROBS = ["baixa", "media", "alta", "baixa a media", "media a alta"];

for (const file of files) {
  const md = readFileSync(join(OUT, file), "utf-8");
  const names = blocks(md, 2);

  test(`${file}: tem nomes e no maximo 6 (profundidade, nao largura)`, () => {
    expect(names.length).toBeGreaterThan(0);
    expect(names.length).toBeLessThanOrEqual(6);
  });

  for (const n of names) {
    const ticker = n.title.split(/\s+—\s+/)[0];
    const lenses = blocks(n.body, 3);

    test(`${file} · ${ticker}: as quatro lentes, pela ordem`, () => {
      expect(lenses.map((l) => l.title)).toEqual(LENSES);
    });

    test(`${file} · ${ticker}: cabecalho com tema, porque entrou e confianca`, () => {
      for (const k of ["Tema", "Porque entrou", "Confianca"]) expect(n.body).toContain(`**${k}:**`);
      const conf = n.body.match(/\*\*Confianca:\*\*\s*([^·\n]+)/)![1].trim();
      expect(["verificado", "parcial", "especulativo"]).toContain(conf);
    });

    test(`${file} · ${ticker}: veredicto de valor e uma das quatro palavras`, () => {
      const v = n.body.match(/^\*\*Juizo:\*\*\s*(.+)$/m);
      expect(v).not.toBeNull();
      expect(VERDICTS).toContain(v![1].trim());
    });

    test(`${file} · ${ticker}: cenarios bull/base/bear com probabilidade qualitativa`, () => {
      const cen = lenses.find((l) => l.title === "Cenarios")!.body;
      const rows = cen.split("\n").filter((l) => l.trim().startsWith("|")).slice(2);
      expect(rows.map((r) => r.split("|")[1].trim())).toEqual(["Bull", "Base", "Bear"]);
      for (const r of rows) {
        const cells = r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        expect(PROBS).toContain(cells[cells.length - 1]);
      }
    });

    test(`${file} · ${ticker}: tem a versao em palavras simples`, () => {
      const m = n.body.match(/\*\*Em palavras simples:\*\*\s*([\s\S]*?)(?:\n\n|$)/);
      expect(m).not.toBeNull();
      const txt = m![1].replace(/\s+/g, " ").trim();
      expect(txt.length).toBeGreaterThan(80);
      // Simplificar nao e virar conselho. "Quem compra hoje esta a pagar..." e
      // descricao; o que nao pode aparecer e o imperativo.
      expect(txt).not.toMatch(/\b(recomend\w+|aconselh\w+|deves?\s+(comprar|vender)|vale a pena comprar|boa altura para)\b/i);
    });

    test(`${file} · ${ticker}: cada lente abre com uma linha simples`, () => {
      for (const l of lenses) {
        const first = l.body.split("\n").find((x) => x.trim());
        expect(`${l.title}: ${first}`).toMatch(/^.+: >\s*\S/);
      }
    });

    test(`${file} · ${ticker}: tem falsificador`, () => {
      expect(n.body).toMatch(/\*\*Falsificador:\*\*\s*\S/);
    });

    test(`${file} · ${ticker}: analogo historico datado com fonte`, () => {
      const an = lenses.find((l) => l.title === "Analogo historico")!.body;
      expect(an).toMatch(/\b(19|20)\d{2}\b/);            // uma data
      expect(an).toMatch(/\]\(https?:\/\//);              // uma fonte
    });

    // Licoes #15/#22/#23 do TRACK_RECORD: um numero sem fonte e inventado.
    test(`${file} · ${ticker}: sem alvo de preco fabricado`, () => {
      expect(n.body).not.toMatch(/\bprice target\b|\balvo de preco de\b|\bPT\s*\$\d/i);
      expect(n.body).not.toMatch(/\$[\d.,]+\s*est\.?\b/i);   // "$68 est." — o padrao da Licao #23
      expect(n.body).not.toMatch(/\bdeve\s+(chegar|atingir|valer)\s+\$/i);
    });
  }
}
