/**
 * Verificacao da pagina num browser a serio: a capability `artifact` simulada,
 * o ciclo registar → publicar → recarregar, e todos os codigos de erro do contrato.
 *
 *   node --test scripts/page-checks.mjs
 *
 * Corre em Node (nao em Bun) porque o playwright depende de internals do Node.
 * `bun test` chama-o atraves de scripts/page.test.ts, para haver um so portao.
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, writeFileSync, rmSync } from "node:fs";
import { extractState } from "./portfolio-state.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const DASH = resolve(HERE, "..", "dashboard.html");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

if (!existsSync(DASH) || !existsSync(CHROME)) {
  console.log("browser ou dashboard.html indisponivel — verificacao saltada");
  process.exit(0);
}

/** As fontes Google nao resolvem nesta sandbox e cada pagina esperava por elas. */
const blockFonts = (page) => page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

let browser = null;
async function getBrowser() {
  if (!browser) browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
  return browser;
}
after(async () => { await browser?.close(); });

/**
 * Abre a pagina com uma capability `artifact` simulada. `fail` faz o publish
 * rejeitar com esse codigo; caso contrario o HTML publicado fica em
 * `window.__published` para inspeccao.
 */
async function open(opts = {}) {
  const page = await (await getBrowser()).newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: opts.motion ? "no-preference" : "reduce",
  });
  await blockFonts(page);
  await page.addInitScript(({ capability, fail, hold }) => {
    window.__published = null;
    if (!capability) return;
    window.claude = {
      use: (name) => Promise.resolve(name !== "artifact" ? null : {
        publish: (html) => {
          if (fail) return Promise.reject(Object.assign(new Error(fail), { code: fail }));
          window.__published = html;
          if (hold) return new Promise(() => {});      // fica a gravar para sempre
          return Promise.resolve({ version: "v2" });   // sem reload: queremos inspeccionar
        },
      }),
    };
  }, { capability: opts.capability !== false, fail: opts.fail ?? "", hold: !!opts.hold });
  await page.goto(pathToFileURL(DASH).href, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.__show("carteira"));
  return page;
}

/** Shim minimo: mantem os testes legiveis sem arrastar um runner extra. */
function expect(actual) {
  const show = (v) => typeof v === "string" && v.length > 200 ? v.slice(0, 200) + "…" : v;
  return {
    toBe: (e) => assert.strictEqual(actual, e),
    toEqual: (e) => assert.deepStrictEqual(actual, e),
    toContain: (e) => assert.ok(String(actual).includes(e), `esperava conter ${JSON.stringify(e)}, recebi ${JSON.stringify(show(actual))}`),
    toHaveLength: (n) => assert.strictEqual(actual.length, n),
    toBeTruthy: () => assert.ok(actual, `esperava valor verdadeiro, recebi ${JSON.stringify(show(actual))}`),
    toBeLessThanOrEqual: (n) => assert.ok(actual <= n, `esperava <= ${n}, recebi ${actual}`),
    toMatchObject: (o) => { for (const [k, v] of Object.entries(o)) assert.deepStrictEqual(actual[k], v, `campo ${k}`); },
    not: {
      toBe: (e) => assert.notStrictEqual(actual, e),
      toEqual: (e) => assert.notDeepStrictEqual(actual, e),
      toContain: (e) => assert.ok(!String(actual).includes(e), `nao esperava conter ${JSON.stringify(e)}`),
    },
  };
}

async function fill(page, v) {
  await page.fill('.posform input[name="ticker"]', v.ticker);
  await page.fill('.posform input[name="units"]', v.units);
  await page.fill('.posform input[name="cost"]', v.cost);
  if (v.date) await page.fill('.posform input[name="date"]', v.date);
  await page.click('.posform button[type="submit"]');
}

test("com capability, o formulario diz que grava na pagina", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok", { timeout: 5000 });
  expect(await page.textContent(".form-mode")).toContain("grava na pagina");
  await page.close();
});

test("sem capability, cai para modo local e avisa que nao chega ao repo", async () => {
  const page = await open({ capability: false });
  await page.waitForSelector(".pill.warn", { timeout: 5000 });
  expect(await page.textContent(".form-mode")).toContain("nao chegam ao repo");
  await page.close();
});

test("registar uma compra publica um documento completo com a posicao dentro", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "0.53", cost: "30" });
  await page.waitForFunction(() => window.__published !== null, { timeout: 5000 });

  const html = await page.evaluate(() => window.__published);
  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain("</html>");

  const { state } = extractState(html);
  expect(state.positions).toHaveLength(1);
  expect(state.positions[0]).toMatchObject({ ticker: "LEU", units: 0.53, cost_eur: 30 });
  expect(state.positions[0].id).toBeTruthy();
  await page.close();
});

