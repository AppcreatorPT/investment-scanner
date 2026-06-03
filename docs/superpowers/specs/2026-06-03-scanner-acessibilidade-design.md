# Spec — Reorientação do Scanner para Acessibilidade (Caminho B)

**Data:** 2026-06-03
**Estado:** Aprovado em brainstorming, a aguardar revisão do spec
**Projeto:** Investment Research Scanner (`Search`)

---

## 1. Contexto

O scanner gera listas de oportunidades de investimento em 8 categorias, em JSON, com um
`asymmetry_score` (1-5) que ordena por risco/retorno. Há um dashboard (`dashboard.html`)
para rever/filtrar/comparar e um validador (`scripts/validate.ts`).

O utilizador é um investidor **retail da UE (França), de orçamento muito baixo**
(~€10-100 por posição, frações essenciais). Compra via **neobroker fracionado**
(Trade Republic / Trading 212 / Revolut / Scalable) e tem conta **Vantage (CFD)**.
Ainda está a montar contas.

## 2. Problema

O scanner otimiza para **assimetria teórica**, mas a restrição que manda no utilizador é
**executabilidade**:

- Pre-IPOs exigem *accredited investor* ou mínimos altos → inacessíveis.
- IPOs raramente abrem ao retail ao preço de subscrição.
- ETFs domiciliados nos EUA estão bloqueados na UE (PRIIPs / sem KID).

Resultado: as ideias com maior score são, muitas vezes, as que o utilizador **não pode
comprar**. Metade do output não é acionável — e gasta tokens caros na geração.

A auditoria de dados confirmou o ruído: *Economia & Macro* é o tema mais fraco
(avg 2.58, quase sem `catalyst_date`); *Trading* tinha 30/32 entidades sem data de
catalisador; o `_agregado.json` é 170 KB de dados duplicados.

## 3. Objetivo

Reorientar o scanner para produzir **instrumentos que o utilizador consegue mesmo
comprar** — teses no molde *catalisador-conhecido → proxy cotado acessível → posicionar
cedo e segurar* (o padrão "GTA 6 sai daqui a 2-3 anos → comprar Take-Two/TTWO").

Poucas, acessíveis, alta convicção: **~12-15 instrumentos acessíveis por tema**, não 30-50
teóricos.

## 4. Não-objetivos (fora de âmbito desta iteração)

- Servir dados ao dashboard por URL/Worker (substituir o file-input). → faixa do `/schedule`.
- Tracker de teses pessoais com alertas Telegram/schedule. → fase C, depois.
- Re-correr o ciclo de scan incompleto de abril.
- Estratégia de opções/derivados (orçamento micro não justifica).

## 5. Desenho

### 5.1 Unidade de output

A unidade muda de *"entidade interessante"* para **"instrumento comprável"**. Quatro
princípios governam o que entra:

1. **Acessível-primeiro.** Uma tese boa mas inacessível só entra **através de um proxy
   cotado nomeado**; sem proxy → cai.
2. **Roteada para a conta certa:** 🟢 neobroker (comprar & segurar) · 🔵 Vantage CFD
   (catalisador curto — nunca segurar anos) · 🟠 exchange cripto · ⚪ conta-a-abrir.
3. **Catalisador datável quase-obrigatório** (sem `catalyst_date` → avisa/cai).
4. **Poucas e fortes** (~12-15 acessíveis por tema).
5. **Fundamentada, não palpite.** Cada ideia traz `why_now` (a vantagem) e `confidence`;
   `source` é real e datada. Facto (catalisador) separado de opinião (tese/score).

`asymmetry_score` continua a medir **só** assimetria. A acessibilidade é um **filtro**, não
entra no score.

### 5.2 Schema (6 campos novos + 1 mudança de semântica)

Acrescentar a cada entidade:

| Campo | Tipo | Significado |
|-------|------|-------------|
| `account` | enum | Conta do utilizador: `neobroker` · `vantage-cfd` · `cripto-exchange` · `abrir-conta` |
| `proxy_for` | string \| null | Se é proxy, o subjacente inacessível que replica; `null` = compra-se a própria tese |
| `entry_min` | string | Mínimo realista de entrada, ex. `~€10 (fracionado)` |
| `access_note` | string \| null | A pega: equivalente UCITS, app onde existe, "CFD só para o catalisador", etc. |

**Campos de rigor (escolha "Grounded"):**

| Campo | Tipo | Significado |
|-------|------|-------------|
| `why_now` | string | A vantagem: *porque existe esta oportunidade e porque ainda não está no preço?* Resposta fraca → cai. É o maior filtro de qualidade. |
| `confidence` | enum | Quão fundamentada está: `verificado` (afirmações-chave confirmadas com fonte) · `parcial` · `especulativo` (sobretudo inferência) |

**`source` mais exigente:** referência **real e datada** (URL de filing/notícia), não
placeholders tipo `"NCT0000000"`.

**Facto vs. opinião** explícito na estrutura: `catalyst` + `catalyst_date` + `source` =
**factos verificáveis**; `why_now` + `asymmetry_score` = **juízo do modelo**; `red_flags` =
**caso contrário**; `confidence` calibra a confiança de cada linha.

**Mudança de semântica:** `ticker` passa a ser **sempre o ticker comprável** (o do proxy
quando há proxy). `status` continua a descrever o *subjacente*. `opportunity_type` mantém-se.

Exemplos canónicos:

