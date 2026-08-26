# 11 — News (digest diario)

> Corre na **rotina diaria**, depois do delta. Le `_metodologia-pesquisa.md` primeiro.
> Isto e um **digest curado**, nao um agregador. Se nao houve noticia material, a
> resposta certa e "nao houve".

---

## O que e uma noticia que entra

Uma so pergunta decide: **isto muda alguma coisa para quem tem ou pondera ter este nome?**

Entra:
- Filing (8-K, 10-Q, 6-K, S-1, 424B), press release de IR, decisao de regulador.
- Contrato, adjudicacao, encomenda, ou a perda de um deles.
- Resultado clinico, aprovacao, hold, recall.
- Financiamento, emissao, recompra, insider Form 4 material.
- Mudanca de CEO/CFO, reestruturacao, corte de guidance.

**Nao entra:**
- Movimento de preco sem causa nomeada. Isso e o campo `Movimentos` do `DELTA.md`.
- Nota de analista, price target, upgrade/downgrade. Opiniao nao e facto.
- Listicles, "5 stocks to buy", agregadores de conteudo — usar `blocked_domains`.
- Repeticao de uma noticia ja no digest de ontem sem desenvolvimento novo.

Janela: **~48 horas**. Uma noticia mais velha so entra se ontem passou despercebida.

---

## Perimetro

Por esta ordem:
1. **Tudo o que esta na carteira** (`PORTFOLIO.md`) — o que se tem tem prioridade sobre o que se pondera.
2. **O cabaz do mes** — o que se vai comprar nas proximas semanas.
3. **Os alertas abertos do `DELTA.md`** — nomes com janela a fechar.
4. O resto da buy-list, se sobrar orcamento de pesquisa.

Um nome sem noticia material **nao aparece**. Zero linhas e um resultado valido.

---

## Cruzamento com a carteira

Uma noticia que toca um nome **que se tem** e diferente de uma que toca um candidato.
Marca-se com `**afeta**` no campo proprio. O dashboard destaca-a. Nao inflacionar: so
quando o ticker esta mesmo em `PORTFOLIO.md`.

---

## Rigor

- **Fonte primaria datada.** Link para o filing ou para o IR, nao para quem noticiou.
  Quando so ha cobertura secundaria, usar a mais proxima da fonte e baixar `confidence`.
- **Sem numeros sem fonte.** Vale aqui a mesma regra das licoes #15/#22/#23: um valor
  citado tem de vir do documento ligado.
- **Uma a duas linhas por nome.** O que aconteceu e porque importa. Sem adjectivos.

---

## Formato de saida (o build parseia isto)

Sobrescrever `NEWS.md` na raiz. Uma tabela, nada mais:

```markdown
# Noticias YYYY-MM-DD — digest curado, nao e conselho

**Janela:** ultimas 48h · **Perimetro:** carteira + cabaz do mes + alertas abertos

| Ticker | Nome | O que aconteceu | Porque importa | Fonte |
|--------|------|-----------------|----------------|-------|
| LEU | Centrus Energy | 8-K a fechar a tranche de $X | Financia Piketon sem diluir | [8-K 2026-08-25](https://sec.gov/...) |

**Afeta a carteira:** LEU, KTOS

**Sem noticia material:** RKLB, IONQ, PRME e mais 18 nomes da buy-list.

---

_Gerado pelo investment-scanner em YYYY-MM-DD. Nao e conselho de investimento._
```

- A coluna `Fonte` e um link markdown **com a data no texto**.
- `**Afeta a carteira:**` lista so tickers que estao em `PORTFOLIO.md`. Vazio → omitir a linha.
- `**Sem noticia material:**` fecha o digest — e a prova de que se olhou e nao se inventou.