test("o ticker preenche nome e tema a partir da buy-list", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok");
  await page.fill('.posform input[name="ticker"]', "RKLB");
  expect(await page.inputValue('.posform input[name="name"]')).toBe("Rocket Lab USA");
  expect(await page.inputValue('.posform select[name="theme"]')).toBe("Espaco & Deep Tech");
  await page.close();
});

test("P/L aparece calculado contra o preco do dia, com o sinal no texto", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok");
  // 1 unidade de LEU a $187.63 com USD/EUR 1.1669 = €160,79. Custo €100 → +€60,79.
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector("table.pos tbody tr");
  const pl = await page.textContent("table.pos tbody tr td:nth-child(9)");
  expect(pl).toContain("+€60.7");
  expect(await page.getAttribute("table.pos tbody tr td:nth-child(9) .pl", "class")).toContain("up");
  expect(await page.textContent("#p-carteira .stats")).toContain("Investido");
  await page.close();
});

test("a alocacao por tema recalcula sem esperar pela rotina", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok");
  const before = await page.textContent('.alloc-row:has-text("Materiais & Energia") .val');
  expect(before).toContain("0% /");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForFunction(() => window.__published !== null);
  const after = await page.textContent('.alloc-row:has-text("Materiais & Energia") .val');
  expect(after).toContain("100% /");
  await page.close();
});

test("apagar pede confirmacao e a linha some quando se confirma", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector("table.pos tbody tr");

  page.once("dialog", (d) => d.dismiss());
  await page.click('tr[data-id] [data-act="del"]');
  await page.waitForTimeout(120);
  expect(await page.locator("table.pos tbody tr").count()).toBe(1);   // recusou: fica

  page.once("dialog", (d) => d.accept());
  await page.click('tr[data-id] [data-act="del"]');
  await page.waitForSelector("#p-carteira .empty", { timeout: 5000 });
  await page.close();
});

test("editar carrega a linha no formulario e substitui em vez de duplicar", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector("table.pos tbody tr");

  await page.click('tr[data-id] [data-act="edit"]');
  expect(await page.inputValue('.posform input[name="ticker"]')).toBe("LEU");
  await page.fill('.posform input[name="cost"]', "120");
  await page.click('.posform button[type="submit"]');
  await page.waitForTimeout(200);

  expect(await page.locator("table.pos tbody tr").count()).toBe(1);
  const html = await page.evaluate(() => window.__published);
  expect(extractState(html).state.positions[0].cost_eur).toBe(120);
  await page.close();
});

test("conflict nao apaga a linha nem tenta outra vez — a pagina vai recarregar", async () => {
  const page = await open({ fail: "conflict" });
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector(".form-note:not(:empty)", { timeout: 5000 });
  expect(await page.textContent(".form-note")).toContain("recarregar");
  await page.close();
});

test("not_writer passa a vista para modo local em vez de dizer que falhou", async () => {
  const page = await open({ fail: "not_writer" });
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector(".pill.warn", { timeout: 5000 });
  expect(await page.textContent(".form-mode")).toContain("neste browser");
  await page.close();
});

test("rate_limited explica-se e nao entra em ciclo de tentativas", async () => {
  const page = await open({ fail: "rate_limited" });
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector(".form-note:not(:empty)", { timeout: 5000 });
  expect(await page.textContent(".form-note")).toContain("espera");
  await page.close();
});

test("o documento publicado sabe republicar-se a si proprio (geracao 3)", async () => {
  const page = await open();
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForFunction(() => window.__published !== null);
  const v2 = await page.evaluate(() => window.__published);
  await page.close();

  // Carrega a versao publicada e regista outra compra por cima.
  const page2 = await (await getBrowser()).newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await blockFonts(page2);
  await page2.addInitScript(() => {
    window.__published = null;
    window.claude = { use: () => Promise.resolve({
      publish: (h) => { window.__published = h; return Promise.resolve({ version: "v3" }); } }) };
  });
  const tmp = resolve(HERE, "..", ".gen2.html");
  writeFileSync(tmp, v2);
  await page2.goto(pathToFileURL(tmp).href, { waitUntil: "domcontentloaded" });
  await page2.evaluate(() => window.__show("carteira"));
  await page2.waitForSelector(".pill.ok");
  expect(await page2.locator("table.pos tbody tr").count()).toBe(1);   // a v2 trouxe a posicao

  await fill(page2, { ticker: "KTOS", units: "2", cost: "80" });
  await page2.waitForFunction(() => window.__published !== null);
  const v3 = await page2.evaluate(() => window.__published);
  const st = extractState(v3).state;
  expect(st.positions.map((p) => p.ticker).sort()).toEqual(["KTOS", "LEU"]);
  expect(v3).toContain("Centrus Energy");                              // a analise sobreviveu
  await page2.close();
  rmSync(tmp, { force: true });
});