```jsonc
// DIRETO
{ "name": "Take-Two Interactive", "ticker": "TTWO", "status": "cotada",
  "account": "neobroker", "proxy_for": null, "entry_min": "~€10 (fracionado)",
  "catalyst": "Lançamento GTA 6", "catalyst_date": "Q3 2026",
  "why_now": "Consenso ainda subestima o ciclo de catálogo/receita pós-lançamento de GTA 6",
  "confidence": "parcial", "access_note": null, "asymmetry_score": 4 }

// PROXY (SpaceX privada → fundo cotado)
{ "name": "Exposição a SpaceX", "ticker": "DXYZ", "status": "privada",
  "account": "neobroker", "proxy_for": "SpaceX — Destiny Tech100 detém posição",
  "entry_min": "~€10 (fracionado)",
  "why_now": "Starlink a aproximar-se de IPO; poucas vias retail de exposição a SpaceX antes disso",
  "confidence": "especulativo",
  "access_note": "Fundo fechado NYSE; pode transacionar com prémio/desconto ao NAV",
  "asymmetry_score": 5 }
```

Garantia do schema: **nenhuma linha entra se não houver via real de compra** para um
retail UE de baixo orçamento.

### 5.3 Âmbito de geração

1. **Retirar "Economia & Macro" como tema isolado** (o mais fraco). As jogadas macro
   *acessíveis* (ETFs UCITS de taxas/commodities/FX) dobram para *Materiais & Energia* e
   *Trading*. → **7 temas**.
2. *Trading* não precisa de corte manual — a regra do catalisador datável poda-o sozinho.
3. **Alvo ~12-15 instrumentos acessíveis por tema.**
4. **Regra-mãe** injetada em todos os prompts: *nada entra se um retail UE de baixo
   orçamento não puder comprar — direto ou via proxy cotado nomeado.*
5. **Eliminar o `_agregado.json`** como ficheiro guardado; o dashboard agrega ao vivo.

### 5.4 Dashboard (alterações cirúrgicas — já é rico)

- **Vista por defeito "A minha buy-list":** cross-tema, score ≥4, com `account`,
  `entry_min` e `catalyst_date` à vista.
- **Coluna + filtro `account`** (ícone por conta).
- **Badge de proxy** na linha (`PROXY → SpaceX`) + coluna `entry_min`.
- **Painel de detalhe** ganha os 4 campos novos + linha "Como comprar".
- **Corrigir o resumo de categoria** para mostrar nomes em vez de IDs crus
  (`dashboard.html:961`).
- **Proteger contra o agregado** (evitar dupla-contagem se um ficheiro agregado for carregado).
- *Mecanismo de carregamento (file-input) fica como está* — fora de âmbito.

### 5.5 Validador & limpeza

- `scripts/validate.ts`: validar enum `account`; exigir `entry_min` e `why_now`; validar enum
  `confidence`; aceitar `proxy_for` e `access_note` nuláveis; **avisar quando falta
  `catalyst_date`**; **avisar quando `source` não parece referência real datada** (sem URL/data);
  ajustar thresholds de contagem (avisar `<8` ou `>30`); retirar `Economia & Macro` de
  `VALID_PREFIXES`.
- **Renomear `schema.json` → `example-output.json`** (é um exemplo, não um JSON Schema —
  nome enganador). Atualizar referências.
- **Atualizar `CLAUDE.md`:** campos novos, regra acessível-primeiro, catalisador-obrigatório,
  alvo ~12-15, 7 temas, roteamento de conta, fim do agregado. É o ficheiro que conduz os
  scans — tem de refletir tudo.
- Retirar `prompts/04-economia.md` da rotação (folder de Economia deixa de ser tema).

## 6. Ficheiros afetados

- `CLAUDE.md` (regras, tabela de categorias, schema)
- `prompts/01..08` — injetar regras de acessibilidade/proxy/catalisador **e de rigor**
  (`why_now`, `confidence`, `source` datada); `04-economia` retirado da rotação
- `prompts/09-agregacao.md` — deixar de gerar ficheiro; agregação passa a ser do dashboard
- `scripts/validate.ts`
- `dashboard.html`
- `schema.json` → `example-output.json`

## 7. Critérios de sucesso

1. Todo o instrumento no output é comprável por um retail UE de baixo orçamento (direto ou
   via proxy nomeado) — verificável: zero linhas sem `account` válido e sem via.
2. O dashboard abre numa **buy-list acionável** com conta, mínimo de entrada e catalisador
   visíveis.
3. Custo de tokens por scan materialmente menor (menos entidades, acessível-primeiro, sem
   agregado).
4. `validate.ts` passa no schema novo; avisa em falhas de acessibilidade/catalisador.
5. Um scan-piloto de **1 tema** (ex.: IA & Computação) produz ~12-15 instrumentos, todos
   com `account` e `entry_min`, ≥1 exemplo de `proxy_for`.
6. Cada instrumento traz `why_now` não-trivial e `confidence`; `source` é referência real
   datada (zero placeholders). Funil mais afiado — mas continua a ser ponto de partida para
   a tua due diligence, não alpha nem conselho.

## 8. Plano de validação

Antes de reescrever os 7 temas, fazer um **scan-piloto de 1 tema** com o schema novo e
correr o validador. Só depois alargar aos restantes. Isto limita o risco de tokens (a
preocupação central do utilizador) a um único tema enquanto se afina a regra de acessibilidade.
