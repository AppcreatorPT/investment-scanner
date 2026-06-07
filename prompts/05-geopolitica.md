# Scan: Geopolitica & Defesa

**Prefixo ID:** GEO-
**Target:** ~12-15 instrumentos acessiveis (ver regra no fim)

---

## Instrucoes

Actua como analista de investimento especializado em defesa, seguranca e geopolitica. Gera uma lista curada de ~12-15 instrumentos ACESSIVEIS (ver "Regra de Acessibilidade & Rigor" no fim) com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir. **Aplica a metodologia anti-bias de `prompts/_metodologia-pesquisa.md`** (fontes primarias, bloquear listicles, bear-case, contrarian, eventos).

## Scope

Empresas de defesa tech (drones autonomos, C4ISR, cyber warfare, electronic warfare), empresas dual-use (civil + militar), inteligencia estrategica (OSINT, SIGINT, GEOINT), seguranca de infraestruturas criticas, empresas de border tech, space defense, empresas de municoes de nova geracao, analistas geopoliticos com track record, think tanks de defesa com influencia em procurement, PMCs (private military companies) cotadas ou com estruturas investiveis.

## Criterios de seleccao

- Prioriza small/mid-cap defense tech com contratos governamentais recentes ou em pipeline
- Exclui os mega-caps obvios (Lockheed Martin, Raytheon, BAE se no consenso total)
- Destaca catalisadores de curto prazo: contratos DOD/MOD/NATO, orcamentos de defesa em aprovacao, conflitos ativos a gerar procurement urgente, ITAR/export license approvals
- Inclui empresas europeias de defesa beneficiarias do rearmamento europeu
- Sinaliza entidades com backlog >3x receita anual (visibilidade de receita forte)
- Sinaliza red flags: dependencia de um unico contrato governamental, risco de cancelamento politico, ITAR/export restrictions, risco reputacional

## Priorizacao de horizonte

Prioriza curto prazo (0-12 meses) sempre que possivel.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_geopolitica.json`.

### Regras

- IDs: GEO-001, GEO-002, ...
- Campo "category": "Geopolitica & Defesa"
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