test("sem scroll horizontal no telemovel com a carteira preenchida", async () => {
  const page = await (await getBrowser()).newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await blockFonts(page);
  await page.addInitScript(() => {
    window.claude = { use: () => Promise.resolve({ publish: () => Promise.resolve({ version: "v" }) }) };
  });
  await page.goto(pathToFileURL(DASH).href, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.__show("carteira"));
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector("table.pos tbody tr");
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.close();
});

test("o Hoje abre com o resumo antes do detalhe", async () => {
  const page = await open();
  const stats = await page.textContent("#p-hoje .stats");
  for (const k of ["CARTEIRA", "CABAZ DO MES", "ALERTAS E NOTICIAS", "PRAZOS"]) {
    expect(stats.toUpperCase()).toContain(k);
  }
  // O resumo esta acima dos alertas.
  const order = await page.evaluate(() => {
    const p = document.getElementById("p-hoje");
    return [...p.children].map((c) => c.className);
  });
  expect(order[0]).toContain("stats");
  await page.close();
});

test("as setas navegam entre separadores e o foco acompanha", async () => {
  const page = await open();
  await page.focus('.tab[data-t="hoje"]');
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => document.activeElement.dataset.t)).toBe("carteira");
  expect(await page.getAttribute('.tab[data-t="carteira"]', "aria-selected")).toBe("true");
  expect(await page.getAttribute('.tab[data-t="hoje"]', "tabindex")).toBe("-1");
  await page.keyboard.press("End");
  expect(await page.evaluate(() => document.activeElement.dataset.t)).toBe("semana");
  await page.keyboard.press("ArrowRight");        // da a volta
  expect(await page.evaluate(() => document.activeElement.dataset.t)).toBe("hoje");
  await page.close();
});

test("cada separador aponta para o seu painel (aria-controls)", async () => {
  const page = await open();
  const bad = await page.evaluate(() =>
    [...document.querySelectorAll(".tab")].filter((t) => {
      const p = document.getElementById(t.getAttribute("aria-controls"));
      return !p || p.getAttribute("aria-labelledby") !== t.id;
    }).map((t) => t.dataset.t));
  expect(bad).toEqual([]);
  await page.close();
});

test("novidades marcadas com ponto; abrir o separador limpa-o e persiste", async () => {
  const page = await (await getBrowser()).newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await blockFonts(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem("scanner_seen", JSON.stringify({
        delta: "2000-01-01", news: "2000-01-01", thesis: "2000-01-01", weekly: "2000-01-01",
      }));
    } catch {}
  });
  await page.goto(pathToFileURL(DASH).href, { waitUntil: "domcontentloaded" });

  expect(await page.locator('.tab[data-t="noticias"] .dot').count()).toBe(1);
  expect(await page.textContent("#p-hoje .novo")).toContain("Novo desde a tua ultima visita");

  await page.click('.tab[data-t="noticias"]');
  expect(await page.locator('.tab[data-t="noticias"] .dot').count()).toBe(0);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("scanner_seen")).news);
  expect(stored).not.toBe("2000-01-01");
  await page.close();
});

test("primeira visita nao marca tudo como novidade", async () => {
  const page = await open();
  expect(await page.locator(".tab .dot").count()).toBe(0);
  expect(await page.locator("#p-hoje .novo").count()).toBe(0);
  await page.close();
});

test("prazos de catalisador so aparecem quando ha data lida", async () => {
  const page = await open();
  await page.evaluate(() => window.__show("buylist"));
  // Os dias dependem da data do build — calcula-se, nao se fixa.
  const dias = await page.evaluate(() => {
    const p = D.buylist.picks.find((x) => x.ticker === "SOUN");
    return Math.round((Date.parse(p.deadline + "T00:00:00Z") - Date.parse(D.built + "T00:00:00Z")) / 86400000);
  });
  const soun = await page.textContent('#blt tbody tr:has-text("SOUN") td:nth-child(7)');
  expect(soun).toContain(dias + "d");
  // ALT nao tem data extraivel no catalisador — nao pode inventar prazo.
  const alt = await page.locator('#blt tbody tr:has-text("ALT") td:nth-child(7) .due').count();
  expect(alt).toBe(0);
  await page.close();
});

test("o foco e visivel em cada controlo interactivo", async () => {
  const page = await open();
  const outline = await page.evaluate(() => {
    const el = document.querySelector('.tab[data-t="carteira"]');
    el.focus();
    const s = getComputedStyle(el);
    return s.outlineStyle + " " + s.outlineWidth;
  });
  expect(outline).toContain("solid");
  await page.close();
});

