# Scan: Financas Alternativas

**Prefixo ID:** FIN-
**Target:** ~12-15 instrumentos acessiveis (ver regra no fim)

---

## Instrucoes

Actua como analista de investimento especializado em financas descentralizadas e ativos digitais. Gera uma lista curada de ~12-15 instrumentos ACESSIVEIS (ver "Regra de Acessibilidade & Rigor" no fim) com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir. **Aplica a metodologia anti-bias de `prompts/_metodologia-pesquisa.md`** (fontes primarias, bloquear listicles, bear-case, contrarian, eventos).

## Scope

Exposicao **cotada** a financas alternativas: empresas de asset management cripto,
exchanges e brokers cotados, custodia institucional, compliance/RegTech, emissores de
stablecoins e infraestrutura de pagamentos, empresas de cripto data/analytics, mining
operations eficientes, ETF/ETP issuers, e empresas de tokenizacao de ativos reais (RWA).

Tambem: **ETP/ETN cotados** em Euronext ou Xetra que dao exposicao a um protocolo ou
cabaz sem exigir exchange cripto.

## Criterios de seleccao

- **So instrumentos cotados.** Tokens comprados em exchange cripto NAO entram — exigem
  conta separada e regime fiscal distinto. Se a tese e um protocolo, entra apenas via
  **acao cotada** (ex.: GLXY, COIN) ou **ETP cotado NOMEADO** em Euronext/Xetra.
- Prioriza empresas com tracao real (revenue, AUM, active users) e nao apenas hype
- Quando uma tese de protocolo for forte, procura DELIBERADAMENTE o veiculo cotado que
  lhe da exposicao (treasury company, ETP, equity do emissor) e nomeia-o em `proxy_for`
- Destaca catalisadores de curto prazo: aprovacoes regulatorias (ETF/ETP filings, MiCA,
  CLARITY Act), earnings, listings, partnerships institucionais
- Sinaliza red flags: premio/desconto ao NAV em treasury companies, dilucao via ATM,
  dependencia de um so ativo subjacente, regulatory arbitrage fragil

## Priorizacao de horizonte

Prioriza curto prazo (0-12 meses) sempre que possivel.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_financas-alt.json`.

### Regras

- IDs: FIN-001, FIN-002, ...
- Campo "category": "Financas Alternativas"
- Todos os campos sao obrigatorios; usa null quando nao aplicavel
- `_meta.total_entities` deve corresponder ao comprimento real do array
- Nao incluas entidades sobre as quais nao consigas verificar pelo menos 8 campos
- **Prefere omitir a inventar**

---

<!-- Aplicar SEMPRE as regras abaixo (ver prompts/_regra-acessibilidade-rigor.md) -->

## Regra de Acessibilidade & Rigor (Franca / €100 por mes)

Toda a entidade DEVE ser compravel HOJE no **CTO Trade Republic** a partir de Franca:

- **So cotadas.** Sem pre-IPO, privadas, tokens cripto ou CFDs. Tese inacessivel so entra
  via **proxy cotado NOMEADO**. Sem proxy → nao incluir.
- **Praca elegivel:** NYSE, Nasdaq, Xetra, Euronext. Outra (incl. LSE) → `verificar`.
- **Fracionavel.** Se preco/acao > €100 e nao fracionavel → omitir.
- **`account`** (obrigatorio): `cto` (default) · `cto-pea` (acao UE, tambem elegivel a PEA) · `verificar` (praca por confirmar — dizer o que falta em `access_note`).
- **`ticker`** = ticker compravel (o do proxy, se proxy). **`proxy_for`**: subjacente ou `null`.
- **`entry_min`**: minimo realista. **`access_note`**: a pega ou `null`.
- **`why_now`** (obrigatorio): porque ainda nao esta no preco. Sem boa resposta → omitir.
- **`confidence`**: `verificado`/`parcial`/`especulativo`. **`source`**: real e datada.
- **`catalyst_date`** quase-obrigatorio. Alvo: **~12-15 instrumentos acessiveis**.
