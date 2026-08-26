# Carteira — alocacao alvo e posicoes reais

> Fonte de verdade para a decisao mensal. O dashboard e o scan diario leem este ficheiro.
> **Nao e conselho de investimento.**

**Aporte:** €100/mes · **Linhas por mes:** 4 · **Conta:** CTO Trade Republic ·
**PEA:** aberto so para antiguidade fiscal

**Como executar:** preferir **planos de investimento programados** (€0 de comissao, minimo €1,
varios em paralelo). Ordem fracionada avulsa custa €1 de settlement — em 4 linhas sao €4/mes
= 4% do aporte, drag a serio. Se um nome nao for elegivel a plano programado, ou entra por
ordem avulsa consciente do custo, ou passa-se ao seguinte do mesmo tema.

---

## Alocacao alvo por tema

| Tema | Alvo | Porque este peso |
|------|------|------------------|
| Geopolitica & Defesa | **20%** | Hit-rate 4/4 na coorte Apr-05; backlogs multi-ano visiveis (Renk 5.3x TTM); rearmamento NATO e estrutural, nao ciclico. Varias sao UE → elegiveis a PEA no futuro |
| Materiais & Energia | **20%** | Ativos reais e defice estrutural de uranio; hit-rate 4/8. Aloja a unica score-5 do momento (LEU) |
| Espaco & Deep Tech | **15%** | Hit-rate 4/4 e o melhor pick de sempre (PL ~+288%), mas horizonte longo e resultados binarios — capar apesar do historico |
| IA & Computacao | **15%** | Sem historico proprio na coorte madura; beta alto e tema ja consensual — peso medio, nao de conviccao |
| Trading & Mercados | **15%** | Empresas que geram caixa hoje; serve de lastro aos temas binarios. O 0/1 da coorte Apr-05 e amostra nula, nao evidencia |
| Longevidade & Saude | **10%** | Hit-rate 2/6 e o EYPT provou -69% num dia. E onde vive a assimetria, mas tambem a ruina — capar com forca |
| Financas Alternativas | **5%** | Hit-rate 3/9, o mais volatil, e agora limitado a proxies cotados — peso residual |

**Leitura honesta destes numeros:** a coorte Apr-05 tem 139 dias e amostras pequenas
(Trading = 1 pick). Os pesos inclinam-se ±6pp face a equal-weight (14,3%), nao mais —
deliberadamente, para nao sobre-ajustar a um trimestre. Rever a alocacao a cada 6 meses,
nao a cada scan.

---

## Posicoes

| Data | Ticker | Nome | Tema | Unidades | Custo total (€) | Valor atual (€) |
|------|--------|------|------|----------|-----------------|-----------------|
| | | | | | | |

**Total investido:** €0

> Como atualizar: uma linha por compra. Se reforcares um nome, acrescenta nova linha em vez
> de editar a antiga — preserva o historico de custo medio.
>
> `Valor atual` e opcional. Enquanto estiver vazio, o dashboard calcula os pesos pelo custo;
> assim que o preencheres, passa a usar valor de mercado (que e o correto para rebalancear).

---

## Regra de decisao mensal

Os €100 dividem-se por **4 linhas**, nao numa so. Assim a carteira ganha largura desde o
inicio em vez de esperar meses por diversificacao.

1. Calcular o peso atual de cada tema: `valor_de_mercado[tema] / valor_total`
2. Calcular o desvio: `gap[tema] = alvo[tema] - atual[tema]`
3. Ordenar os temas por `gap` (empates desempatam pelo melhor score disponivel no tema)
4. Tomar os **4 temas com maior gap** que tenham candidato compravel
5. Repartir os €100 **proporcionalmente ao gap**, arredondado a €5, minimo €20 por linha
6. Dentro de cada tema, escolher da buy-list por **score** → depois ausencia de flag

Os temas rodam mes a mes: os que ficaram de fora sobem no ranking do gap e entram no mes
seguinte. Ao fim de ~6 meses os 7 temas estao cobertos e a carteira converge para o alvo.

**Peso usa valor de mercado, nao custo.** Um nome que dispare puxa o tema acima do alvo e
o aporte seguinte vai para outro lado — e o rebalanceamento a acontecer sozinho, sem vender.

**Nos primeiros ~12 meses o desvio nao significa muito** — com 1-3 posicoes qualquer peso
esta longe do alvo. Na pratica a regra funciona como uma sequencia: compra o tema mais
descoberto, mes apos mes, ate a carteira ganhar forma.

**Excecoes que travam a compra:**
- Nome com flag `INVALIDADO` → nunca
- Nome com flag ⚠️ de "nao aumentar" → saltar para o proximo do mesmo tema
- Nome com lockup de insiders por expirar (ex.: FRVO ate Nov 14 2026) → esperar
- Praca `verificar` nao confirmada no Trade Republic → saltar

---

## Disponibilidade por confirmar na app

Verificado em fonte publica que o Trade Republic **nao oferece a LSE** (nao opera no Reino
Unido) e que os planos programados sao gratuitos. O que so a app confirma:

| Nome | O que confirmar |
|------|-----------------|
| LEU | Cota em NYSE American, nao NYSE/Nasdaq — confirmar que esta sequer disponivel |
| Qualquer linha | Se e elegivel a **plano programado** (€0) ou so a ordem avulsa (€1) |

Marcar aqui os nomes que a app recusar, para o scan deixar de os propor:

**Indisponiveis:** _(nenhum confirmado ainda)_
