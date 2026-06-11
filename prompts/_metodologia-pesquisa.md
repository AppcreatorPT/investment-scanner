# Metodologia de Pesquisa — Anti-bias & Curiosidade

> Fonte unica. Aplicar SEMPRE em todos os scans (manuais e agendados), antes e durante o WebSearch.
> Objetivo: fugir ao consenso/ruido e trazer ideias diferentes mas solidas ("market-accepted").

## 1. Fonte-primaria-primeiro
Prioriza, por esta ordem: filings (SEC EDGAR, filings UE), paginas de IR / press releases da
empresa, reguladores (FDA/EMA/ESA), bolsas, bancos centrais. Artigos/analises so para contexto.
O campo `source` deve apontar a primaria sempre que possivel.

## 2. Bloquear ruido SEO (listicles promocionais)
Nas chamadas WebSearch, usa `blocked_domains` para os sites de listas "best stocks to buy":
`heygotrade.com`, `exoswan.com`, `247wallst.com`, `stocktitan.net`, `gainify.io`,
`intellectia.ai`, `investingengineer.com`, `marketshost.com`, `bingx.com`, `tickeron.com`,
`sahmcapital.com` (lista extensivel). Se uma afirmacao SO aparece nestes → trata como rumor →
`confidence: especulativo`.

## 3. Triangular
>=2 fontes INDEPENDENTES por afirmacao-chave (numero, catalisador, data). Uma so fonte (e nao
primaria) → baixa a `confidence`. Cuidado com fontes circulares (que se citam umas as outras).

## 4. Anti-confirmacao (procura DELIBERADA da tese contraria)
Por cada candidato forte, corre uma query do bear case:
`"<nome> short thesis / risks / overvalued / why it could fail / bear case"`.
Reflete o que encontrares em `red_flags` e tempera o `why_now`. Se o bear case for forte e sem
resposta → omitir ou baixar o `asymmetry_score`.

## 5. Curiosidade / contrarian (o sub-coberto)
Inclui queries para o que NAO esta no consenso:
`"overlooked / underfollowed / out of favor / contrarian / forgotten <tema>"`,
`"<tema> small cap under the radar"`, `"<tese> what the market is missing"`.
Meta: >=1-2 nomes por tema que NAO apareceriam numa lista mainstream (mas com fundamento real).

## 6. Eventos: futuro + presente + historico
Para os top candidatos, pesquisa as tres janelas:
- **Futuro:** catalisadores datados (proximos 0-18 meses).
- **Presente:** o que esta a acontecer agora (ultimas semanas).
- **Historico:** analogos passados (como catalisadores/situacoes semelhantes correram) para
  calibrar expectativas e detetar padroes.

## 7. Higiene de vies
- Evita recencia/popularidade: o que ja subiu muito pode estar no preco → nota em `red_flags`.
- Distingue facto (com fonte) de narrativa (opiniao).
- Na duvida entre incluir um nome ruidoso e omitir → **omitir** (a regra "prefere omitir a inventar").

## 8. Disciplina do asymmetry_score (calibrado pelo scorecard 2026-06-11)

O scorecard retrospectivo mostrou que scores 4-5 performaram PIOR que score 3
(mediana -7,0% vs -0,1%) — o score estava a premiar "historia excitante", nao assimetria real.
Regras:
- **Score 4-5 exige quantificacao**: estimar downside maximo plausivel E upside plausivel
  com numeros (valuation floor, cash em balanco, comparaveis, payoff do catalisador).
  Sem numeros → maximo score 3.
- Assimetria = downside LIMITADO por algo concreto + upside multiplo. "Pode 10x" sem
  floor identificado nao e assimetria, e lotaria.
- `confidence: especulativo` nunca leva score >3 (no scorecard, especulativos tiveram
  0% de retornos positivos).
- Apos cada scorecard, reler esta regra e ajusta-la ao que os dados mostrarem.
