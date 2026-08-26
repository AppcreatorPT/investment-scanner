# Spec — Dashboard v3: Carteira Viva + Tese Profunda + News

**Data:** 2026-08-26
**Estado:** Design para execucao por gauntlet loop (chat novo)
**Projeto:** Investment Research Scanner
**Le primeiro:** `CLAUDE.md`, `PORTFOLIO.md`, `scripts/build-dashboard.ts`,
`scripts/dashboard-template.html`, `prompts/_metodologia-pesquisa.md`, `TRACK_RECORD.md`

---

## Objetivo

Transformar o dashboard de "lista de candidatos" em **ferramenta de uso diario**:
1. **Carteira viva** — registar posicoes na propria pagina e ver profit/loss automatico.
2. **Tese profunda** — um agente "filosofo-economico-historiador" que mostra o invisivel:
   analogias historicas, efeitos de 2a ordem, under/over-value com juizo (nao numero falso).
3. **News** — digest diario por posicao/tema, ligado aos alertas do delta.
4. **Passe de UX/design** — pratico, acessivel, moderno, legivel em 2 min no telemovel.

Perfil inalterado: Franca, €100/mes repartidos por 4 linhas, CTO Trade Republic, so cotadas.

---

## Verdades duras (nao contornar — poupam ciclos ao loop)

1. **Sem precos ao vivo na pagina.** O CSP do artifact bloqueia qualquer fetch externo
   (nada de Yahoo/Finnhub/APIs). "P/L automatico" = P/L contra o **ultimo preco capturado
   pela rotina diaria**, atualizado 1x/dia. Para buy-and-hold de €100/mes e o correto.
   Real-time exigiria servidor + feed pago = FORA DE AMBITO. Nao tentar.

2. **O artifact PODE gravar-se a si proprio.** Capability `artifact` (contract 0.2.23):
   `capabilities: {artifact: {}}` → `const a = await claude.use("artifact")` →
   `await a.publish(htmlCompleto)`. Toda a state partilhada tem de ir **embutida como dados
   no HTML publicado**; nunca serializar o DOM vivo. Publicar so apos acao do utilizador,
   nunca no load. `conflict` e rotina (alguem publicou primeiro) — sem retry, a pagina
   recarrega para o vencedor. Ver skill `artifact-capabilities` e `0.2.23/artifact.d.ts`.

