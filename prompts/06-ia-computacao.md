# Scan: IA & Computacao

**Prefixo ID:** AIC-
**Target:** ~12-15 instrumentos acessiveis (ver regra no fim)

---

## Instrucoes

Actua como analista de investimento especializado em inteligencia artificial e computacao avancada. Gera uma lista curada de ~12-15 instrumentos ACESSIVEIS (ver "Regra de Acessibilidade & Rigor" no fim) com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir. **Aplica a metodologia anti-bias de `prompts/_metodologia-pesquisa.md`** (fontes primarias, bloquear listicles, bear-case, contrarian, eventos).

## Scope

Labs de IA fora do mainstream mediatico (nao OpenAI/Google/Anthropic), fundadores com trabalho de fronteira, pesquisadores que criaram empresas, empresas de AI infrastructure (compute, data labeling, fine-tuning platforms, inference optimization), AI para vertical industries (legal, healthcare, manufacturing, agriculture), robotics AI, embodied AI, neuromorphic computing, quantum computing (hardware + software), edge AI, AI safety companies com modelo de negocio, AI chipmakers alternativos.

## Criterios de seleccao

- Prioriza entidades com baixa cobertura mediatica mas trabalho tecnico de fronteira (papers citados, benchmarks, patentes)
- Exclui explicitamente: OpenAI, Google DeepMind, Anthropic, Meta AI, Microsoft AI, xAI, Nvidia
- Destaca catalisadores de curto prazo: IPOs iminentes, funding rounds a fechar, contratos enterprise significativos, government AI procurement, product launches
- Sinaliza empresas de AI infra que beneficiam independentemente de qual modelo "vence" (picks & shovels play)
- Sinaliza red flags: AI wrapper sem moat, dependencia de uma unica API (ex: 100% sobre GPT), burn rate insustentavel sem path to revenue, regulatory risk (EU AI Act, executive orders)

## Priorizacao de horizonte

Prioriza curto prazo (0-12 meses) sempre que possivel.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_ia-computacao.json`.

### Regras

- IDs: AIC-001, AIC-002, ...
- Campo "category": "IA & Computacao"
- Todos os campos sao obrigatorios; usa null quando nao aplicavel
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
