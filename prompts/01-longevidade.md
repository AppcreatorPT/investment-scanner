# Scan: Longevidade & Saude

**Prefixo ID:** LSA-
**Target:** ~12-15 instrumentos acessiveis (ver regra no fim)

---

## Instrucoes

Actua como analista de investimento especializado em longevity biotech e healthtech. Gera uma lista curada de ~12-15 instrumentos ACESSIVEIS (ver "Regra de Acessibilidade & Rigor" no fim) com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir.

## Scope

Biotechs, investigadores com empresas/fundos associados, clinicas com modelo escalavel, fundos focados em aging, empresas de senoliticos, rejuvenescimento celular, reprogramacao epigenetica, longevity biomarkers, organ-on-chip, xenotransplantacao, GLP-1 e adjacentes, diagnostic AI para aging, plataformas de drug discovery focadas em aging.

## Criterios de seleccao

- Prioriza entidades com baixa exposicao mediatica mas alta substancia tecnica/cientifica
- Exclui qualquer entidade com mais de 50.000 mencoes em Google News nos ultimos 12 meses
- Exclui entidades no S&P 500, Nasdaq 100 ou STOXX 600
- Destaca entidades com catalisadores de curto prazo: PDUFA dates, aprovacoes FDA/EMA, resultados de trials Phase 2/3, IPOs iminentes, M&A rumors
- Sinaliza red flags: revenue recognition agressiva, diluicao excessiva, dependencia de um unico programa >80% do pipeline, management com historico problematico

## Priorizacao de horizonte

Prioriza curto prazo (0-12 meses) sempre que possivel, mas inclui obrigatoriamente entidades de medio e longo prazo se a substancia o justificar.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_longevidade.json`.

### Regras

- IDs: LSA-001, LSA-002, ...
- Campo "category": "Longevidade & Saude"
- Todos os campos sao obrigatorios; usa null quando nao aplicavel
- catalyst_date: data mais precisa possivel (dia > mes > trimestre > ano)
- source: deve ser verificavel (publicacao, filing, base de dados)
- `_meta.total_entities` deve corresponder ao comprimento real do array
- Nao incluas entidades sobre as quais nao consigas verificar pelo menos 8 campos
- **Prefere omitir a inventar**

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
