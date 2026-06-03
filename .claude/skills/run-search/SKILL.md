
---
name: run-search
description: Run, launch, screenshot, or smoke-test the Investment Research Scanner. Use to drive the dashboard.html web app (load scan JSON, filter, open detail panels, capture screenshots) in headless Chrome, and to validate the output/*.json scan files. Triggers on "run the dashboard", "screenshot the scanner", "validate the output", "test dashboard.html".
---

# Run: Investment Research Scanner

Two surfaces, both driven from the command line:

1. **`dashboard.html`** — a single-file static web app (no server, no build). It
   ingests the `output/*.json` scan files **only through a file input** (drop zone /
   `<input type=file>`) and renders a filterable, sortable table with compare-over-time
   and a detail panel. Because there is no server and no URL params, you drive it with
   **`driver.mjs`** (headless Chrome via `puppeteer-core` + your *system* Chrome — no
   bundled-browser download). A plain `chrome --screenshot file://dashboard.html` only
   ever shows the empty drop zone.
2. **`scripts/validate.ts`** — a `bun` CLI that schema-checks one scan JSON file.

> Paths below are relative to the repo root (`<repo>/`, the directory containing
> `dashboard.html`). The driver lives at `.claude/skills/run-search/driver.mjs`.
> **Verified on:** Windows 11, Chrome 148, bun 1.x, node 22 — commands use PowerShell.

## Prerequisites

- **bun** (validator) and **node** (driver) on PATH.
- **Google Chrome** (or Edge) installed. The driver auto-detects the standard install
  paths; override with `$env:CHROME_PATH` if it lives elsewhere. No browser is
  downloaded — `puppeteer-core` attaches to the system Chrome.

## Setup (one-time, after clone)

The validator needs no install. The dashboard driver needs `puppeteer-core`
(`node_modules/` and `shots/` are gitignored):

```powershell
npm install --prefix .claude/skills/run-search
```

## Run the dashboard (agent path — use this)

```powershell
node .claude/skills/run-search/driver.mjs            # latest scan date, full table
node .claude/skills/run-search/driver.mjs --all      # table + filter + detail, one launch
node .claude/skills/run-search/driver.mjs --detail   # open first row's detail panel
node .claude/skills/run-search/driver.mjs --compare  # two latest dates, diff/delta view
node .claude/skills/run-search/driver.mjs --filter 5 # apply asymmetry_score >= 5 filter
node .claude/skills/run-search/driver.mjs --date 2026-04-05   # force a date (8 categories)
node .claude/skills/run-search/driver.mjs --headful  # show the window (debugging)
```

- Screenshots land in **`.claude/skills/run-search/shots/`** (`dashboard.png`,
  `filter.png`, `detail.png`, `compare.png`). **Open and look at the PNG** — that is
  the verification, not the console line.
- The driver **exits non-zero if the table renders 0 rows**, so `--all` doubles as a
  smoke test. Each shot logs `(N rows visible, M entities total)`.
- Default date = the most recent scan with ≥2 category files (currently `2026-04-27`,
  120 entities). Use `--date 2026-04-05` for the full 8-category / 190-entity view.

Expected output of `--all`:

```
dashboard : ...\dashboard.html
chrome    : ...\chrome.exe
date      : 2026-04-27 (4 category files)
compare   : 2026-04-27 vs 2026-04-28
  -> ...\shots\compare.png  (153 rows visible, 33 entities total)
  -> ...\shots\dashboard.png  (120 rows visible, 120 entities total)
filter    : asymmetry_score >= 5
  -> ...\shots\filter.png  (14 rows visible, 120 entities total)
detail    : opened "NewLimit"
  -> ...\shots\detail.png  (120 rows visible, 120 entities total)
OK
```

To drive a flow the flags don't cover, edit `driver.mjs` — it's agent tooling, kept
deliberately small. Key selectors: `#fileInput` (upload), `#dashboard` (visible once
loaded), `#tableBody tr` (rows), `#filterScore`/`#filterRisk`/`#searchInput` (controls),
`#detailOverlay.open` (panel open).

## Validate scan output (CLI)

One file (exit 0 = clean / warnings only, exit 1 = errors):

```powershell
bun run scripts/validate.ts output/2026-04-05_longevidade.json
```

All files at once (per-file verdict, always exits 0):

```powershell
Get-ChildItem output/*.json | ForEach-Object {
  $out = bun run scripts/validate.ts $_.FullName 2>$null
  $verdict = ($out | Select-String -Pattern "PASS|error\(s\)").Line
  "{0,-32} {1}" -f $_.Name, $verdict.Trim()
}
```

## Run the dashboard (human path)

Double-click `dashboard.html` (or `Invoke-Item dashboard.html`) to open it in your
browser, then drag the `output/*.json` files onto the drop zone. Useful for clicking
around by hand; useless headless and not scriptable — prefer the driver above.

## Gotchas

- **No server, no URL params.** The dashboard is `file://`-only and loads data solely
  via the file input. You cannot deep-link a dataset; the driver uploads files through
  `#fileInput` (puppeteer `uploadFile`), which fires the same `change` → `handleFiles`
  path as a manual drop.
- **The detail panel is a `position: fixed` overlay** sized to the viewport. A
  `fullPage` screenshot pins it at the top above the entire long table — the driver
  captures the detail shot with `fullPage:false` for this reason.
- **Skip `*_agregado.json`.** The aggregate file re-lists every entity under one
  synthetic `"Agregado"` category; loading it alongside the per-category files double-
  counts everything. The driver excludes it automatically.
- **`puppeteer-core` ≠ `puppeteer`.** It ships no browser on purpose. If Chrome is in a
  non-standard location the launch fails — set `$env:CHROME_PATH`.
- **`chrome.exe --version` prints nothing to stdout on Windows.** Read the version from
  file metadata instead: `(Get-Item $chrome).VersionInfo.ProductVersion`.
- **Full-page table screenshots get very tall** (190 rows ≈ 5000px) and downscale in
  viewers. For a legible quick check use `--filter 5` (few rows) or `--detail`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No Chrome/Edge found. Set CHROME_PATH` | `$env:CHROME_PATH = "C:\path\to\chrome.exe"` then re-run. |
| `Cannot find package 'puppeteer-core'` | Run the Setup step: `npm install --prefix .claude/skills/run-search`. |
| `FAIL: dashboard rendered 0 table rows` | `output/` had no loadable category files for that date, or `dashboard.html` threw — re-run with `--headful` and watch for `PAGE ERROR:` lines. |
| Validate-all loop reports exit 255 | Harmless PowerShell native-exit artifact when chaining `bun` in a pipeline; use the loop form above, which always exits 0. |
| `bun run scripts/validate.ts` exits 1 | Real schema errors — read the `ERROR:` lines; warnings alone exit 0. |
