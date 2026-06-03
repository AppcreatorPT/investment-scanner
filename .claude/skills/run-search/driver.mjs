#!/usr/bin/env node
/*
 * Dashboard driver for the Investment Research Scanner.
 *
 * Drives dashboard.html in headless Chrome (via puppeteer-core + the system
 * Chrome/Edge install — no bundled browser download). It loads the output/*.json
 * scan files through the page's hidden file input (the same code path a user hits
 * by dropping files on the drop zone), optionally drives an interaction, and writes
 * a PNG screenshot. This is the only programmatic handle on the GUI: the dashboard
 * has no URL params and no server, so a plain `chrome --screenshot` only ever shows
 * the empty drop zone.
 *
 * Usage (run from anywhere; paths are resolved relative to this file):
 *   node driver.mjs                 # latest date, full table  -> shots/dashboard.png
 *   node driver.mjs --detail        # open first data row      -> shots/detail.png
 *   node driver.mjs --compare       # two latest dates, diff   -> shots/compare.png
 *   node driver.mjs --filter 5      # score>=N filter applied   -> shots/filter.png
 *   node driver.mjs --date 2026-04-05   # force a specific date
 *   node driver.mjs --all           # dashboard + detail + compare, in one launch
 *   node driver.mjs --headful       # show the window (debugging)
 *
 * Exit code is non-zero if the dashboard never renders a populated table, so this
 * doubles as a smoke test.
 */
import puppeteer from "puppeteer-core";
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", ".."); // <repo>/.claude/skills/run-search -> <repo>
const DASHBOARD = join(ROOT, "dashboard.html");
const OUTPUT = join(ROOT, "output");
const SHOTS = join(__dirname, "shots");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error("No Chrome/Edge found. Set CHROME_PATH to a chrome.exe / msedge.exe.");
}

/** Group output/*.json by scan date (from the YYYY-MM-DD_ filename prefix), skipping the aggregate. */
function filesByDate() {
  const byDate = {};
  for (const f of readdirSync(OUTPUT)) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})_(.+)\.json$/);
    if (!m) continue;
    if (m[2] === "agregado") continue; // aggregate duplicates every entity under one synthetic category
    (byDate[m[1]] ||= []).push(join(OUTPUT, f));
  }
  return byDate;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadFiles(page, files) {
  const input = await page.waitForSelector("#fileInput");
  await input.uploadFile(...files); // fires the change event -> handleFiles() -> initDashboard()
  await page.waitForSelector("#dashboard", { visible: true, timeout: 10000 });
  await page.waitForSelector("#tableBody tr", { timeout: 10000 });
  await sleep(300); // let table paint
}

async function shot(page, name, { fullPage = true } = {}) {
  mkdirSync(SHOTS, { recursive: true });
  const path = join(SHOTS, name);
  // The detail panel is a position:fixed overlay sized to the viewport; a fullPage
  // capture pins it at the top above the entire long table, so pass fullPage:false.
  await page.screenshot({ path, fullPage });
  const rows = await page.$$eval("#tableBody tr", (r) => r.length);
  const total = await page.$eval("#totalEntities", (e) => e.textContent).catch(() => "?");
  console.log(`  -> ${path}  (${rows} rows visible, ${total} entities total)`);
  return rows;
}

async function main() {
  const byDate = filesByDate();
  const dates = Object.keys(byDate).sort();
  if (!dates.length) throw new Error(`No dated scan files in ${OUTPUT}`);

  const chosen = valOf("--date") || dates.filter((d) => byDate[d].length >= 2).pop() || dates.at(-1);
  if (!byDate[chosen]) throw new Error(`No files for date ${chosen}. Have: ${dates.join(", ")}`);

  console.log(`dashboard : ${DASHBOARD}`);
  console.log(`chrome    : ${findChrome()}`);
  console.log(`date      : ${chosen} (${byDate[chosen].length} category files)`);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: !has("--headful"),
    args: ["--no-sandbox", "--allow-file-access-from-files"],
    defaultViewport: { width: 1600, height: 1000 },
  });
  let renderedRows = 0;
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("  PAGE ERROR:", e.message));
    await page.goto(pathToFileURL(DASHBOARD).href, { waitUntil: "load" });

    const runAll = has("--all");

    if (has("--compare") || runAll) {
      if (dates.length < 2) {
        console.log("compare   : skipped (need >=2 dated scans)");
      } else {
        const two = dates.slice(-2);
        console.log(`compare   : ${two.join(" vs ")}`);
        await page.reload({ waitUntil: "load" });
        await loadFiles(page, [...byDate[two[0]], ...byDate[two[1]]]);
        renderedRows = Math.max(renderedRows, await shot(page, "compare.png"));
      }
      if (!runAll) return renderedRows;
    }

    // Default / detail / filter all start from a single date's full table.
    await page.reload({ waitUntil: "load" });
    await loadFiles(page, byDate[chosen]);
    renderedRows = Math.max(renderedRows, await shot(page, "dashboard.png"));

    if (has("--filter") || runAll) {
      const min = valOf("--filter") || "5";
      await page.select("#filterScore", min);
      await sleep(200);
      console.log(`filter    : asymmetry_score >= ${min}`);
      renderedRows = Math.max(renderedRows, await shot(page, "filter.png"));
      await page.select("#filterScore", "0"); // reset
      await sleep(200);
    }

    if (has("--detail") || runAll) {
      await page.click("#tableBody tr"); // first data row
      await page.waitForSelector("#detailOverlay.open", { timeout: 5000 });
      await sleep(300);
      const name = await page.$eval("#detailPanel h2", (h) => h.textContent).catch(() => "?");
      console.log(`detail    : opened "${name}"`);
      await shot(page, "detail.png", { fullPage: false });
    }

    return renderedRows;
  } finally {
    await browser.close();
  }
}

main()
  .then((rows) => {
    if (!rows) {
      console.error("FAIL: dashboard rendered 0 table rows");
      process.exit(1);
    }
    console.log("OK");
  })
  .catch((e) => {
    console.error("FAIL:", e.message);
    process.exit(1);
  });
