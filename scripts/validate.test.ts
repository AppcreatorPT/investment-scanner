import { test, expect } from "bun:test";
import { validateScan, type ScanOutput } from "./validate.ts";

function baseEntity(over: Record<string, unknown> = {}) {
  return {
    id: "AIC-001", name: "X", description: "d", subcategory: "s", status: "cotada",
    ticker: "X", geography: "EUA, NASDAQ", market_cap_or_valuation: "~$1B",
    liquidity: "alta", risk_level: "alto", opportunity_type: "acao cotada",
    catalyst: "c", catalyst_date: "Q3 2026", asymmetry_score: 4,
    return_horizon: "curto (0-12m)", red_flags: null,
    source: "https://sec.gov/x — 2026",
    account: "neobroker", proxy_for: null, entry_min: "~€10 (fracionado)",
    why_now: "edge real", confidence: "parcial", access_note: null, ...over,
  };
}
function baseScan(entities: unknown[]): ScanOutput {
  return {
    category: "IA & Computacao", scan_date: "2026-06-03", entities,
    category_summary: { top5_asymmetry: ["AIC-001"], top3_contrarian: [], systemic_risks: ["r"] },
    _meta: { total_entities: entities.length, schema_version: "2.0", category: "IA & Computacao" },
  } as ScanOutput;
}

test("smoke: a single well-formed entity yields no errors", () => {
  const { errors } = validateScan(baseScan([baseEntity()]));
  expect(errors).toEqual([]);
});

test("invalid account is an error", () => {
  const { errors } = validateScan(baseScan([baseEntity({ account: "etrade" })]));
  expect(errors.some(e => e.includes("invalid account"))).toBe(true);
});

test("missing why_now and entry_min are errors", () => {
  const { errors } = validateScan(baseScan([baseEntity({ why_now: "", entry_min: "" })]));
  expect(errors.some(e => e.includes('"why_now"'))).toBe(true);
  expect(errors.some(e => e.includes('"entry_min"'))).toBe(true);
});

test("invalid confidence is an error", () => {
  const { errors } = validateScan(baseScan([baseEntity({ confidence: "talvez" })]));
  expect(errors.some(e => e.includes("invalid confidence"))).toBe(true);
});

test("missing catalyst_date is a warning", () => {
  const { warnings } = validateScan(baseScan([baseEntity({ catalyst_date: null })]));
  expect(warnings.some(w => w.includes("missing catalyst_date"))).toBe(true);
});

test("source without a URL is an error", () => {
  const { errors } = validateScan(baseScan([baseEntity({ source: "Coinbase - Everything Exchange (2026)" })]));
  expect(errors.some(e => e.includes("source must contain a real URL"))).toBe(true);
});

test("source with URL but placeholder pattern is a warning", () => {
  const { warnings } = validateScan(baseScan([baseEntity({ source: "https://clinicaltrials.gov/NCT0000000" })]));
  expect(warnings.some(w => w.includes("placeholder"))).toBe(true);
});

test("especulativo entity in top5_asymmetry warns", () => {
  const scan = baseScan([baseEntity({ confidence: "especulativo" })]);
  const { warnings } = validateScan(scan);
  expect(warnings.some(w => w.includes("especulativo"))).toBe(true);
});

test("Commodities category is recognized with COM- prefix", () => {
  const scan = baseScan([baseEntity({ id: "COM-001" })]);
  scan.category = "Commodities & Economia Real";
  scan.category_summary.top5_asymmetry = ["COM-001"];
  const { errors, warnings } = validateScan(scan);
  expect(errors).toEqual([]);
  expect(warnings.some(w => w.includes("Unknown category"))).toBe(false);
});

test("low entity count (<8) warns", () => {
  const { warnings } = validateScan(baseScan([baseEntity()]));
  expect(warnings.some(w => w.includes("entities"))).toBe(true);
});

test("Economia category is no longer recognized", () => {
  const scan = baseScan([baseEntity()]);
  scan.category = "Economia & Macro";
  const { warnings } = validateScan(scan);
  expect(warnings.some(w => w.includes("Unknown category"))).toBe(true);
});

export { baseEntity, baseScan };
