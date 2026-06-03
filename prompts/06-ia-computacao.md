# Scan: IA & Computacao

**Prefixo ID:** AIC-
**Target:** 30-50 entidades

---

## Instrucoes

Actua como analista de investimento especializado em inteligencia artificial e computacao avancada. Gera uma lista curada de 30 a 50 entidades com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir.

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
