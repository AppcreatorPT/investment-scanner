# Scan: Financas Alternativas

**Prefixo ID:** FIN-
**Target:** 30-50 entidades

---

## Instrucoes

Actua como analista de investimento especializado em financas descentralizadas e ativos digitais. Gera uma lista curada de 30 a 50 entidades com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir.

## Scope

DeFi institucional (protocolos com TVL significativo e auditorias), tokenizacao de ativos reais (RWA — real estate, treasuries, commodities, private credit), infrastructure cripto seria (L1/L2 chains com adocao real, bridges, oracles, MEV solutions), custodia institucional, compliance/RegTech cripto, stablecoins e CBDC infrastructure, exchanges reguladas emergentes, empresas de cripto data/analytics, mining operations eficientes, ETF issuers.

## Criterios de seleccao

- Prioriza protocolos e empresas com tracao real (revenue, TVL, active users) e nao apenas hype
- Exclui: Bitcoin, Ethereum, Solana (consensus, mas inclui projetos BUILD sobre eles)
- Destaca catalisadores de curto prazo: aprovacoes regulatorias (ETF filings, MiCA compliance), token unlocks, mainnet launches, partnerships institucionais, airdrops de protocolos com produto
- Inclui tokens negociaveis com liquidez >$1M diario
- Sinaliza protocolos onde insiders/VCs estao locked e unlock dates se aproximam (risco E oportunidade)
- Sinaliza red flags: tokenomics inflacionarios, team anonima sem accountability, smart contract nao auditado, concentracao de tokens >50% em poucos wallets, regulatory arbitrage fragil

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
