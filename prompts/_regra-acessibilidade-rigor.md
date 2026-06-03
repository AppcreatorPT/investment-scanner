# Regra de Acessibilidade & Rigor (UE / baixo orcamento)

> Fonte unica. Aplicar SEMPRE em todos os scans (injetada em cada prompt de tema).

Toda a entidade DEVE ser compravel por um retail da UE (Franca) com €10-100:

- **Acessivel-primeiro:** se a tese e inacessivel (pre-IPO, privada, ETF US sem KID), so
  entra atraves de um **proxy cotado NOMEADO** (ex.: SpaceX → DXYZ). Sem proxy → nao incluir.
- **`account`** (obrigatorio): `neobroker` (comprar & segurar) · `vantage-cfd` (catalisador
  curto, nunca segurar) · `cripto-exchange` (tokens) · `abrir-conta` (diz qual em `access_note`).
- **`ticker`** = o ticker que se escreve no broker para comprar (o do proxy, se proxy).
- **`proxy_for`**: o subjacente inacessivel replicado, ou `null`.
- **`entry_min`**: minimo realista (ex.: `~€10 (fracionado)`).
- **`access_note`**: a pega (equivalente UCITS, app, "CFD so p/ catalisador") ou `null`.

Rigor (anti-palpite):

- **`why_now`** (obrigatorio): porque existe a oportunidade e porque **ainda nao esta no
  preco**. Sem boa resposta → nao incluir.
- **`confidence`**: `verificado` / `parcial` / `especulativo`.
- **`source`**: referencia real e datada (URL de filing/noticia). Sem placeholders.
- **`catalyst_date`** datavel e quase-obrigatorio; sem data, so com conviccao muito alta.

Alvo: **~12-15 instrumentos acessiveis** de alta conviccao (nao 30-50).
