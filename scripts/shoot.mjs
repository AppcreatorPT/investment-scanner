#!/usr/bin/env node
/**
 * Screenshots de verificacao do dashboard.
 *   node scripts/shoot.mjs [--out DIR] [--tab hoje,carteira,tese,noticias,buylist,semana]
 * Tira cada separador em desktop dark, desktop light e mobile dark.
 * Falha (exit 1) se a pagina der erro de consola ou scroll horizontal no body.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "fs";
import { pathToFileURL } from "url";
import { resolve } from "path";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const outDir = resolve(arg("--out", "/tmp/shots"));
const tabs = arg("--tab", "hoje,carteira,buylist,semana").split(",").filter(Boolean);
const file = pathToFileURL(resolve(arg("--file", "dashboard.html"))).href;
mkdirSync(outDir, { recursive: true });

const VIEWS = [
  { name: "desktop-dark", width: 1280, height: 1000, theme: "dark" },
  { name: "desktop-light", width: 1280, height: 1000, theme: "light" },
  { name: "mobile-dark", width: 390, height: 844, theme: "dark" },
];

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--font-render-hinting=none"],
});

let failures = 0;
for (const v of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  // As fontes Google nao carregam nesta sandbox (sem rede) — no artifact carregam.
  // Qualquer OUTRO erro de consola conta.
  const IGNORE = /Failed to load resource|fonts\.(googleapis|gstatic)\.com/;
  page.on("console", (m) => m.type() === "error" && !IGNORE.test(m.text()) && errors.push(m.text()));

  await page.addInitScript((t) => {
    try { localStorage.setItem("scanner_theme", t); } catch {}
  }, v.theme);
  await page.goto(file, { waitUntil: "networkidle" });

  for (const tab of tabs) {
    await page.evaluate((t) => window.__show?.(t) ?? document.querySelector(`.tab[data-t="${t}"]`)?.click(), tab);
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${outDir}/${tab}-${v.name}.png`, fullPage: true });

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) {
      console.error(`FAIL scroll horizontal (${overflow}px) em ${tab}/${v.name}`);
      failures++;
    }
  }
  if (errors.length) { console.error(`FAIL erros de consola em ${v.name}:`, errors.slice(0, 3)); failures++; }
  await ctx.close();
}
await browser.close();
console.log(failures ? `${failures} problema(s) — ver acima` : `ok — screenshots em ${outDir}`);
process.exit(failures ? 1 : 0);
