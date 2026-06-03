/**
 * Validador de output JSON do Investment Research Scanner
 * Uso: bun run scripts/validate.ts output/FICHEIRO.json
 */

const VALID_PREFIXES: Record<string, string> = {
  "Longevidade & Saude": "LSA-",
  "Trading & Mercados": "TRD-",
  "Materiais & Energia": "MAT-",
  "Geopolitica & Defesa": "GEO-",
  "IA & Computacao": "AIC-",
  "Espaco & Deep Tech": "SDT-",
  "Financas Alternativas": "FIN-",
};

const VALID_STATUS = ["privada", "pre-IPO", "cotada", "token", "fundo"];
const VALID_LIQUIDITY = ["alta", "media", "baixa", "sem mercado"];
const VALID_RISK = ["baixo", "moderado", "alto", "especulativo"];
const VALID_OPPORTUNITY = ["acao cotada", "opcoes", "IPO", "pre-IPO", "token", "fundo", "exposicao indireta"];
const VALID_HORIZON = ["curto (0-12m)", "medio (1-3a)", "longo (3+a)"];
const VALID_ACCOUNT = ["neobroker", "vantage-cfd", "cripto-exchange", "abrir-conta"];
const VALID_CONFIDENCE = ["verificado", "parcial", "especulativo"];

export interface Entity {
  id: string; name: string; description: string; subcategory: string;
  status: string; ticker: string | null; geography: string;
  market_cap_or_valuation: string; liquidity: string; risk_level: string;
  opportunity_type: string; catalyst: string; catalyst_date: string | null;
  asymmetry_score: number; return_horizon: string; red_flags: string | null;
  source: string;
  account: string; proxy_for: string | null; entry_min: string;
  why_now: string; confidence: string; access_note: string | null;
}

export interface ScanOutput {
  category: string; scan_date: string; entities: Entity[];
  category_summary: { top5_asymmetry: string[]; top3_contrarian: string[]; systemic_risks: string[]; };
  _meta: { total_entities: number; schema_version: string; category: string; };
}

export function validateScan(data: ScanOutput): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const error = (m: string) => errors.push(`ERROR: ${m}`);
  const warn = (m: string) => warnings.push(`WARN: ${m}`);

  const category = data.category;
  const prefix = VALID_PREFIXES[category];

  if (!category) error("Missing 'category' field");
  if (category && !VALID_PREFIXES[category]) warn(`Unknown category "${category}"`);
  if (!data.scan_date) error("Missing 'scan_date' field");

  if (!Array.isArray(data.entities)) { error("'entities' is not an array"); return { errors, warnings }; }

  const count = data.entities.length;
  if (count < 8) warn(`Only ${count} entities — target is ~12-15 accessible`);
  if (count > 30) warn(`${count} entities — exceeds target of ~12-15 accessible`);

  if (data._meta) {
    if (data._meta.total_entities !== count) error(`_meta.total_entities (${data._meta.total_entities}) != actual entity count (${count})`);
  } else error("Missing '_meta' block");

  if (!data.category_summary) error("Missing 'category_summary' block");
  else {
    if (!Array.isArray(data.category_summary.top5_asymmetry)) error("Missing category_summary.top5_asymmetry");
    if (!Array.isArray(data.category_summary.top3_contrarian)) error("Missing category_summary.top3_contrarian");
    if (!Array.isArray(data.category_summary.systemic_risks)) error("Missing category_summary.systemic_risks");
  }

  const seenIds = new Set<string>();
  for (let i = 0; i < data.entities.length; i++) {
    const e = data.entities[i];
    const ctx = `Entity[${i}] (${e.id || "NO ID"})`;
    const requiredStrings: (keyof Entity)[] = ["id", "name", "description", "subcategory", "status", "geography", "market_cap_or_valuation", "liquidity", "risk_level", "opportunity_type", "catalyst", "return_horizon", "source", "account", "entry_min", "why_now", "confidence"];
    for (const field of requiredStrings) {
      if (!e[field] || (typeof e[field] === "string" && (e[field] as string).trim() === "")) error(`${ctx}: missing or empty required field "${field}"`);
    }
    if (e.id) {
      if (seenIds.has(e.id)) error(`${ctx}: duplicate ID`);
      seenIds.add(e.id);
      if (prefix && !e.id.startsWith(prefix)) error(`${ctx}: ID should start with "${prefix}" but is "${e.id}"`);
    }
    if (e.status && !VALID_STATUS.includes(e.status)) warn(`${ctx}: unknown status "${e.status}"`);
    if (e.liquidity && !VALID_LIQUIDITY.includes(e.liquidity)) warn(`${ctx}: unknown liquidity "${e.liquidity}"`);
    if (e.risk_level && !VALID_RISK.includes(e.risk_level)) warn(`${ctx}: unknown risk_level "${e.risk_level}"`);
    if (e.opportunity_type && !VALID_OPPORTUNITY.includes(e.opportunity_type)) warn(`${ctx}: unknown opportunity_type "${e.opportunity_type}"`);
    if (e.return_horizon && !VALID_HORIZON.includes(e.return_horizon)) warn(`${ctx}: unknown return_horizon "${e.return_horizon}"`);
    if (e.account && !VALID_ACCOUNT.includes(e.account)) error(`${ctx}: invalid account "${e.account}"`);
    if (e.confidence && !VALID_CONFIDENCE.includes(e.confidence)) error(`${ctx}: invalid confidence "${e.confidence}"`);
    if (!e.catalyst_date) warn(`${ctx}: missing catalyst_date`);
    {
      const src = e.source || "";
      const looksReal = /https?:\/\//.test(src) || /\b(19|20)\d{2}\b/.test(src);
      if (src && (!looksReal || /NCT0{3,}|exemplo|example|placeholder|xxx/i.test(src))) {
        warn(`${ctx}: source looks like a placeholder, not a real dated reference`);
      }
    }
    if (typeof e.asymmetry_score !== "number" || e.asymmetry_score < 1 || e.asymmetry_score > 5) error(`${ctx}: asymmetry_score must be 1-5, got ${e.asymmetry_score}`);
  }

  if (data.category_summary) {
    const allIds = [...(data.category_summary.top5_asymmetry || []), ...(data.category_summary.top3_contrarian || [])];
    for (const id of allIds) if (!seenIds.has(id)) warn(`category_summary references non-existent ID: ${id}`);
  }

  return { errors, warnings };
}

if (import.meta.main) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log("Usage: bun run scripts/validate.ts <path-to-json>");
    process.exit(1);
  }
  try {
    const data = JSON.parse(await Bun.file(filePath).text()) as ScanOutput;
    console.log(`\nValidating: ${filePath}`);
    console.log(`Category: ${data.category || "UNKNOWN"}`);
    console.log(`Entities: ${data.entities?.length || 0}`);
    console.log("---");
    const { errors, warnings } = validateScan(data);
    if (errors.length === 0 && warnings.length === 0) console.log("PASS — No errors or warnings");
    else {
      for (const e of errors) console.log(e);
      for (const w of warnings) console.log(w);
      console.log(`\n--- ${errors.length} error(s), ${warnings.length} warning(s)`);
    }
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (e: any) {
    console.log(e instanceof SyntaxError ? `ERROR: Invalid JSON — ${e.message}` : `ERROR: ${e.message}`);
    process.exit(1);
  }
}
