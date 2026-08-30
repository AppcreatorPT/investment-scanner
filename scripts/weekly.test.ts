import { test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { blocks, table } from "./md.ts";

const OUT = join(import.meta.dir, "..", "output");
const files = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith("_sintese-semanal.md")).sort() : [];
const latest = files.at(-1);

test("o dashboard tem de construir sem sintese semanal", () => {
  expect(blocks("", 2)).toEqual([]);
});

if (latest) {
  const md = readFileSync(join(OUT, latest), "utf-8");
  const secs = blocks(md, 2);
  const titles = secs.map((s) => s.title);

  // A sintese mais recente segue prompts/12; as antigas ficam como estao.
  test(`${latest}: tem a seccao em palavras simples`, () => {
    expect(titles).toContain("Em palavras simples");
    const s = secs.find((x) => x.title === "Em palavras simples")!;
    const pontos = s.body.split("\n").filter((l) => /^\s*[-*]\s+/.test(l));
    expect(pontos.length).toBeGreaterThanOrEqual(3);
    expect(s.body).toContain("O que fazer:");
  });

  test(`${latest}: tem a linha de mercado com o SPY`, () => {
    expect(md).toMatch(/^\*\*SPY:.*\*\*/m);
  });

  test(`${latest}: os eventos existem e trazem campos com rotulo`, () => {
    const ev = secs.find((x) => /^Eventos$/i.test(x.title));
    expect(ev).toBeTruthy();
    const items = blocks(ev!.body, 3);
    expect(items.length).toBeGreaterThan(0);
    for (const e of items) {
      // O parser le pelo rotulo, mas cada evento tem de trazer pelo menos um.
      expect(e.body).toMatch(/^\*\*.+?:\*\*/m);
      expect(e.title).toMatch(/^\d+\.\s+\S/);
    }
  });

  test(`${latest}: "o que mudou" e uma tabela a serio`, () => {
    const s = secs.find((x) => /^O que mudou esta semana$/i.test(x.title));
    expect(s).toBeTruthy();
    const rows = table(s!.body);
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0])).toEqual(["Ticker", "Mudanca", "Classificacao"]);
  });

  test(`${latest}: nenhum "$X est." aparece sozinho (Licoes #15/#22/#23)`, () => {
    // "vs $2.56B est." e o consenso dos analistas — uso legitimo. O que a licao
    // proibe e um preco "est." apresentado como se fosse o preco real, sem nada
    // ao lado que diga de onde veio ou que esta a ser corrigido.
    for (const l of md.split("\n").filter((x) => /\$[\d.,]+\s*est\./i.test(x))) {
      expect(l).toMatch(/\bvs\b|\breal\b|corrig|correc|licao|nao \$/i);
    }
  });
}
