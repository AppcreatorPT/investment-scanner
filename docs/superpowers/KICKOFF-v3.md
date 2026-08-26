# Kickoff v3 — arrancar o gauntlet loop

## ONDE correr (importante)

Este projeto **nao e uma pasta no PC** — vive no GitHub em `AppcreatorPT/investment-scanner`
e corre pelo **Claude Code na web** (claude.ai/code), tal como o delta diario. NAO abrir
numa sessao local do Windows: essas estao noutras pastas (E:\Casa etc.) e nao tem este repo.

1. Ir a https://claude.ai/code
2. Abrir sessao nova para o repo **AppcreatorPT/investment-scanner**
3. Colar o prompt abaixo

---

## PROMPT (colar tal e qual)

```
Es o executor de uma nova fase do projeto "Investment Research Scanner".
Le este briefing todo antes de agir.

## O QUE E O PROJETO
Scanner de oportunidades de investimento para UM investidor: reside em Franca,
investe 100€/mes repartidos por ~4 linhas, conta CTO Trade Republic (fracionado
desde 1€), so instrumentos cotados (sem pre-IPO, privadas, tokens cripto, CFDs).
O sistema gera listas curadas de candidatos em 7 temas, uma carteira-alvo, e um
dashboard HTML publicado como Artifact que o utilizador abre todos os dias.

## O REPO (ja clonado, trabalha em master)
- CLAUDE.md ......... regras do projeto. LE PRIMEIRO. Inclui o passo "Dashboard"
                      (rebuild + commit + republicar) que corre no fim de tudo.
- PORTFOLIO.md ...... fonte de verdade da carteira: alocacao-alvo por tema,
                      posicoes reais, regra de decisao mensal (cabaz de 4 linhas).
- BUYLIST.md ........ candidatos score>=4 no perimetro + carry alerts + exclusoes.
- DELTA.md .......... monitorizacao diaria (sobrescrita). Alertas/movimentos.
- TRACK_RECORD.md ... picks datados vs SPY + LICOES (regras de honestidade).
- prompts/ .......... 01-08 temas, 09 agregacao, _metodologia-pesquisa.md (anti-bias,
                      fontes primarias, blocked_domains), _regra-acessibilidade-rigor.md.
- scripts/build-dashboard.ts ...... le os .md + output/*.json e emite dashboard.html.
- scripts/dashboard-template.html . fonte do dashboard (tabs Hoje/Carteira/Buy-list/Semana).
- scripts/validate.ts + .test.ts .. validador do schema (corre `bun test`).
- output/*.json ..... scans por tema e data. output/*_sintese-semanal.md ao sabado.
- .artifact-url ..... URL do artifact do dashboard (republicar SEMPRE neste url).
- docs/superpowers/specs/ ......... specs de design.

## A TUA TAREFA
Executar o spec: docs/superpowers/specs/2026-08-26-dashboard-v3-carteira-viva-tese-profunda.md
Le-o inteiro (inclui o ADR-1, que ja fixa o contrato de merge — implementa, nao redesenhes).
Resumo do que constroi:
 1. Carteira viva — registar posicoes NA PROPRIA pagina (capability `artifact`),
    P/L automatico contra precos capturados 1x/dia (output/prices.json).
 2. Tese profunda — agente "filosofo-economico-historiador": por nome, 4 lentes
    (analogo historico datado / o invisivel-2a ordem / under-over-value com juizo /
    cenarios bull-base-bear). Corre na rotina de sabado. E a joia do projeto.
 3. News — digest diario curto por posicao/tema, cruzado com os alertas.
 4. Passe de UX/design — pratico, mobile, acessivel, dois temas.

## VERDADES DURAS (nao contornar — estao no spec)
- SEM precos ao vivo: o CSP do Artifact bloqueia fetch externo. P/L e contra o
  ultimo preco diario. Real-time = fora de ambito, nao tentar.
- O Artifact PODE gravar-se (capability `artifact`, contract 0.2.23). Carrega a
  skill artifact-capabilities antes de escreveres codigo que chame claude.use.
- Merge das posicoes JA ESTA DECIDIDO no ADR-1 do spec — implementa e testa os
  casos de falha, NAO redesenhes. Regra de ouro: em duvida de leitura, no-op que
  preserva a carteira. Nunca apagar posicoes.
- Honestidade (licoes #15/#22/#23 do TRACK_RECORD): "preco est." sem fonte =
  inventado. Valuation e previsoes sao juizo com analogia, nunca alvo numerico
  fabricado. Fontes primarias datadas. Em duvida, subestimar.

## COMO TRABALHAR
- Carrega as skills: artifact-capabilities (antes de mexer em capabilities),
  artifact-design e dataviz (antes de mexer no template/graficos).
- Ordem recomendada: Tese profunda primeiro (valor alto, risco baixo), depois
  Carteira viva (o merge e o ponto sensivel), depois News e UX.
- No fim de CADA iteracao: `bun test` verde, `bun run scripts/build-dashboard.ts`,
  e o passo "Dashboard" do CLAUDE.md (rebuild + commit + republicar no url de
  .artifact-url — sem esse url cria um link novo e estraga o que o utilizador tem
  aberto). O dashboard tem de continuar a construir com carteira vazia.
- Screenshots de verificacao: playwright ja esta disponivel; o chromium esta em
  /opt/pw-browsers/chromium-1194/chrome-linux/chrome (passa executablePath).

Comeca por confirmar que leste CLAUDE.md e o spec, e propoe o plano de ataque
antes de escrever codigo.
```
