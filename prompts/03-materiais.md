# Scan: Materiais & Energia

**Prefixo ID:** MAT-
**Target:** ~12-15 instrumentos acessiveis (ver regra no fim)

---

## Instrucoes

Actua como analista de investimento especializado em materiais avancados, energia e semicondutores. Gera uma lista curada de ~12-15 instrumentos ACESSIVEIS (ver "Regra de Acessibilidade & Rigor" no fim) com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir. **Aplica a metodologia anti-bias de `prompts/_metodologia-pesquisa.md`** (fontes primarias, bloquear listicles, bear-case, contrarian, eventos).

## Scope

Empresas de materiais avancados (grafeno, metamateriais, ceramicas avancadas), baterias de nova geracao (solid-state, sodium-ion, lithium-sulfur), fusao nuclear (magnetica e inercial), fissao de nova geracao (SMRs, molten salt), rare earth mining & processing, semicondutores (fabs, EDA tools, packaging avancado, fotonica), hidrogenio verde, carbon capture, geothermal avancado, advanced manufacturing.

## Criterios de seleccao

- Prioriza entidades com baixa exposicao mediatica mas tecnologia validada (patentes, contratos governamentais, pilot plants operacionais)
- Exclui entidades no S&P 500, Nasdaq 100 ou STOXX 600
- Destaca catalisadores de curto prazo: contratos DOE/DARPA, aprovacoes regulatorias para minas, commissioning de plantas piloto, government grants, CHIPS Act beneficiarios, EU Critical Raw Materials Act
- Sinaliza entidades com contratos take-or-pay ou offtake agreements assinados (de-risking significativo)
- Sinaliza red flags: technology risk nao mitigado, dependencia de subsidios >50% da receita, capex excessivo sem revenue visibility, jurisdicao politicamente instavel

## Priorizacao de horizonte

Prioriza curto prazo (0-12 meses) sempre que possivel.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_materiais.json`.

### Regras

- IDs: MAT-001, MAT-002, ...
- Campo "category": "Materiais & Energia"
- Todos os campos sao obrigatorios; usa null quando nao aplicavel
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
