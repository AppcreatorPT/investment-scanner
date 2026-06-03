/**
 * Validador de output JSON do Investment Research Scanner
 * Uso: bun run scripts/validate.ts output/FICHEIRO.json
 */

const VALID_PREFIXES: Record<string, string> = {
  "Longevidade & Saude": "LSA-",
  "Trading & Mercados": "TRD-",
  "Materiais & Energia": "MAT-",
  "Economia & Macro": "MAC-",
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

interface Entity {
  id: string;
  name: string;
  description: string;
  subcategory: string;
  status: string;
  ticker: string | null;
  geography: string;
  market_cap_or_valuation: string;
  liquidity: string;
  risk_level: string;
  opportunity_type: string;
  catalyst: string;
  catalyst_date: string | null;
  asymmetry_score: number;
  return_horizon: string;
  red_flags: string | null;
  source: string;
}

interface ScanOutput {
  category: string;
  scan_date: string;
  entities: Entity[];
  category_summary: {
    top5_asymmetry: string[];
    top3_contrarian: string[];
    systemic_risks: string[];
  };
  _meta: {
    total_entities: number;
    schema_version: string;
    category: string;
  };
}

const errors: string[] = [];
const warnings: string[] = [];

function error(msg: string) { errors.push(`ERROR: ${msg}`); }
function warn(msg: string) { warnings.push(`WARN: ${msg}`); }

function validate(data: ScanOutput) {
  const category = data.category;
  const prefix = VALID_PREFIXES[category];

  // Category check
  if (!category) error("Missing 'category' field");
  if (category && !VALID_PREFIXES[category]) {
    warn(`Unknown category "${category}" — expected one of: ${Object.keys(VALID_PREFIXES).join(", ")}`);
  }

  // scan_date
  if (!data.scan_date) error("Missing 'scan_date' field");

  // Entities array
  if (!Array.isArray(data.entities)) {
    error("'entities' is not an array");
    return;
  }

  // Count check
  const count = data.entities.length;
  if (count < 15) warn(`Only ${count} entities — target is 30-50`);
  if (count > 80) warn(`${count} entities — exceeds recommended max of 50`);

  // Meta check
  if (data._meta) {
    if (data._meta.total_entities !== count) {
      error(`_meta.total_entities (${data._meta.total_entities}) != actual entity count (${count})`);
    }
  } else {
    error("Missing '_meta' block");
  }

  // Category summary
  if (!data.category_summary) {
    error("Missing 'category_summary' block");
  } else {
    if (!Array.isArray(data.category_summary.top5_asymmetry)) error("Missing category_summary.top5_asymmetry");
    if (!Array.isArray(data.category_summary.top3_contrarian)) error("Missing category_summary.top3_contrarian");
    if (!Array.isArray(data.category_summary.systemic_risks)) error("Missing category_summary.systemic_risks");
  }

  // Validate each entity
  const seenIds = new Set<string>();

  for (let i = 0; i < data.entities.length; i++) {
    const e = data.entities[i];
    const ctx = `Entity[${i}] (${e.id || "NO ID"})`;

    // Required string fields
    const requiredStrings: (keyof Entity)[] = [
      "id", "name", "description", "subcategory", "status",
      "geography", "market_cap_or_valuation", "liquidity",
      "risk_level", "opportunity_type", "catalyst",
      "return_horizon", "source"
    ];

    for (const field of requiredStrings) {
      if (!e[field] || (typeof e[field] === "string" && (e[field] as string).trim() === "")) {
        error(`${ctx}: missing or empty required field "${field}"`);
      }
    }

    // ID prefix check
    if (e.id) {
      if (seenIds.has(e.id)) error(`${ctx}: duplicate ID`);
      seenIds.add(e.id);

      if (prefix && !e.id.startsWith(prefix)) {
        error(`${ctx}: ID should start with "${prefix}" but is "${e.id}"`);
      }
    }

    // Enum validations
    if (e.status && !VALID_STATUS.includes(e.status)) {
      warn(`${ctx}: unknown status "${e.status}"`);
    }
    if (e.liquidity && !VALID_LIQUIDITY.includes(e.liquidity)) {
      warn(`${ctx}: unknown liquidity "${e.liquidity}"`);
    }
    if (e.risk_level && !VALID_RISK.includes(e.risk_level)) {
      warn(`${ctx}: unknown risk_level "${e.risk_level}"`);
    }
    if (e.opportunity_type && !VALID_OPPORTUNITY.includes(e.opportunity_type)) {
      warn(`${ctx}: unknown opportunity_type "${e.opportunity_type}"`);
    }
    if (e.return_horizon && !VALID_HORIZON.includes(e.return_horizon)) {
      warn(`${ctx}: unknown return_horizon "${e.return_horizon}"`);
    }

    // Asymmetry score
    if (typeof e.asymmetry_score !== "number" || e.asymmetry_score < 1 || e.asymmetry_score > 5) {
      error(`${ctx}: asymmetry_score must be 1-5, got ${e.asymmetry_score}`);
    }
  }

  // Summary ID references check
  if (data.category_summary) {
    const allIds = [...(data.category_summary.top5_asymmetry || []), ...(data.category_summary.top3_contrarian || [])];
    for (const id of allIds) {
      if (!seenIds.has(id)) {
        warn(`category_summary references non-existent ID: ${id}`);
      }
    }
  }
}

// Main
const filePath = process.argv[2] || Bun.argv[2];

if (!filePath) {
  console.log("Usage: bun run scripts/validate.ts <path-to-json>");
  console.log("Example: bun run scripts/validate.ts output/2026-04-05_longevidade.json");
  process.exit(1);
}

try {
  const file = Bun.file(filePath);
  const text = await file.text();
  const data = JSON.parse(text) as ScanOutput;

  console.log(`\nValidating: ${filePath}`);
  console.log(`Category: ${data.category || "UNKNOWN"}`);
  console.log(`Entities: ${data.entities?.length || 0}`);
  console.log("---");

  validate(data);

  if (errors.length === 0 && warnings.length === 0) {
    console.log("PASS — No errors or warnings");
  } else {
    for (const e of errors) console.log(e);
    for (const w of warnings) console.log(w);
    console.log(`\n--- ${errors.length} error(s), ${warnings.length} warning(s)`);
  }

  process.exit(errors.length > 0 ? 1 : 0);
} catch (e: any) {
  if (e instanceof SyntaxError) {
    console.log(`ERROR: Invalid JSON — ${e.message}`);
  } else {
    console.log(`ERROR: ${e.message}`);
  }
  process.exit(1);
}
