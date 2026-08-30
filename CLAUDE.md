# CLAUDE.md — Investment Research Scanner

Le este ficheiro antes de fazer qualquer coisa.

---

## O que e este sistema

Scanner de oportunidades de investimento organizado em 7 temas. Gera listas curadas de **instrumentos compraveis HOJE no CTO Trade Republic a partir de Franca**, com €100/mes de aporte, potencial de retorno assimetrico e **via de compra real** (direto ou proxy cotado), em formato JSON estruturado.

**Perfil do investidor** (ver `prompts/_regra-acessibilidade-rigor.md` para a regra completa):
- Franca · **€100/mes** · CTO Trade Republic (fracionado desde €1)
- PEA aberto so para antiguidade fiscal — elegibilidade PEA e informacao util, nao destino
- **So cotadas.** Sem pre-IPO, sem privadas, sem tokens cripto, sem CFDs
- A €100/mes compra-se **1-2 posicoes por mes** → o scan e um funil, nao uma lista de compras

---

## Carteira (`PORTFOLIO.md`)

Alocacao alvo por tema + posicoes reais + regra de decisao mensal. **E a fonte de verdade
para "o que compro este mes"** — mas as posicoes escrevem-se **no dashboard**, e a rotina
copia-as para aqui (ver ADR-1 mais abaixo). O scan diario e o dashboard leem este ficheiro.

Regra: comprar no tema com maior `gap = alvo - peso_atual`; dentro do tema, ordenar por
score → urgencia de catalisador → ausencia de flag. Pesos por valor de mercado, nao custo.

---

## Categorias

| # | Categoria | Prefixo ID | Prompt |
|---|-----------|------------|--------|
| 1 | Longevidade & Saude | LSA- | prompts/01-longevidade.md |
| 2 | Trading & Mercados | TRD- | prompts/02-trading.md |
| 3 | Materiais & Energia | MAT- | prompts/03-materiais.md |
| ~~4~~ | ~~Economia & Macro~~ — retirada (macro acessivel dobra para Materiais/Trading) | — | — |
| 5 | Geopolitica & Defesa | GEO- | prompts/05-geopolitica.md |
| 6 | IA & Computacao | AIC- | prompts/06-ia-computacao.md |
| 7 | Espaco & Deep Tech | SDT- | prompts/07-espaco-deeptech.md |
| 8 | Financas Alternativas | FIN- | prompts/08-financas-alt.md |
| 9 | Agregacao | — | prompts/09-agregacao.md |
| 10 | **Tese profunda** (sabado) | — | prompts/10-tese-profunda.md |
| 11 | **News** (diaria) | — | prompts/11-news.md |
| 12 | **Sintese semanal** (sabado) | — | prompts/12-sintese-semanal.md |

---

## Como correr um scan

O utilizador diz algo como:
- "corre o scan de Longevidade"
- "scan categoria 3"
- "scan todas"

### Workflow por categoria:

1. Le o prompt correspondente em `prompts/`
2. Usa **WebSearch** para verificar dados de cada entidade (catalisadores, IPOs, contratos, funding, tickers), **seguindo `prompts/_metodologia-pesquisa.md`** (fontes primarias, bloquear listicles, triangular, bear-case, contrarian)
3. Gera o JSON seguindo o schema abaixo
4. Guarda em `output/YYYY-MM-DD_nome-categoria.json`
5. Corre o validador: `bun run scripts/validate.ts output/ficheiro.json`

### Agregacao:

A agregacao e feita **ao vivo pelo dashboard** (carrega varios JSONs e cruza-os). **Nao gerar** `_agregado.json` — e dado duplicado.

---

## Schema JSON (essencial — acessivel + grounded)

Cada ficheiro de output segue esta estrutura:

