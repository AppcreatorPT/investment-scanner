# CLAUDE.md — Investment Research Scanner

Le este ficheiro antes de fazer qualquer coisa.

---

## O que e este sistema

Scanner de oportunidades de investimento organizado em 7 temas. Gera listas curadas de **instrumentos acessiveis a um retail da UE de baixo orcamento** (€10-100), com potencial de retorno assimetrico e **via de compra real** (direto ou proxy cotado), em formato JSON estruturado.

---

## Categorias

| # | Categoria | Prefixo ID | Prompt |
|---|-----------|------------|--------|
| 1 | Longevidade & Saude | LSA- | prompts/01-longevidade.md |
| 2 | Trading & Mercados | TRD- | prompts/02-trading.md |
| 3 | Materiais & Energia | MAT- | prompts/03-materiais.md |
| ~~4~~ | ~~Economia & Macro~~ — retirada (macro acessivel dobra para Materiais/Trading) | — | — |
| 5 | Geopolitica & Defesa | GEO- | prompts/05-geopolitica.md |
| 6 | IA & Computacao | AIC- | prompts/06-ia-computacao.md |
| 7 | Espaco & Deep Tech | SDT- | prompts/07-espaco-deeptech.md |
| 8 | Financas Alternativas | FIN- | prompts/08-financas-alt.md |
| 9 | Agregacao | — | prompts/09-agregacao.md |

---

## Como correr um scan

O utilizador diz algo como:
- "corre o scan de Longevidade"
- "scan categoria 3"
- "scan todas"

### Workflow por categoria:

1. Le o prompt correspondente em `prompts/`
2. Usa **WebSearch** para verificar dados de cada entidade (catalisadores, IPOs, contratos, funding, tickers)
3. Gera o JSON seguindo o schema abaixo
4. Guarda em `output/YYYY-MM-DD_nome-categoria.json`
5. Corre o validador: `bun run scripts/validate.ts output/ficheiro.json`

### Agregacao:

A agregacao e feita **ao vivo pelo dashboard** (carrega varios JSONs e cruza-os). **Nao gerar** `_agregado.json` — e dado duplicado.

---

## Schema JSON (essencial — acessivel + grounded)

Cada ficheiro de output segue esta estrutura:

```json
{
  "category": "Nome da Categoria",
  "scan_date": "YYYY-MM-DD",
  "entities": [
    {
      "id": "PRE-001",
      "name": "Nome da Entidade",
      "description": "Descricao curta, 1-2 linhas",
      "subcategory": "Sub-area especifica",
      "status": "privada | pre-IPO | cotada | token | fundo",
      "ticker": "ticker COMPRAVEL (o do proxy se houver proxy) | null",
      "geography": "Pais sede + bolsa se cotada",
      "market_cap_or_valuation": "~$2B | Serie C $400M",
      "liquidity": "alta | media | baixa | sem mercado",
      "risk_level": "baixo | moderado | alto | especulativo",
      "opportunity_type": "acao cotada | opcoes | IPO | pre-IPO | token | fundo | exposicao indireta",
      "catalyst": "Evento especifico com data se possivel",
      "catalyst_date": "YYYY-MM-DD | Q2 2026 | null",
      "asymmetry_score": 4,
      "return_horizon": "curto (0-12m) | medio (1-3a) | longo (3+a)",
      "red_flags": "Risco principal ou null",
      "source": "URL real e datada (filing/noticia) — sem placeholders",
      "account": "neobroker | vantage-cfd | cripto-exchange | abrir-conta",
      "proxy_for": "subjacente inacessivel que o ticker replica | null",
      "entry_min": "~€10 (fracionado)",
      "why_now": "porque existe e porque ainda nao esta no preco",
      "confidence": "verificado | parcial | especulativo",
      "access_note": "a pega (UCITS, app, CFD-so-catalisador) | null"
    }
  ],
  "category_summary": {
    "top5_asymmetry": ["id1", "id2", "id3", "id4", "id5"],
    "top3_contrarian": ["id1", "id2", "id3"],
    "systemic_risks": ["risco1", "risco2", "risco3"]
  },
  "_meta": {
    "total_entities": 0,
    "schema_version": "2.0",
    "category": "Nome da Categoria"
  }
}
```

---

## Regras criticas

1. **~12-15 instrumentos ACESSIVEIS por tema** — poucos e de alta conviccao (nao 30-50)
2. **Prefere omitir a inventar** — se nao conseguires verificar pelo menos 8 campos, nao incluas a entidade
3. **Usa WebSearch** para verificar dados: tickers, valuations, catalisadores, datas
4. **asymmetry_score** deve ser entre 1 e 5 (5 = maxima assimetria risco/retorno)
5. **`_meta.total_entities`** deve corresponder ao comprimento real do array `entities`
6. **IDs sequenciais** com o prefixo da categoria (LSA-001, LSA-002, ...)
7. **Naming do output**: `YYYY-MM-DD_nome-categoria.json` (ex: `2026-04-05_longevidade.json`)
8. **Acessivel-primeiro**: nada entra se um retail UE de baixo orcamento (€10-100, neobroker fracionado) nao puder comprar — direto ou via proxy cotado NOMEADO. Sem via → omitir.
9. **Rotear `account`** por instrumento; `ticker` = o que se escreve no broker (o do proxy se houver proxy).
10. **Catalisador datavel quase-obrigatorio**; sem `catalyst_date`, so com conviccao muito alta.
11. **Grounded**: cada entidade traz `why_now` (porque ainda nao esta no preco) e `confidence`; `source` real e datada. Sem `why_now` solido → omitir.
12. **Sem agregado**: a agregacao e feita ao vivo pelo dashboard; nao gerar `_agregado.json`.

---

## Validacao

Apos gerar um JSON, corre:

```bash
bun run scripts/validate.ts output/FICHEIRO.json
```

Ou o utilizador pode dizer "valida o ultimo output".

---

## Comandos rapidos

- `/scan [categoria]` — corre scan de uma categoria
- `/scan todas` — corre os 7 temas sequencialmente
- `/valida [ficheiro]` — corre validacao
- `/agrega` — corre agregacao dos outputs do dia