3. **Colisao de escritores — a decisao central.** As posicoes vivem na pagina (capability)
   E a rotina diaria reconstroi a pagina a partir de ficheiros. Um apaga o outro se
   ingenuo. **Solucao adotada (Model B'):** ver seccao Arquitetura. A rotina LE o artifact
   vivo antes de republicar, extrai as posicoes, escreve-as de volta ao `PORTFOLIO.md`,
   e so entao reconstroi. O repo espelha o que o utilizador escreveu na pagina.

4. **Honestidade sobre valor (regra do track record).** Lições #15/#22/#23: "preço est."
   sem fonte = inventado. O "under/over-value" e as previsoes sao **juizo qualitativo com
   analogia e racional explicito**, nunca um alvo numerico fabricado. Preco so com fonte
   primaria datada. Em duvida, subestimar.

---

## Arquitetura (Model B' — repo espelha a pagina)

```
                    ┌─────────────────────────────────────┐
   UTILIZADOR ──────► dashboard.html (artifact publicado)  │
   escreve posicao   │  - state de posicoes embutida        │
   na pagina         │  - a.publish() grava nova versao     │
                    └───────────────┬─────────────────────┘
                                    │  rotina LE o artifact (Artifact action:"read")
                                    ▼
   ROTINA (diaria/  ┌─────────────────────────────────────┐
   sabado)          │ 1. extrai posicoes do HTML vivo      │
                    │ 2. escreve-as em PORTFOLIO.md         │
                    │ 3. captura precos (WebSearch) →       │
                    │    output/prices.json                 │
                    │ 4. bun build-dashboard.ts (P/L + tese)│
                    │ 5. commit + republish (mesmo url)     │
                    └─────────────────────────────────────┘
```

**Porque B' e nao alternativas:**
- Model A (repo unica fonte, pagina so exporta ficheiro) — pediria commit manual a cada
  compra. Fricao demais para uso diario.
- Model C (posicoes so em localStorage) — perde-se ao limpar o browser E os agentes de
  analise nunca veem a carteira real. Inaceitavel: a tese profunda precisa de saber o que
  tens.
- B' da a UX "escreve na pagina" E mantem a carteira real no repo para os agentes. Custo:
  o passo de merge na rotina tem de ser cuidadoso (ver Riscos).

### Ficheiros novos
- `output/prices.json` — mapa `{ "TICKER": { price, currency, asof, source } }`, atualizado
  pela rotina diaria por WebSearch (so tickers que estao em PORTFOLIO.md + buy-list top).
  Fonte primaria; sem fonte fiavel → deixa o preco anterior e marca `stale: true`.
- `output/YYYY-MM-DD_tese-profunda.md` — saida do agente pensador (rotina de sabado).
- `NEWS.md` (raiz, sobrescrito) OU `output/YYYY-MM-DD_news.md` — digest diario.
- `prompts/10-tese-profunda.md` — persona + protocolo do pensador.
- `prompts/11-news.md` — protocolo do digest de noticias.

---

## Workstream 1 — Carteira viva + P/L

**Entrada de posicoes na pagina:**
- Tab Carteira ganha um form: ticker (autocomplete da buy-list), data, unidades, custo total €.
- Ao gravar: atualizar a state embutida, regenerar o documento, `a.publish()`.
- Editar/apagar linha existente. Confirmar antes de apagar.
- Se `claude.use("artifact")` devolver `null` (view sem permissao): modo so-leitura,
  esconder o form, cair para localStorage como conveniencia pessoal.

**Calculo P/L (contra `output/prices.json`, embutido no build):**
- Por posicao: custo, valor atual, P/L absoluto (€) e % , preco de entrada implicito.
- Topo da carteira: total investido, valor atual, P/L total € e %, **e vs SPY no mesmo
  periodo** (o track record ja usa SPY como benchmark — reutilizar).
- Custo medio quando ha varias compras do mesmo ticker (as linhas acumulam-se, ver
  PORTFOLIO.md).
- Preco `stale` → badge discreto "preco de DD-MM"; nunca esconder que esta desatualizado.

**Sinal visual:** P/L verde/vermelho e semantico (nao e o accent dourado). Seguir dataviz
skill para as cores e para qualquer sparkline (P/L ao longo do tempo, se houver historico).

**Grafico de valor da carteira ao longo do tempo:** opcional/fase 2 — precisa de historico
de snapshots. Se feito, guardar snapshots em `output/portfolio-history.json` (a rotina
diaria acrescenta uma linha `{date, invested, value}`).

---

## Workstream 2 — Tese Profunda (o pensador) ⭐

O pedido central: "um filosofo-economico-historiador para certas previsoes — como vai ser
afetado no futuro, o que esta under/over-value, o que aconteceu no passado em contextos
similares, ver o invisivel".

**Isto ja tem raizes** em `prompts/_metodologia-pesquisa.md` (bear case, contrarian,
analogos historicos). A tese profunda AMPLIFICA isso numa persona dedicada.

**`prompts/10-tese-profunda.md` — protocolo:**
- Corre na **rotina de sabado**, sobre os nomes que estao NA CARTEIRA + top-5 da buy-list
  (nao os 24 — profundidade, nao largura).
- Por nome, produz 4 lentes:
  1. **Analogo historico** — "quando aconteceu algo estruturalmente semelhante, como correu?"
     (ex.: ETF de Bitcoin 2023-24 como analogo do endorsement CFTC; AWS 2014-16 como
     analogo de hyperscaler capex). Data-lo e citar o desfecho.
  2. **O invisivel / 2a ordem** — quem lucra a jusante que o mercado nao esta a olhar;
     efeitos indiretos; o que falha se a tese estiver certa por razoes erradas.
  3. **Under/over-value (juizo, nao numero)** — barato/justo/caro com racional e um
     multiplo comparavel historico; SEM alvo de preco fabricado (regra do track record).
  4. **Cenarios futuros** — bull / base / bear em 1-3 anos, cada um com o gatilho que o
     ativa e a probabilidade qualitativa. Honesto sobre incerteza.
- Confianca por afirmacao (`verificado/parcial/especulativo`), fontes primarias datadas.
- Tom: perspicaz e cptico, nao promocional. "Specific beats clever."

**Saida:** `output/YYYY-MM-DD_tese-profunda.md`, renderizada num tab novo **"Tese"**.
O build parseia as 4 lentes por nome para cards legiveis.

**Guardrail:** isto e conteudo gerado offline na rotina — NAO inferencia ao vivo na pagina.
Se algum dia se quiser "pergunta ao vivo", so via capability `mcp` com conector do
utilizador (nenhum ligado hoje) — deixar fora deste spec.

---

## Workstream 3 — News diario

- `prompts/11-news.md`: na rotina diaria, WebSearch por noticia material (~48h) de cada
  posicao + top buy-list, aplicando `_metodologia-pesquisa.md` (fontes primarias,
  `blocked_domains` para listicles SEO).
- Saida curta: 1-2 linhas por nome com relevancia + link datado. Zero ruido.
- Renderizar em tab "Noticias"; e cruzar com os alertas do delta — uma noticia que toca
  uma POSICAO tua ganha destaque ("afeta a tua carteira").
- Nada de feed infinito; e um digest curado, nao um agregador.

---

## Workstream 4 — Passe de UX / design

Seguir `.impeccable.md` (refined dark, neutros quentes, accent dourado) e as skills
`artifact-design` + `dataviz`. Cobrir:
- **Resumo antes do detalhe:** P/L da carteira e "cabaz do mes" no topo; detalhe abaixo.
- **O que mudou desde a ultima visita** — timestamp em localStorage; realcar novidades.
- **Estado em forma, nao so numero** — pills de severidade, badges de catalisador iminente.
- **Mobile real:** as tabelas fazem scroll no seu container; nada empurra o body na horizontal.
- **Acessibilidade:** foco visivel, contraste nos dois temas, `prefers-reduced-motion`.
- Tabs finais provaveis: **Hoje · Carteira · Tese · Noticias · Buy-list · Semana**.

---

## Riscos (o loop tem de os tratar)

1. **Merge de posicoes (Model B').** A rotina tem de ler o artifact vivo com `action:"read"`
   (devolve HTML cru para artifact do proprio utilizador), extrair a state embutida com um
   marcador estavel (ex.: `<script id="portfolio-state" type="application/json">…</script>`),
   e reconciliar com PORTFOLIO.md. Definir quem ganha em conflito (regra: a state da pagina
   ganha para posicoes; o repo ganha para analise). Testar o caminho "utilizador editou
   entre dois builds".
2. **Precos errados/inventados.** So fonte primaria; `stale:true` em vez de adivinhar.
   Reutilizar as licoes do TRACK_RECORD.
3. **CSP / capability null.** Toda a chamada a `claude.use` pode devolver `null` — desenhar
   para a ausencia, sempre um fallback de leitura.
4. **Tamanho do artifact** (limite 16MB) — a tese profunda pode crescer; truncar/paginar.
5. **Nao regredir a rotina existente** — validador (`bun test`) verde; dashboard continua a
   construir mesmo com carteira vazia e sem prices.json.

---

## Decomposicao para o gauntlet loop

Podem correr em paralelo apos a decisao de arquitetura estar travada:

| # | Workstream | Depende de | Entregavel |
|---|-----------|-----------|-----------|
| 0 | Model B' + marcador de state | — | JA DECIDIDO em ADR-1 — implementar e testar, nao redesenhar |
| 1 | Carteira viva + P/L + prices.json | 0 | build + template + rotina de merge |
| 2 | Tese profunda (prompt + parse + tab) | — | prompts/10 + render |
| 3 | News (prompt + tab) | — | prompts/11 + render |
| 4 | UX/design pass | 1,2,3 | template polido, mobile, a11y |

Sugestao de agentes: um "arquiteto" fecha o #0; depois fan-out 1/2/3 em paralelo; um
"critico de honestidade" revê 2 contra as licoes do TRACK_RECORD; um "revisor de design"
faz o #4 com screenshots (playwright ja configurado — ver historico da sessao).

## ADR-1 — Contrato de merge das posicoes (PRE-DECIDIDO, nao debater)

O ponto de maior risco de perda de dados. Fica cravado; o loop implementa e testa, nao
redesenha.

**Marcador de state.** A pagina embute as posicoes num unico bloco com id estavel:
```html
<script id="portfolio-state" type="application/json">
{"schema":1,"updated":"<ISO>","positions":[
  {"id":"<uuid>","date":"YYYY-MM-DD","ticker":"LEU","name":"Centrus Energy",
   "theme":"Materiais & Energia","units":0.53,"cost_eur":30.00}
]}
</script>
```
- `id` por linha = uuid gerado no cliente (nao indice) — sobrevive a reordenacao/apagar.
- O build LE este bloco de PORTFOLIO.md e escreve-o na pagina; a pagina reescreve-o em
  `a.publish()`. Mesmo schema nos dois lados.

**Fluxo da rotina (ordem fixa):**
1. `Artifact action:"read"` do url em `.artifact-url` → HTML cru (artifact do proprio dono).
2. Extrair `#portfolio-state`. Se falhar (pagina antiga, sem bloco, read indisponivel) →
   **abortar o merge, usar PORTFOLIO.md como esta, logar aviso**. Nunca apagar posicoes por
   nao conseguir ler a pagina.
3. Reconciliar por `id`:
   - **Posicoes (units/cost/date/ticker): a PAGINA ganha.** E onde o utilizador escreve.
   - Escrever o resultado em PORTFOLIO.md (tabela Posicoes) preservando o `id`.
4. Capturar precos, `bun build`, commit, republish.

**Regra de ouro:** em qualquer duvida de leitura/parse, o merge e um NO-OP que preserva o
que existe. Perder uma edicao e mau; apagar a carteira e inaceitavel. Testar explicitamente:
(a) pagina sem bloco; (b) read devolve null; (c) JSON malformado; (d) mesmo id editado nos
dois lados desde o ultimo build.

**Analise (tese/news/buy-list/alvos): o REPO ganha sempre** — a pagina nunca os edita.

---

## Fora de ambito
- Precos real-time / feed pago / servidor proprio.
- Inferencia LLM ao vivo dentro da pagina (sem conector ligado).
- Ordens reais / integracao com corretora.
- Tokens cripto (fora do perimetro desde 2026-08-26).

## Verificacao fim-a-fim
1. Escrever uma posicao na pagina → persiste apos refresh → aparece em PORTFOLIO.md apos
   a rotina seguinte.
2. P/L bate certo contra prices.json; badge stale quando o preco e velho.
3. Tese profunda mostra 4 lentes por nome, com analogo historico datado e sem alvo numerico
   fabricado.
4. News curto, cruzado com posicoes. Dashboard verde em mobile e nos dois temas.
5. `bun test` verde; build funciona com carteira vazia.
