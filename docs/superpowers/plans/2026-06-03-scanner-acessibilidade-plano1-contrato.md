# Plano 1 — Contrato de Dados + Piloto (Acessibilidade & Rigor)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabelecer o novo schema acessível+grounded, forçá-lo no validador (TDD), atualizar as instruções de scan e prová-lo num scan-piloto de 1 tema que passa a validação.

**Architecture:** O validador (`scripts/validate.ts`) é a única peça determinística → TDD com `bun test`. Os prompts e o `CLAUDE.md` são conteúdo que conduz a geração pelo modelo. O scan-piloto é uma execução do modelo (com WebSearch) verificada pelo validador. Dashboard fica para o Plano 2.

**Tech Stack:** Bun (runtime + `bun test`), TypeScript, Markdown (prompts/CLAUDE.md), JSON (outputs).

---

## Pré-requisitos (já feitos)

- Repo isolado em `Desktop/Search` com baseline commit `858fab3` (rede de segurança).
- Spec aprovado: `docs/superpowers/specs/2026-06-03-scanner-acessibilidade-design.md`.

**Antes de começar a executar:** criar um branch de trabalho.
```bash
cd "c:/Users/user/Desktop/Search"
git checkout -b feat/acessibilidade-contrato
```

## Estrutura de ficheiros (Plano 1)

| Ficheiro | Responsabilidade | Ação |
|----------|------------------|------|
| `schema.json` → `example-output.json` | Exemplo canónico do output (direto + proxy) | Renomear + reescrever |
| `scripts/validate.ts` | Validação determinística do schema | Refatorar + estender |
| `scripts/validate.test.ts` | Testes do validador (`bun test`) | Criar |
| `CLAUDE.md` | Regras de geração + schema | Editar |
| `prompts/_regra-acessibilidade-rigor.md` | Bloco de regra partilhado (fonte única) | Criar |
| `prompts/06-ia-computacao.md` | Prompt piloto | Injetar bloco |
| `output/2026-06-03_ia-computacao.json` | Output do scan-piloto | Gerar |

---

## Task 1: Renomear `schema.json` → `example-output.json` (exemplo grounded + acessível)

**Files:**
- Rename: `schema.json` → `example-output.json`

- [ ] **Step 1: Renomear com git**

```bash
git mv schema.json example-output.json
```

- [ ] **Step 2: Reescrever o conteúdo** de `example-output.json` com 2 entidades (1 direta + 1 proxy), todos os campos novos:

```json
{
  "category": "IA & Computacao",
  "scan_date": "2026-06-03",
  "entities": [
    {
      "id": "AIC-001",
      "name": "Nvidia",
      "description": "Lider em GPUs de datacenter para treino/inferencia de IA.",
      "subcategory": "Computacao / semicondutores IA",
      "status": "cotada",
      "ticker": "NVDA",
      "geography": "EUA, NASDAQ",
      "market_cap_or_valuation": "~$3T",
      "liquidity": "alta",
      "risk_level": "moderado",
      "opportunity_type": "acao cotada",
      "catalyst": "Rampa de Blackwell e guidance de datacenter",
      "catalyst_date": "Q3 2026",
      "why_now": "Procura de compute ainda excede oferta; consenso pode subestimar a duracao do ciclo de capex de IA",
      "confidence": "parcial",
      "asymmetry_score": 4,
      "return_horizon": "medio (1-3a)",
      "red_flags": "Valuation alta; risco de digestao de capex pelos hyperscalers",
      "account": "neobroker",
      "proxy_for": null,
      "entry_min": "~€10 (fracionado)",
      "access_note": null,
      "source": "https://investor.nvidia.com — earnings 2026"
    },
    {
      "id": "AIC-002",
      "name": "Exposicao a OpenAI",
      "description": "OpenAI e privada; a Microsoft detem participacao e integra os modelos no Azure/Copilot.",
      "subcategory": "Modelos fundacionais (exposicao indireta)",
      "status": "privada",
      "ticker": "MSFT",
      "geography": "EUA, NASDAQ",
      "market_cap_or_valuation": "OpenAI ~$300B (privada)",
      "liquidity": "alta",
      "risk_level": "moderado",
      "opportunity_type": "exposicao indireta",
      "catalyst": "Monetizacao de Copilot e crescimento de Azure AI",
      "catalyst_date": "Q4 2026",
      "why_now": "Unica via liquida e acessivel ao retail UE para exposicao economica a OpenAI antes de qualquer evento de liquidez",
      "confidence": "especulativo",
      "asymmetry_score": 3,
      "return_horizon": "medio (1-3a)",
      "red_flags": "Exposicao a OpenAI e diluida dentro de uma mega-cap",
      "account": "neobroker",
      "proxy_for": "OpenAI (privada) — via participacao da Microsoft",
      "entry_min": "~€10 (fracionado)",
      "access_note": "Proxy imperfeito: MSFT e muito mais do que OpenAI",
      "source": "https://news.microsoft.com — comunicado 2026"
    }
  ],
  "category_summary": {
    "top5_asymmetry": ["AIC-001", "AIC-002"],
    "top3_contrarian": ["AIC-002"],
    "systemic_risks": [
      "Digestao de capex de IA pelos hyperscalers",
      "Compressao de multiplos com taxas altas",
      "Concentracao do tema em poucas mega-caps"
    ]
  },
  "_meta": {
    "total_entities": 2,
    "schema_version": "2.0",
    "category": "IA & Computacao"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: rename schema.json to example-output.json with accessible+grounded example"
```

