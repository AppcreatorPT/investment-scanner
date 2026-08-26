# Regra de Acessibilidade & Rigor (Franca / €100 por mes)

> Fonte unica. Aplicar SEMPRE em todos os scans (injetada em cada prompt de tema).

## Perfil real do investidor

- Reside em **Franca**. Investe **€100 por mes**, todos os meses.
- Conta principal: **CTO Trade Republic** (fracionado desde €1, €1/ordem, sem direitos de guarda).
- Tem um **PEA aberto** so para antiguidade fiscal (nao investe la por agora, mas
  elegibilidade PEA e informacao util para o futuro).
- A €100/mes compra **1 a 2 posicoes por mes**. O scan e um funil, nao uma lista de compras.

## Filtro de compra (eliminatorio)

Toda a entidade DEVE ser compravel HOJE no CTO Trade Republic. Se falhar, **nao entra**:

- **Tem de estar cotada.** Sem pre-IPO, sem privadas, sem rondas de financiamento,
  sem SPACs por anunciar. Se a tese e inacessivel, so entra via **proxy cotado NOMEADO**
  (ex.: SpaceX → DXYZ). Sem proxy cotado → omitir.
- **Sem tokens cripto.** Exigem exchange separada e regime fiscal distinto — nao e uma
  broker. Exposicao ao tema so via **acoes cotadas** (ex.: GLXY) ou **ETP/ETN cotado**
  em Euronext/Xetra.
- **Sem CFDs.** Trade Republic nao os oferece e nao servem para comprar-e-segurar.
- **Praca elegivel:** NYSE, Nasdaq, Xetra, Euronext (Paris/Amesterdao/Bruxelas/Lisboa).
  Outras pracas (incl. **LSE**) → marcar `account: "verificar"` e explicar em `access_note`.
- **Fracionavel:** confirmar que o titulo aceita ordens fracionadas. Se o preco por acao
  for > €100 e NAO for fracionavel → omitir (inacessivel a €100/mes).
- **Liquidez minima:** sem micro-caps ilíquidas onde €100 mexe o spread. `liquidity: baixa`
  exige justificacao explicita em `red_flags`.

## Campos obrigatorios

- **`account`**: `cto` (default) · `cto-pea` (tambem elegivel a PEA — acoes UE/EEE) ·
  `verificar` (via por confirmar; dizer o que falta em `access_note`).
- **`ticker`** = exatamente o que se escreve no Trade Republic (o do proxy, se proxy).
- **`proxy_for`**: o subjacente inacessivel replicado, ou `null`.
- **`entry_min`**: minimo realista (ex.: `~€10 (fracionado)`).
- **`access_note`**: a pega (equivalente UCITS, praca a confirmar, ADR vs ordinaria) ou `null`.

## Rigor (anti-palpite)

- **`why_now`** (obrigatorio): porque existe a oportunidade e porque **ainda nao esta no
  preco**. Sem boa resposta → nao incluir.
- **`confidence`**: `verificado` / `parcial` / `especulativo`.
- **`source`**: referencia real e datada (URL de filing/noticia). Sem placeholders.
- **`catalyst_date`** datavel e quase-obrigatorio; sem data, so com conviccao muito alta.

Alvo: **~12-15 instrumentos acessiveis** de alta conviccao (nao 30-50).
