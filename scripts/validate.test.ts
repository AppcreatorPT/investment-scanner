import { test, expect } from "bun:test";
import { validateScan, type ScanOutput } from "./validate.ts";

function baseEntity(over: Record<string, unknown> = {}) {
  return {
    id: "AIC-001", name: "X", description: "d", subcategory: "s", status: "cotada",
    ticker: "X", geography: "EUA, NASDAQ", market_cap_or_valuation: "~$1B",
    liquidity: "alta", risk_level: "alto", opportunity_type: "acao cotada",
    catalyst: "c", catalyst_date: "Q3 2026", asymmetry_score: 4,
    return_horizon: "curto (0-12m)", red_flags: null,
    source: "https://sec.gov/x — 2026", ...over,
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

export { baseEntity, baseScan };