(Nota: este ficheiro é documentação/exemplo; ao validá-lo só deve avisar sobre contagem baixa — esperado.)

---

## Task 2: Tornar o validador testável (refatorar para função pura) + smoke test

**Files:**
- Modify: `scripts/validate.ts` (extrair `validateScan`)
- Create: `scripts/validate.test.ts`

- [ ] **Step 1: Escrever o smoke test (falha primeiro)** — `scripts/validate.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr para ver falhar**

Run: `cd "c:/Users/user/Desktop/Search/scripts" && bun test`
Expected: FAIL — `validateScan` não é exportado (import error).

- [ ] **Step 3: Refatorar `scripts/validate.ts`** para exportar `validateScan` puro e mover o CLI para um guard `import.meta.main`. Substituir o ficheiro inteiro por:

```ts
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

export interface Entity {
  id: string; name: string; description: string; subcategory: string;
  status: string; ticker: string | null; geography: string;
  market_cap_or_valuation: string; liquidity: string; risk_level: string;
  opportunity_type: string; catalyst: string; catalyst_date: string | null;
  asymmetry_score: number; return_horizon: string; red_flags: string | null;
  source: string;
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
  if (count < 15) warn(`Only ${count} entities — target is 30-50`);
  if (count > 80) warn(`${count} entities — exceeds recommended max of 50`);

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
    const requiredStrings: (keyof Entity)[] = ["id","name","description","subcategory","status","geography","market_cap_or_valuation","liquidity","risk_level","opportunity_type","catalyst","return_horizon","source"];
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
```

- [ ] **Step 4: Correr o teste — deve passar**

Run: `cd "c:/Users/user/Desktop/Search/scripts" && bun test`
Expected: PASS (1 test).

- [ ] **Step 5: Confirmar que o CLI continua a funcionar**

Run: `cd "c:/Users/user/Desktop/Search" && bun run scripts/validate.ts output/2026-04-05_longevidade.json`
Expected: imprime `Validating...` e termina (com erros/avisos do schema antigo — normal nesta fase).

- [ ] **Step 6: Commit**

```bash
git add scripts/validate.ts scripts/validate.test.ts
git commit -m "refactor: extract pure validateScan + add bun test harness"
```

---

## Task 3: Validações de Acessibilidade & Rigor (test-first)

**Files:**
- Modify: `scripts/validate.ts`
- Modify: `scripts/validate.test.ts`

- [ ] **Step 1: Acrescentar testes (falham primeiro)** — anexar a `scripts/validate.test.ts`:

```ts
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

test("placeholder source is a warning", () => {
  const { warnings } = validateScan(baseScan([baseEntity({ source: "ClinicalTrials NCT0000000" })]));
  expect(warnings.some(w => w.includes("placeholder"))).toBe(true);
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
```

- [ ] **Step 2: Correr — devem falhar**

Run: `cd "c:/Users/user/Desktop/Search/scripts" && bun test`
Expected: FAIL nos 7 testes novos.

- [ ] **Step 3: Implementar.** Em `scripts/validate.ts`:

(a) Acrescentar consts após `VALID_HORIZON`:
```ts
const VALID_ACCOUNT = ["neobroker", "vantage-cfd", "cripto-exchange", "abrir-conta"];
const VALID_CONFIDENCE = ["verificado", "parcial", "especulativo"];
```

(b) Remover a linha `"Economia & Macro": "MAC-",` de `VALID_PREFIXES`.

(c) Estender a interface `Entity` (acrescentar dentro do bloco):
```ts
  account: string; proxy_for: string | null; entry_min: string;
  why_now: string; confidence: string; access_note: string | null;
```

(d) Acrescentar a `requiredStrings`: `"account", "entry_min", "why_now", "confidence"`.

(e) Trocar os thresholds de contagem por:
```ts
  if (count < 8) warn(`Only ${count} entities — target is ~12-15 accessible`);
  if (count > 30) warn(`${count} entities — exceeds target of ~12-15 accessible`);
```

(f) Dentro do loop de entidades, após o check de `return_horizon`, acrescentar:
```ts
    if (e.account && !VALID_ACCOUNT.includes(e.account)) error(`${ctx}: invalid account "${e.account}"`);
    if (e.confidence && !VALID_CONFIDENCE.includes(e.confidence)) error(`${ctx}: invalid confidence "${e.confidence}"`);
    if (!e.catalyst_date) warn(`${ctx}: missing catalyst_date`);
    const src = e.source || "";
    const looksReal = /https?:\/\//.test(src) || /\b(19|20)\d{2}\b/.test(src);
    if (src && (!looksReal || /NCT0{3,}|exemplo|example|placeholder|xxx/i.test(src))) {
      warn(`${ctx}: source looks like a placeholder, not a real dated reference`);
    }
```

- [ ] **Step 4: Correr — todos passam**

Run: `cd "c:/Users/user/Desktop/Search/scripts" && bun test`
Expected: PASS (8 testes no total).

- [ ] **Step 5: Commit**

```bash
git add scripts/validate.ts scripts/validate.test.ts
git commit -m "feat: validate accessibility + rigor fields (account, entry_min, why_now, confidence, source)"
```

---

## Task 4: Atualizar `CLAUDE.md` (regras de geração + schema)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Tabela de categorias** — marcar Economia como retirada. Substituir a linha:
```
| 4 | Economia & Macro | MAC- | prompts/04-economia.md |
```
por:
```
| ~~4~~ | ~~Economia & Macro~~ (retirada — macro acessivel dobra para Materiais/Trading) | — | — |
```

- [ ] **Step 2: Schema** — no bloco JSON de schema, acrescentar os 6 campos novos a cada entidade (após `red_flags`):
```jsonc
      "account": "neobroker | vantage-cfd | cripto-exchange | abrir-conta",
      "proxy_for": "subjacente inacessivel que o ticker replica | null",
      "entry_min": "~€10 (fracionado)",
      "why_now": "porque existe e porque ainda nao esta no preco",
      "confidence": "verificado | parcial | especulativo",
      "access_note": "a pega (UCITS, app, CFD-so-catalisador) | null",
```
E mudar a nota de semântica do `ticker` para: `"ticker": "ticker COMPRAVEL (o do proxy se houver proxy) | null"`.

- [ ] **Step 3: Regras críticas** — substituir a regra 1 (`30-50 entidades`) por:
```
1. **~12-15 instrumentos ACESSIVEIS por tema** — poucos e de alta conviccao (nao 30-50)
```
E acrescentar ao fim da lista de regras:
```
8. **Acessivel-primeiro**: nada entra se um retail UE de baixo orcamento (€10-100, neobroker fracionado) nao puder comprar — direto ou via proxy cotado NOMEADO. Sem via → omitir.
9. **Rotear `account`** por instrumento; `ticker` = o que se escreve no broker.
10. **Catalisador datavel quase-obrigatorio**; sem `catalyst_date`, so com conviccao muito alta.
11. **Grounded**: cada entidade traz `why_now` (porque nao esta no preco) e `confidence`; `source` real e datada. Sem `why_now` solido → omitir.
12. **Sem agregado**: a agregacao e feita ao vivo pelo dashboard; nao gerar `_agregado.json`.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with accessibility/rigor rules, 6 new fields, 7 themes"
```

---

## Task 5: Bloco de regra partilhado + injeção no prompt piloto

**Files:**
- Create: `prompts/_regra-acessibilidade-rigor.md`
- Modify: `prompts/06-ia-computacao.md`

- [ ] **Step 1: Criar `prompts/_regra-acessibilidade-rigor.md`** (fonte única, reutilizada nos restantes prompts no Plano 2):

```markdown
## Regra de Acessibilidade & Rigor (UE / baixo orcamento)

Toda a entidade DEVE ser compravel por um retail da UE (Franca) com €10-100:

- **Acessivel-primeiro:** se a tese e inacessivel (pre-IPO, privada, ETF US sem KID), so
  entra atraves de um **proxy cotado NOMEADO** (ex.: SpaceX → DXYZ). Sem proxy → nao incluir.
- **`account`** (obrigatorio): `neobroker` (comprar & segurar) · `vantage-cfd` (catalisador
  curto, nunca segurar) · `cripto-exchange` (tokens) · `abrir-conta` (diz qual em `access_note`).
- **`ticker`** = o ticker que se escreve no broker para comprar (o do proxy, se proxy).
- **`proxy_for`**: o subjacente inacessivel replicado, ou `null`.
- **`entry_min`**: minimo realista (ex.: `~€10 (fracionado)`).
- **`access_note`**: a pega (equivalente UCITS, app, "CFD so p/ catalisador") ou `null`.

Rigor (anti-palpite):

- **`why_now`** (obrigatorio): porque existe a oportunidade e porque **ainda nao esta no
  preco**. Sem boa resposta → nao incluir.
- **`confidence`**: `verificado` / `parcial` / `especulativo`.
- **`source`**: referencia real e datada (URL de filing/noticia). Sem placeholders.
- **`catalyst_date`** datavel e quase-obrigatorio; sem data, so com conviccao muito alta.

Alvo: **~12-15 instrumentos acessiveis** de alta conviccao (nao 30-50).
```

- [ ] **Step 2: Injetar no prompt piloto.** Anexar ao fim de `prompts/06-ia-computacao.md`:

```markdown

---

<!-- Aplicar SEMPRE as regras abaixo (ver prompts/_regra-acessibilidade-rigor.md) -->

## Regra de Acessibilidade & Rigor (UE / baixo orcamento)

Toda a entidade DEVE ser compravel por um retail da UE (Franca) com €10-100:

- **Acessivel-primeiro:** se a tese e inacessivel (pre-IPO, privada, ETF US sem KID), so
  entra atraves de um **proxy cotado NOMEADO**. Sem proxy → nao incluir.
- **`account`** (obrigatorio): `neobroker` · `vantage-cfd` · `cripto-exchange` · `abrir-conta`.
- **`ticker`** = ticker compravel (o do proxy, se proxy). **`proxy_for`**: subjacente ou `null`.
- **`entry_min`**: minimo realista. **`access_note`**: a pega ou `null`.
- **`why_now`** (obrigatorio): porque ainda nao esta no preco. Sem boa resposta → omitir.
- **`confidence`**: `verificado`/`parcial`/`especulativo`. **`source`**: real e datada.
- **`catalyst_date`** quase-obrigatorio. Alvo: **~12-15 instrumentos acessiveis**.
```

- [ ] **Step 3: Commit**

```bash
git add prompts/_regra-acessibilidade-rigor.md prompts/06-ia-computacao.md
git commit -m "feat: add shared accessibility/rigor rule block + inject into IA pilot prompt"
```

---

## Task 6: Scan-piloto + validação (o GATE)

**Files:**
- Create: `output/2026-06-03_ia-computacao.json` (gerado pelo modelo)

> Esta task é uma execução do modelo (com WebSearch), não código. É o portão da spec (secção 8): prova o contrato em 1 tema antes de alargar.

- [ ] **Step 1: Correr o scan** de "IA & Computacao" seguindo o `CLAUDE.md` atualizado e `prompts/06-ia-computacao.md`. Usar WebSearch para verificar ticker, catalisador/data e (quando proxy) o veículo cotado. Guardar em `output/2026-06-03_ia-computacao.json` no schema novo.

- [ ] **Step 2: Validar**

Run: `cd "c:/Users/user/Desktop/Search" && bun run scripts/validate.ts output/2026-06-03_ia-computacao.json`
Expected: **0 erros** (avisos pontuais aceitáveis).

- [ ] **Step 3: Verificar os critérios de aceitação** (manualmente sobre o JSON):
  - 12-15 entidades.
  - Todas têm `account` válido, `entry_min`, `why_now` não-trivial, `confidence`.
  - ≥1 entidade com `proxy_for` não-nulo (demonstra o roteamento de proxy).
  - `source` de cada entidade é uma referência real datada (sem placeholders).
  - `_meta.total_entities` == nº real de entidades.

- [ ] **Step 4: Commit**

```bash
git add output/2026-06-03_ia-computacao.json
git commit -m "feat: pilot scan (IA & Computacao) under accessible+grounded schema"
```

- [ ] **Step 5: STOP — checkpoint humano.** Rever a qualidade real das ideias do piloto. Só avançar para o Plano 2 (rollout aos restantes temas + dashboard) se o piloto provar que o output é acessível, grounded e útil. Se não, afinar o bloco de regra e re-correr o piloto.

---

## Self-Review (preenchido pelo autor do plano)

**1. Cobertura da spec:**
- Schema +6 campos → Task 1 (exemplo), Task 3 (validação), Task 4 (CLAUDE.md). ✅
- `ticker` = comprável → Task 4 Step 2. ✅
- 7 temas / cai Economia → Task 3(b) (prefixo), Task 4 Step 1. ✅
- Alvo ~12-15 → Task 3(e), Task 4 Step 3. ✅
- Regra-mãe acessível-primeiro → Task 4/5. ✅
- Fim do agregado → Task 4 (regra 12); a edição de `prompts/09` fica no Plano 2 (rollout). ✅ (documentado)
- `schema.json`→`example-output.json` → Task 1. ✅
- Rigor (why_now/confidence/source) → Task 3, 4, 5. ✅
- Validação faseada (piloto) → Task 6. ✅
- **Fora do Plano 1 (→ Plano 2):** injeção nos prompts 01-08 restantes, retirar 04-economia da rotação, editar 09-agregacao, e TODAS as mudanças do dashboard. Documentado como Plano 2.

**2. Placeholders:** nenhum "TBD/TODO"; todo o código está presente. ✅

**3. Consistência de tipos:** `validateScan` retorna `{errors, warnings}` em Task 2 e é usado assim em Task 2/3 testes e CLI. Campos novos idênticos entre interface (Task 3c), required (3d), exemplo (Task 1) e bloco de regra (Task 5). ✅

---

## Próximo: Plano 2 (a escrever após o piloto)

"Rollout + Dashboard": injetar o bloco nos prompts 01,02,03,05,07,08; retirar 04-economia da rotação; `prompts/09-agregacao` deixa de gerar ficheiro; dashboard ganha vista "buy-list", coluna/filtro `account`, badge de proxy, `entry_min`, campos novos no detalhe, correção do resumo (IDs→nomes) e proteção contra agregado. Verificação via skill `run-search` (screenshots).
