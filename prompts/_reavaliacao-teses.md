# Protocolo: Reavaliacao de Teses (correr ANTES de qualquer scan)

Objectivo: matar o churn. Uma tese so morre por motivo registado, nunca por esquecimento.

## Workflow

1. Le `theses/watchlist.json`.
2. Para cada tese com estado `aberta`:
   - WebSearch: o que aconteceu desde `last_review`? (catalisador, resultados, noticias primarias)
   - Atualiza o estado:
     - `confirmada` — a tese desenvolve-se como previsto; manter
     - `enfraquecida` — sinais contrarios mas nao fatais; registar porque
     - `invalidada` — criterio de invalidacao atingido; registar fonte
     - `catalisador-passou` — o evento ocorreu; registar o resultado (acertamos? falhamos? porque?)
   - Atualiza `last_review` (data de hoje) e acrescenta 1 linha a `history`.
3. So DEPOIS disto e que o scan propoe nomes novos.
4. Nomes novos com asymmetry_score >= 4 entram na watchlist com:
   - `invalidation` OBRIGATORIO: condicao objetiva e verificavel que mata a tese
     (ex: "se o contrato X nao for anunciado ate Q3 2026", "se quota de mercado cair abaixo de Y")
   - `state: "aberta"`, `entered`, `catalyst_date`
5. Teses `invalidada`/`catalisador-passou` ficam no ficheiro (sao o historico de aprendizagem
   que o scorecard cruza), apenas mudam de estado.

## Regra de ouro

Se um nome desaparece dos outputs sem entrada na watchlist a explicar porque,
o scan esta mal feito.
