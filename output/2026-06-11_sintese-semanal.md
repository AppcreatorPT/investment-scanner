# Sintese Semanal — 2026-06-11 (primeira edicao)

> Research pessoal gerado pelo scanner; nao e aconselhamento financeiro.
> Inputs: scan commodities de hoje (validador estrito, 12/12 sources URL), scans 2026-06-03 (7 temas), scorecard retrospectivo de hoje.

## Criterios de destilacao (aplicados por ordem)

1. `confidence` ≠ especulativo — **o scorecard mostrou 0% de picks especulativos positivos (mediana -13%)**
2. Catalisador datado nas proximas ~8 semanas
3. Via de compra fracionada €10-100 verificada
4. Bear case identificado na fonte

Nota do scorecard: o `asymmetry_score` 4-5 esta a performar PIOR que 3 (mediana -7,0% vs -0,1%) — esta sintese pesa confidence + catalisador datado acima do score, ate o criterio ser recalibrado.

## Buy-list (3-4 posicoes, exemplo de alocacao para €100)

| # | Instrumento | Ticker | Aloc. | Tese em 1 linha | Catalisador | Regra de saida |
|---|---|---|---|---|---|---|
| 1 | Ouro fisico (ancora, hold) | 4GLD | ~€35 | Corrigiu -25% do ATH de $5.589; sem roll cost, hold estrutural | FOMC 2026-06-17 | Sem saida — ancora; reavaliar se novo ATH |
| 2 | Cal-Maine (ovos, contrarian) | CALM | ~€25 | P/E ~5,4 perto do minimo 52w apos colapso do preco do ovo; mercado extrapola o ciclo em baixa | Resultados Q4 FY26 (Q3 2026) | Se resultados confirmarem erosao estrutural de margem (nao ciclica), sair |
| 3 | K+S (potassio, contrarian) | SDF | ~€20 | Mid-cap esquecida com alavancagem operacional ao potassio abaixo do preco de incentivo | Resultados 2026-08-12 | Se preco do potassio nao recuperar ate aos resultados, sair |
| 4 | Trigo (TACTICO, curto) | WEAT | ~€20 | Pior safra de inverno EUA desde 1965 (WASDE 2026-06-10) | WASDE 2026-07-10 | **Sair apos o WASDE de julho** independentemente do resultado — ETC de futuros sangra em contango |

Reserva: ~€0-20 por executar ate a reavaliacao de sabado das 21 teses da watchlist.

## O que NAO comprar (e porque)

- **Short Brent via CFD (COM-011)** — tese valida (reabertura de Ormuz no Q3 segundo a EIA) mas alavancada, sem data firme, e exige acompanhamento diario. So para quem olha ao mercado todos os dias.
- **PHAG (prata)** — redundante com a posicao de ouro num orcamento pequeno; correlacao alta.
- **Qualquer pick `especulativo`** — ver scorecard.

## Calendario das proximas semanas (vigiar, nao comprar ja)

- 2026-06-17 — FOMC (afeta 4GLD)
- 2026-06-19 — USDA Cattle on Feed (CATL)
- 2026-06-30 — USDA Acreage Report (CORN/WEAT)
- 2026-07-10 — WASDE (gatilho de saida do WEAT)
- 2026-08-12 — Resultados K+S

## Proxima sintese

Sabado: correr `prompts/_reavaliacao-teses.md` sobre as 21 teses abertas + re-correr
`bun run scripts/scorecard.ts` + actualizar esta buy-list.
