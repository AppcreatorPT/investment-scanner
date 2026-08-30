# 12 — Sintese semanal (sabado)

> Corre ao **sabado**, depois da tese profunda. Le `_metodologia-pesquisa.md` primeiro.
> Ate agora este ficheiro nao tinha protocolo e cada semana saia com uma forma diferente —
> o que fez com que metade dele nem aparecesse no dashboard. Isto fixa a forma.

Saida: `output/YYYY-MM-DD_sintese-semanal.md` (data do sabado).

---

## Em palavras simples (obrigatorio, e vem primeiro)

Uma seccao `## Em palavras simples` logo a seguir ao cabecalho. Quatro a seis pontos, cada
um em **linguagem que se percebe sem saber nada de bolsa**.

- Comeca pelo que **correu mal** — o mau tem prioridade sobre o bom.
- Um ponto para o **mercado em geral** (subiu, desceu, quanto).
- Um ponto para **erros nossos corrigidos**, se os houve. Nunca esconder.
- Um ponto para as **boas noticias**, com o nome de quem as teve.
- Fecha com **"O que fazer:"** — e quase sempre "nada de urgente"; se for, diz porque.

Regras: frases curtas; sem jargao; percentagens em vez de multiplos; **simplificar nao e
suavizar** — se a semana foi ma, o resumo simples diz que foi ma.

---

## Estrutura fixa

```markdown
# Sintese semanal YYYY-MM-DD — funil para a tua DD, nao e conselho

**SPY: $X (data) | ±Y% vs semana passada ($Z) | ±W% vs coorte Apr-05**

---

## Em palavras simples

- ...

---

## Carry-forward alerts

Uma linha de lista por nome com alerta aberto, comecada pelo ticker a bold.

---

## Eventos

### 1. TICKER — Titulo curto do que aconteceu (data)

**O que aconteceu:** os factos, com fonte.

**O que fazer agora:** a implicacao pratica, ou "nada".

**Analogo historico:** um caso datado com desfecho conhecido, e a confianca no analogo.

---

## Riscos sistemicos

Lista numerada. Cross-tema — coisas que afetam varios nomes ao mesmo tempo.

---

## O que mudou esta semana

| Ticker | Mudanca | Classificacao |
|--------|---------|---------------|

---

_Gerado automaticamente pelo investment-scanner em YYYY-MM-DD. Nao e conselho de investimento._
```

---

## O que o build faz com isto

- `## Em palavras simples` vai para o topo do separador **Semana**, em destaque.
- A linha do **SPY** vira a faixa de mercado.
- Cada `###` dentro de `## Eventos` vira um cartao que abre e fecha. Os campos sao lidos
  pelo **rotulo** (`**Qualquer coisa:**`), nao por uma lista fixa — podes acrescentar campos
  sem partir nada, mas mantem os tres acima como base.
- As outras seccoes aparecem por esta ordem: o que mudou, carry-forward, riscos, buy-list.
  Listas e tabelas sao renderizadas como listas e tabelas — escreve markdown a serio, nao
  texto corrido com tracinhos.

## Rigor

Vale tudo o que esta em `_metodologia-pesquisa.md` e as licoes #15/#22/#23 do
`TRACK_RECORD.md`: **preco so com fonte primaria datada**, nunca "$X est.". Se um preco da
semana anterior estava errado, a correccao e um ponto do "Em palavras simples" **e** uma
linha do "O que mudou".
