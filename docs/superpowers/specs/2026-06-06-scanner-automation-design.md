# Spec — Scanner Automation + Sintese Semanal (Caminho A: cloud + GitHub)

**Data:** 2026-06-06
**Estado:** Design aprovado em brainstorming; implementacao ADIADA ate ao reset do limite de sessao do utilizador.
**Projeto:** Investment Research Scanner (`Search`)

---

## Context

O scanner (Caminho B) esta completo: 7 temas scaneados (75 instrumentos), dashboard buy-list, validador com testes. O utilizador quer agora:
1. **Fugir ao bias/ruido** das web searches e ser mais **criativo/curioso** (resultados diferentes mas "market-accepted").
2. **Automatizar scans diarios** (cloud, de manha — ele esta fora das manhas ate ~17h) para terem resultados "ready to analyse".
3. **Sintese semanal profunda ao sabado** (agregacao + auditoria + eventos reais).
4. `scan_invest` mais pratico.

Restricoes-chave: a conta **bate em limites de sessao em rajadas** (os agentes paralelos falharam; o inline sequencial funcionou) → design tem de ser **resiliente/sequencial**. O repo `Search` e **local** → cloud exige **GitHub** (setup unico, login do utilizador). Decisao: **Caminho A (cloud + GitHub)**.

## Decomposicao e ordem de construcao

**(1) primeiro · (2) depois · (3) por fim.** Cada um pode ser uma fase; um unico spec cobre os tres.

### (1) O cerebro — Metodologia anti-bias & curiosidade  *(barato, sem infra, valor imediato)*
Novo ficheiro `prompts/_metodologia-pesquisa.md`, **injetado em todos os 7 prompts** e referido no `CLAUDE.md`. Protocolo:
- **Fonte-primaria-primeiro:** SEC EDGAR, IR das empresas, reguladores (FDA/EMA/ESA), filings de bolsa, bancos centrais — acima de artigos.
- **Bloquear ruido SEO:** usar `blocked_domains` na WebSearch para listicles promocionais (lista inicial: `heygotrade.com`, `exoswan.com`, `247wallst.com`, `stocktitan.net`, `gainify.io`, `intellectia.ai` — extensivel). Se uma afirmacao so aparece em listicles → `confidence: especulativo`.
- **Triangular:** >=2 fontes independentes por afirmacao-chave.
- **Anti-confirmacao:** por cada tese, uma pesquisa DELIBERADA da tese contraria / bear case / "why X fails"; refletir em `red_flags`/`why_now`.
- **Curiosidade/contrarian:** queries para o sub-coberto ("overlooked", "out of favor", "contrarian", "underfollowed").
- **Eventos:** catalisadores futuros + **analogos historicos** (como eventos semelhantes correram).

**Aceitacao:** re-scan de 1 tema mostra >=1 nome contrarian/sub-coberto, fontes inclinadas a primarias, e bear-case explicito.

### (2) As pernas — Automacao cloud (GitHub + 2 rotinas)
- **Setup unico (utilizador autentica):** instalar `gh`; `gh auth login`; criar repo privado (ex.: `investment-scanner`); push do `Search` (master). `.gitignore` ja exclui node_modules/shots.
- **Rotina diaria (Seg-Sex, ~08:00 Europe/Paris):** scan **sequencial dos 7 temas** com a metodologia (1); valida cada; **commit por tema** (resiliente — se bater no limite, fica o feito e o run seguinte retoma).
- **Rotina de sabado (~09:00):** **sintese semanal** — agrega a semana (top global por asymmetry, buy-list cross-tema), **auditoria profunda** dos top (aperta a fontes primarias), **research de eventos** (calendario de catalisadores futuros/presentes + analogos historicos), gerando **prompts focados por tese automaticamente**. Output: `output/YYYY-MM-DD_sintese-semanal.md`.

**Gate de viabilidade:** antes de ligar os 7, **pilotar a rotina com 1 tema** e verificar que o ambiente da rotina consegue WebSearch + `bun` validar + commit. Se `bun` nao existir na cloud, fallback: self-check da forma do JSON.

### (3) As maos — `scan_invest` v2  *(launcher local)*
Menu novo: **Pull** (`git pull` dos scans da cloud) · **Scan do dia** (manual sequencial) · **Validar** · **Dashboard**. Remover restos antigos.

## Bandeiras honestas (incognitas)
1. Viabilidade da rotina cloud (WebSearch + bun + commit) — resolvida pelo piloto de 1 tema.
2. Limite de conta partilhado — mitigado por sequencial-com-commit-por-tema e retoma.
3. GitHub precisa do login do utilizador (uma vez).

## Fora de ambito
- Tracker de teses (fase C) com alertas Telegram.
- Servir o dashboard por URL/Worker (faixa separada).

## Verificacao (fim-a-fim)
1. (1) re-scan de 1 tema → fontes primarias, >=1 contrarian, bear-case presente; validador 0 erros.
2. (2) piloto da rotina num tema → commit no GitHub; utilizador da `git pull`; valida local.
3. Completo: uma semana de commits diarios + um `_sintese-semanal.md` ao sabado; dashboard mostra dados frescos apos pull.

## Retoma
Apos o reset do limite de sessao do utilizador: dizer **"retoma o scanner automation"**. Comecar pela peca (1) (cerebro), depois (2) com piloto, depois (3).
