# Roadmap — Fechar o ciclo entre scanner e lucro real

**Data:** 2026-06-11
**Objectivo:** transformar o scanner (gerador de ideias) num sistema com feedback loop
mensuravel. Diagnostico que motivou isto: 10/153 nomes repetidos entre ciclos (churn de
teses), 61/75 sources sem URL, 1/75 entidades "verificado", catalyst_date nunca consumido,
zero registo de posicoes reais ou performance dos picks passados.

---

## P0 — Scorecard retrospectivo (mede o edge ANTES de escalar a maquina)

**Pergunta a responder:** os picks do scanner batem um ETF mundial?

- Script `scripts/scorecard.ts`: para cada output em `output/`, puxar preco do ticker na
  `scan_date` vs hoje (fonte gratis: stooq.com CSV, ex. `https://stooq.com/q/d/l/?s=coin.us&i=d`).
- Calcular retorno por entidade, por tema, por `asymmetry_score` e por `confidence`.
- Benchmark: IWDA/VWCE no mesmo periodo.
- Output: `output/YYYY-MM-DD_scorecard.md` com tabela + conclusao.
- **Criterio de decisao:** se score 5 nao performa melhor que score 3, rever o criterio
  de assimetria antes de fazer mais scans.

## P1 — Ciclo de vida de teses (matar o churn)

- Ficheiro persistente `theses/watchlist.json`: id, nome, ticker, data de entrada,
  tese (1 linha), catalisador + data, **criterio de invalidacao explicito**, estado
  (`aberta | confirmada | enfraquecida | invalidada | catalisador-passou`).
- **Cada scan comeca por re-avaliar as teses abertas** (o que aconteceu desde a ultima vez?)
  e so depois propoe nomes novos. Nomes que desaparecem têm de ter motivo registado.

## P2 — Portfolio real (`portfolio.json`)

- Editado a mao: ticker, data, preco de entrada, valor €, tese associada (id da watchlist),
  criterio de saida.
- Dashboard ganha vista P&L real (preco actual vs entrada) ao lado da buy-list.
- E o que permite aprender: os erros sao de seleccao ou de timing?

## P3 — Calendario de catalisadores

- Vista no dashboard ordenada por `catalyst_date` (dados ja existem em 100% das entidades).
- Digest semanal: "esta semana acontece X no nome Y" para posicoes + watchlist.
- E aqui que CFDs tacticos (vantage-cfd) fazem sentido: entrada datada, saida datada.

## P4 — Concentracao em vez de cobertura

- Com €10-100/posicao, 75 nomes e incoerente: o produto final de cada ciclo passa a ser
  uma **buy-list de 3-5 nomes** com sizing sugerido; o resto e watchlist.
- A sintese semanal (spec 2026-06-06) e o sitio certo para esta destilacao — automatizar
  a sintese semanal ANTES do scan diario (o diario gera ruido a este orcamento).

## Feito neste ciclo (2026-06-11)

- [x] Categoria 10 — Commodities & Economia Real (`prompts/10-commodities.md`, prefixo COM-):
  ouro, petroleo, cereais, proteina/ovos, frete — com routing ETC UCITS / acoes / CFD
  e aviso de contango.
- [x] Validador apertado: `source` sem URL = ERRO (regra 11); `especulativo` no
  top5_asymmetry = WARN. **Nota:** outputs de 2026-06-03 falham agora a validacao de
  source — e intencional; proximo scan tem de trazer URLs reais.
- [x] **P0** — `scripts/scorecard.ts` + primeiro relatorio (`output/2026-06-11_scorecard.md`).
  Findings: especulativo = 0% positivos; score 4-5 anti-sinal vs score 3.
- [x] **P1** — `theses/watchlist.json` (21 teses semeadas) + `prompts/_reavaliacao-teses.md`.
- [x] **P2** — `portfolio.json` (template; preencher a mao apos cada compra real).
- [x] **P3** — calendario de catalisadores no dashboard (botao "Calendario").
- [x] **P4** — primeira sintese semanal com buy-list 3-4 (`output/2026-06-11_sintese-semanal.md`).
- [x] Recalibracao do asymmetry_score na metodologia (seccao 8) com base no scorecard.

## Rotina operacional (a partir de agora)

- **Sabado (sintese semanal):** 1) `_reavaliacao-teses.md` sobre as teses abertas →
  2) `bun run scripts/scorecard.ts` → 3) scans dos temas com catalisadores na semana seguinte
  (agente sequencial, 1 por tema) → 4) actualizar a sintese semanal (buy-list 3-5 + calendario).
- **Apos cada compra/venda real:** actualizar `portfolio.json` na hora.
- **Scans diarios:** NAO — ruido a este orcamento. So scan extraordinario com evento macro grande.

## Ordem de execucao sugerida

1. P0 scorecard (uma tarde; responde a pergunta existencial)
2. Scan piloto da categoria 10 (commodities) com o validador novo
3. P1 watchlist + P2 portfolio (estruturas simples, valor imediato)
4. P3 calendario no dashboard
5. So depois: automacao cloud (sintese semanal primeiro, diario depois)