/* ── Movimento ──
   Os testes acima correm com prefers-reduced-motion, o que de caminho prova que a
   pagina funciona toda sem animacao nenhuma. Estes correm com o movimento ligado. */

test("a barra do separador desliza para o separador activo", async () => {
  const page = await open({ motion: true });
  const at = async () => page.evaluate(() => {
    const i = document.querySelector(".tab-ink");
    return { x: i.style.transform, w: i.style.width };
  });
  const hoje = await at();
  expect(hoje.w).not.toBe("");
  await page.click('.tab[data-t="semana"]');
  const semana = await at();
  expect(semana.x).not.toBe(hoje.x);
  // A largura acompanha a do separador activo.
  const btn = await page.evaluate(() =>
    Math.round(document.querySelector('.tab[data-t="semana"]').getBoundingClientRect().width));
  expect(Math.round(parseFloat(semana.w))).toBe(btn);
  await page.close();
});

test("a barra continua alinhada com a fila de separadores deslocada", async () => {
  // O caso fragil: no telemovel a fila faz scroll e a barra vive dentro dela.
  const page = await (await getBrowser()).newPage({ viewport: { width: 390, height: 700 } });
  await blockFonts(page);
  await page.goto(pathToFileURL(DASH).href, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.querySelector('.tab[data-t="semana"]').scrollIntoView({ inline: "end" }));
  await page.click('.tab[data-t="semana"]');
  await page.waitForTimeout(400);
  const g = await page.evaluate(() => {
    const nav = document.getElementById("tabs");
    const b = nav.querySelector('.tab[aria-selected="true"]').getBoundingClientRect();
    const i = nav.querySelector(".tab-ink").getBoundingClientRect();
    return { scrolled: nav.scrollLeft > 0, dx: Math.abs(b.left - i.left), dw: Math.abs(b.width - i.width) };
  });
  expect(g.scrolled).toBe(true);
  expect(g.dx < 1.5).toBe(true);
  expect(g.dw < 1.5).toBe(true);
  await page.close();
});

test("a entrada do painel corre uma vez e nao se repete no re-render", async () => {
  const page = await open({ motion: true });
  await page.click('.tab[data-t="tese"]');
  expect(await page.evaluate(() => document.getElementById("p-tese").classList.contains("intro"))).toBe(true);
  await page.waitForTimeout(1300);
  expect(await page.evaluate(() => document.getElementById("p-tese").classList.contains("intro"))).toBe(false);

  // Voltar ao painel nao volta a animar.
  await page.click('.tab[data-t="hoje"]');
  await page.click('.tab[data-t="tese"]');
  expect(await page.evaluate(() => document.getElementById("p-tese").classList.contains("intro"))).toBe(false);
  await page.close();
});

test("registar uma compra nao volta a animar a carteira", async () => {
  const page = await open({ motion: true });
  await page.click('.tab[data-t="carteira"]');
  await page.waitForTimeout(1300);
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector("table.pos tbody tr");
  expect(await page.evaluate(() => document.getElementById("p-carteira").classList.contains("intro"))).toBe(false);
  await page.close();
});

test("com prefers-reduced-motion nao ha entrada nem contagem", async () => {
  const page = await open();                      // reduced por defeito
  await page.click('.tab[data-t="tese"]');
  expect(await page.evaluate(() => document.getElementById("p-tese").classList.contains("intro"))).toBe(false);
  // O numero fica no valor final desde o primeiro fotograma.
  const n = await page.textContent("#p-hoje .stat b.num");
  expect(n).toBe("vazia");
  await page.close();
});

test("os numeros contam ate ao valor certo e ficam la", async () => {
  const page = await open({ motion: true });
  await page.click('.tab[data-t="carteira"]');
  const amt = page.locator("#p-carteira .hero .amt");
  await page.waitForTimeout(900);                 // a contagem dura ~620ms
  expect((await amt.textContent()).trim()).toBe("€100");
  await page.close();
});

test("a linha acabada de escrever acende-se uma vez", async () => {
  const page = await open({ motion: true });
  await page.click('.tab[data-t="carteira"]');
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector("table.pos tbody tr");
  expect(await page.locator("tr[data-flash]").count()).toBe(1);
  await page.close();
});

test("enquanto grava, o botao mostra que esta a gravar", async () => {
  const page = await open({ motion: true, hold: true });
  await page.click('.tab[data-t="carteira"]');
  await page.waitForSelector(".pill.ok");
  await fill(page, { ticker: "LEU", units: "1", cost: "100" });
  await page.waitForSelector(".posform button .spin", { timeout: 5000 });
  expect(await page.textContent(".posform button[type=submit]")).toContain("a gravar");
  expect(await page.isDisabled(".posform button[type=submit]")).toBe(true);
  await page.close();
});
