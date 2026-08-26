import { test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { table } from "./md.ts";

const FILE = join(import.meta.dir, "..", "NEWS.md");

test("o dashboard tem de construir sem NEWS.md", () => {
  // A garantia real esta no build (read() devolve "" para ficheiro ausente);
  // aqui fixamos o contrato de que a ausencia e um estado valido, nao um erro.
  expect(table("")).toEqual([]);
});

if (existsSync(FILE)) {
  const md = readFileSync(FILE, "utf-8");
  const rows = table(md);

  test("NEWS.md: cabecalho com data e janela", () => {
    expect(md).toMatch(/^#\s*Noticias\s+\d{4}-\d{2}-\d{2}/m);
    expect(md).toContain("**Janela:**");
    expect(md).toContain("**Perimetro:**");
  });

  test("NEWS.md: a tabela tem as cinco colunas do protocolo", () => {
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0])).toEqual(["Ticker", "Nome", "O que aconteceu", "Porque importa", "Fonte"]);
  });

  for (const r of rows) {
    test(`NEWS.md · ${r["Ticker"]}: fonte e um link datado`, () => {
      expect(r["Fonte"]).toMatch(/\[[^\]]*\d{4}[^\]]*\]\(https?:\/\/[^)]+\)/);
    });

    test(`NEWS.md · ${r["Ticker"]}: diz o que aconteceu E porque importa`, () => {
      expect(r["O que aconteceu"].trim().length).toBeGreaterThan(20);
      expect(r["Porque importa"].trim().length).toBeGreaterThan(20);
    });

    // O digest e um funil de factos; opiniao de analista nao e facto (prompts/11).
    test(`NEWS.md · ${r["Ticker"]}: sem nota de analista nem price target`, () => {
      const cell = r["O que aconteceu"] + " " + r["Porque importa"];
      expect(cell).not.toMatch(/price target|upgrade para|downgrade para|\bPT\s*\$\d/i);
    });
  }

  test("NEWS.md: fecha com o que NAO teve noticia — a prova de que se olhou", () => {
    expect(md).toMatch(/\*\*Sem noticia material:\*\*\s*\S/);
  });
}