```json
{
  "category": "Nome da Categoria",
  "scan_date": "YYYY-MM-DD",
  "entities": [
    {
      "id": "PRE-001",
      "name": "Nome da Entidade",
      "description": "Descricao curta, 1-2 linhas",
      "subcategory": "Sub-area especifica",
      "status": "cotada | ETP",
      "ticker": "ticker COMPRAVEL (o do proxy se houver proxy) | null",
      "geography": "Pais sede + bolsa se cotada",
      "market_cap_or_valuation": "~$2B | Serie C $400M",
      "liquidity": "alta | media | baixa | sem mercado",
      "risk_level": "baixo | moderado | alto | especulativo",
      "opportunity_type": "acao cotada | ETP cotado | exposicao indireta",
      "catalyst": "Evento especifico com data se possivel",
      "catalyst_date": "YYYY-MM-DD | Q2 2026 | null",
      "asymmetry_score": 4,
      "return_horizon": "curto (0-12m) | medio (1-3a) | longo (3+a)",
      "red_flags": "Risco principal ou null",
      "source": "URL real e datada (filing/noticia) — sem placeholders",
      "account": "cto | cto-pea | verificar",
      "proxy_for": "subjacente inacessivel que o ticker replica | null",
      "entry_min": "~€10 (fracionado)",
      "why_now": "porque existe e porque ainda nao esta no preco",
      "confidence": "verificado | parcial | especulativo",
      "access_note": "a pega (UCITS, app, CFD-so-catalisador) | null"
    }
  ],
  "category_summary": {
    "top5_asymmetry": ["id1", "id2", "id3", "id4", "id5"],
    "top3_contrarian": ["id1", "id2", "id3"],
    "systemic_risks": ["risco1", "risco2", "risco3"]
  },
  "_meta": {
    "total_entities": 0,
    "schema_version": "2.0",
    "category": "Nome da Categoria"
  }
}
```

---

## Regras criticas

1. **~12-15 instrumentos ACESSIVEIS por tema** — poucos e de alta conviccao (nao 30-50)
2. **Prefere omitir a inventar** — se nao conseguires verificar pelo menos 8 campos, nao incluas a entidade
3. **Usa WebSearch** para verificar dados: tickers, valuations, catalisadores, datas
4. **asymmetry_score** deve ser entre 1 e 5 (5 = maxima assimetria risco/retorno)
5. **`_meta.total_entities`** deve corresponder ao comprimento real do array `entities`
6. **IDs sequenciais** com o prefixo da categoria (LSA-001, LSA-002, ...)
7. **Naming do output**: `YYYY-MM-DD_nome-categoria.json` (ex: `2026-04-05_longevidade.json`)
8. **Comprável-hoje-primeiro**: nada entra se nao for compravel HOJE no CTO Trade Republic a partir de Franca — direto ou via proxy cotado NOMEADO. Sem via → omitir. Elimina pre-IPO, privadas, tokens cripto e CFDs. Ver `prompts/_regra-acessibilidade-rigor.md`.
9. **Rotear `account`** (`cto` / `cto-pea` / `verificar`); `ticker` = o que se escreve no Trade Republic (o do proxy se houver proxy). Praca fora de NYSE/Nasdaq/Xetra/Euronext → `verificar` + explicar em `access_note`.
10. **Catalisador datavel quase-obrigatorio**; sem `catalyst_date`, so com conviccao muito alta.
11. **Grounded**: cada entidade traz `why_now` (porque ainda nao esta no preco) e `confidence`; `source` real e datada. Sem `why_now` solido → omitir.
12. **Sem agregado**: a agregacao e feita ao vivo pelo dashboard; nao gerar `_agregado.json`.
13. **Metodologia de pesquisa (anti-bias)**: aplica `prompts/_metodologia-pesquisa.md` — fonte-primaria-primeiro, bloquear ruido SEO (`blocked_domains`), triangular, procurar a tese contraria (bear case) e angulos sub-cobertos/contrarian, e eventos futuros + presentes + historicos.

---

## A rotina — ordem fixa, todos os dias

A carteira vive **na pagina publicada** (o utilizador escreve la) e a analise vive **no repo**.
A rotina reconcilia os dois, por esta ordem. Saltar o passo 1 apaga o que o utilizador escreveu.

**1. Ler a pagina viva.** Ferramenta Artifact, `action: "read"`, `url:` = conteudo de
`.artifact-url`. O resultado vem num ficheiro local; guarda o caminho.

**2. Trazer as posicoes para o repo.**
```bash
bun run scripts/merge-artifact-state.ts <ficheiro-lido.html>
```
Le `#portfolio-state` e reescreve a tabela Posicoes de `PORTFOLIO.md`. **Nunca falha a
rotina:** se nao conseguir ler a pagina, diz porque e deixa tudo como estava. Le o output —
ele diz o que mudou, o que a pagina ganhou, e o que recusou fazer.

**3. Capturar precos.**
```bash
bun run scripts/capture-prices.ts --tickers      # quem precisa de preco hoje
```
Para cada um, WebFetch de **fonte citavel com hora de fecho**. Depois:
```bash
echo '{"prices":{"LEU":{"price":187.63,"currency":"USD","asof":"2026-08-26",
  "source":"https://..."}},"bench":{"spy":766.08,"usd_per_eur":1.1669}}'   | bun run scripts/capture-prices.ts --date 2026-08-26
```
Cotacao sem `source` e sem `asof` **e recusada** e o preco anterior fica (marcado stale no
dashboard). Sem fonte fiavel, nao se escreve nada — nunca se estima.

