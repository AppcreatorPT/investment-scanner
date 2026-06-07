# Scan: Trading & Mercados

**Prefixo ID:** TRD-
**Target:** ~12-15 instrumentos acessiveis (ver regra no fim)

---

## Instrucoes

Actua como analista de investimento especializado em trading, market structure e fund management. Gera uma lista curada de ~12-15 instrumentos ACESSIVEIS (ver "Regra de Acessibilidade & Rigor" no fim) com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir. **Aplica a metodologia anti-bias de `prompts/_metodologia-pesquisa.md`** (fontes primarias, bloquear listicles, bear-case, contrarian, eventos).

## Scope

Traders independentes com track record verificavel, gestores de fundos (hedge funds, CTAs, macro funds), prop trading firms, quant shops, market makers com edge comprovado ou emergente, plataformas de trading tech, empresas de market data/infrastructure, exchanges emergentes, empresas de algo-trading, risk management tech, order flow analytics, plataformas de copy-trading institucional.

## Criterios de seleccao

- Prioriza entidades com baixa exposicao mediatica mas alta substancia (performance auditada, Sharpe >1.5, drawdown controlado)
- Exclui os nomes mainstream amplamente cobertos (ex: Citadel, Renaissance, Two Sigma se ja no consenso total)
- Destaca entidades com catalisadores de curto prazo: IPOs de exchanges ou fintechs, novos fundos a abrir, mudancas regulatorias favoraveis (ex: SEC, MiFID III), parcerias institucionais
- Sinaliza prop firms ou quant shops que estejam a expandir e a recrutar agressivamente (sinal de edge ativo)
- Sinaliza red flags: returns nao auditados, drawdowns escondidos, alavancagem excessiva, dependencia de um unico fator/estrategia

## Priorizacao de horizonte

Prioriza curto prazo (0-12 meses) sempre que possivel.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_trading.json`.

### Regras

- IDs: TRD-001, TRD-002, ...
- Campo "category": "Trading & Mercados"
- Todos os campos sao obrigatorios; usa null quando nao aplicavel
- source: deve ser verificavel
- `_meta.total_entities` deve corresponder ao comprimento real do array
- Nao incluas entidades sobre as quais nao consigas verificar pelo menos 8 campos
- **Prefere omitir a inventar**

---

<!-- Aplicar SEMPRE as regras abaixo (ver prompts/_regra-acessibilidade-rigor.md) -->

## Regra de Acessibilidade & Rigor (UE / baixo orcamento)

Toda a entidade DEVE ser compravel por um retail da UE (Franca) com €10-100:

- **Acessivel-primeiro:** se a tese e inacessivel (pre-IPO, privada, ETF US sem KID), so
  entra atraves de um **proxy cotado NOMEADO**. Sem proxy → nao incluir.
- **`account`** (obrigatorio): `neobroker` · `vantage-cfd` · `cripto-exchange` · `abrir-conta`.
- **`ticker`** = ticker compravel (o do proxy, se proxy). **`proxy_for`**: subjacente ou `null`.
- **`entry_min`**: minimo realista. **`access_note`**: a pega ou `null`.
- **`why_now`** (obrigatorio): porque ainda nao esta no preco. Sem boa resposta → omitir.
- **`confidence`**: `verificado`/`parcial`/`especulativo`. **`source`**: real e datada.
- **`catalyst_date`** quase-obrigatorio. Alvo: **~12-15 instrumentos acessiveis**.