**4. Escrever a analise do dia.** `DELTA.md` sempre; `NEWS.md` (prompt 11) sempre; ao
**sabado** tambem `output/YYYY-MM-DD_tese-profunda.md` (prompt 10) e a sintese semanal.

**5. Validar e construir.**
```bash
bun test                                  # tem de estar verde antes de publicar
bun run scripts/build-dashboard.ts
```
`bun test` inclui 20 verificacoes num browser a serio (`scripts/page-checks.mjs`) e o lint de
honestidade sobre a tese e as noticias.

**6. Commit.**
```bash
git add -A && git commit -m "..." && git push origin HEAD
```

**7. Republicar.** Ferramenta Artifact com `file_path: dashboard.html` **e** `url:` = conteudo
de `.artifact-url`. Sem esse `url` cria um link novo em vez de actualizar o que o utilizador
tem aberto — e o erro que estraga a rotina. **Nao passar `capabilities`**: a declaracao
(`artifact`) ja esta guardada e e transportada; passa-la de novo so e preciso para a mudar.

**Passar sempre `contract: 'latest'`** — decisao do utilizador (2026-08-30): a pagina anda
sempre na versao mais recente do runtime. Se alguma vez uma actualizacao do contrato partir
alguma coisa, diz-lho em vez de voltares a fixar a versao por tua conta.

`dashboard.html` e **gerado, nunca editado a mao**. Template em `scripts/dashboard-template.html`.

---

## Como a carteira e a pagina se reconciliam (ADR-1)

- A tabela Posicoes de `PORTFOLIO.md` tem uma coluna `ID` (uuid por linha). **Nao a apagar** —
  e o que liga cada linha a pagina depois de reordenar, editar ou apagar.
- A pagina embute o mesmo estado em `<script id="portfolio-state">`. Nao renomear esse id.
- **Nas posicoes a pagina ganha** (e onde o utilizador escreve). **Na analise o repo ganha
  sempre** — tese, noticias, buy-list e alvos nunca sao editados pela pagina.
- Duas travas por cima disso, em `scripts/portfolio-state.ts`: state ilegivel nao mexe em nada,
  e um wipe total (pagina com 0 posicoes, repo com posicoes) nao passa pela rotina. Esvaziar a
  carteira e um gesto deliberado em `PORTFOLIO.md`.

---

## Tese profunda — rotina de sabado

`prompts/10-tese-profunda.md` corre sobre **os nomes na carteira + o cabaz do mes + os
score-5 que ficaram de fora**, no maximo 6. Quatro lentes por nome: analogo historico datado,
o invisivel/2a ordem, under/over-value **como juizo e nunca alvo numerico**, e cenarios
bull/base/bear com gatilho datavel e probabilidade qualitativa.

Saida em `output/YYYY-MM-DD_tese-profunda.md`, no formato exacto que o prompt fixa — o build
parseia-o para o separador **Tese**. `bun test` faz lint ao ficheiro: lentes em falta,
veredicto fora das quatro palavras, cenario sem probabilidade qualitativa ou alvo de preco
fabricado fazem os testes falhar.

---

## News — rotina diaria

`prompts/12-sintese-semanal.md` fixa a forma da sintese de sabado — sem ela, cada semana
saia diferente e o build deitava fora metade. `prompts/11-news.md` corre depois do delta, janela de ~48h, sobre **a carteira + o cabaz do
mes + os alertas abertos**. E um digest curado: movimento de preco sem causa e do `DELTA.md`,
nota de analista nao entra, e um nome sem noticia material **nao aparece**. Zero linhas e um
resultado valido — o ficheiro fecha sempre com `**Sem noticia material:**`, que e a prova de
que se olhou.

Saida: `NEWS.md` na raiz (sobrescrito). O build cruza cada ticker com `PORTFOLIO.md` e com o
cabaz e marca tres niveis — **afeta a tua carteira**, no cabaz, em vigilancia — que ordenam o
separador **Noticias**. `bun test` verifica que cada fonte e um link datado.

---

## Validacao

Apos gerar um JSON, corre:

```bash
bun run scripts/validate.ts output/FICHEIRO.json
```

Ou o utilizador pode dizer "valida o ultimo output".

---

## Comandos rapidos

- `/scan [categoria]` — corre scan de uma categoria
- `/scan todas` — corre os 7 temas sequencialmente
- `/valida [ficheiro]` — corre validacao
- `/agrega` — corre agregacao dos outputs do dia
