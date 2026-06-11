# Scan: Commodities & Economia Real

**Prefixo ID:** COM-
**Target:** ~12-15 instrumentos acessiveis (ver regra no fim)

---

## Instrucoes

Actua como analista de commodities e economia real. Gera uma lista curada de ~12-15 instrumentos ACESSIVEIS (ver "Regra de Acessibilidade & Rigor" no fim) com exposicao a bens que impactam o dia a dia de forma global: energia, alimentacao, metais, frete.

Usa WebSearch para verificar cada entidade antes de a incluir. **Aplica a metodologia anti-bias de `prompts/_metodologia-pesquisa.md`** (fontes primarias, bloquear listicles, bear-case, contrarian, eventos).

## Scope

- **Metais preciosos:** ouro, prata (ETCs fisicos)
- **Energia:** petroleo (WTI/Brent), gas natural, refinacao, combustiveis
- **Cereais & agricolas:** trigo, milho, soja; softs (cafe, acucar, cacau)
- **Proteina animal:** gado, suinos, aves, **ovos** (nota: nao existem futuros de ovos — usar produtores cotados como proxy)
- **Transportes & frete:** contentores, dry bulk, tankers, logistica
- **Fertilizantes & agro-inputs** (impactam o preco da comida a montante)

## Vias de acesso (especificas desta categoria)

1. **ETCs UCITS** (LSE/Xetra, compraveis em neobroker UE) — exposicao directa ao preco:
   - Ouro fisico: Xetra-Gold `4GLD` (~1g ouro/unidade) ou EUWAX Gold II `EWG2`
   - Petroleo: WisdomTree WTI Crude Oil `CRUD`
   - Cereais: WisdomTree Wheat `WEAT`, Corn `CORN`, Grains `AIGG`, Agriculture `AIGA`
   - Gado: WisdomTree Live Cattle `CATL`
   - Verificar ticker/ISIN exacto no broker durante o scan (variam por bolsa de listing)
2. **Acoes de produtores/operadores** — para buy-and-hold (sem roll cost):
   - Energia: Galp, TotalEnergies, Shell; Frete: Maersk, Hapag-Lloyd, ZIM, Frontline, Golden Ocean
   - Proteina/ovos: Cal-Maine (CALM), Vital Farms (VITL), Tyson (TSN), JBS (NYSE)
   - Agro: Bunge, ADM, Nutrien, Yara, K+S
3. **CFDs (vantage-cfd)** — SO para jogadas tacticas curtas com catalisador datado
   (limites ESMA: alavancagem max 20:1 ouro, 10:1 outras commodities; custos overnight comem posicoes longas)

### AVISO ESTRUTURAL — roll cost / contango

ETCs de futuros (CRUD, WEAT, CORN, CATL) **sangram em contango** — NAO sao buy-and-hold.
Para horizonte `medio` ou `longo`, preferir acoes de produtores; ETCs de futuros so com
`return_horizon: curto (0-12m)` e catalisador datado. Excepcao: ouro fisico (4GLD/EWG2)
nao tem roll cost — pode ser hold. Refletir isto em `red_flags` e `access_note`.

## Criterios de seleccao

- Ao contrario dos outros temas, **large caps SAO admissiveis** aqui (a via acessivel a commodities passa por elas) — mas exigem `why_now` especifico (nao "e grande e segura")
- Catalisadores tipicos a pesquisar: reunioes OPEC+, relatorios WASDE (USDA), inventarios EIA, epoca de furacoes, gripe aviaria (ovos/aves), safras e El Nino/La Nina, indices de frete (BDI, SCFI), sancoes e rotas (Mar Vermelho, Panama), politica agricola UE/PAC
- Sinaliza red flags: contango estrutural, dependencia de um unico catalisador climatico, exposicao cambial USD, regulacao de precos (energia UE)

## Priorizacao de horizonte

Curto prazo (0-12m) para ETCs de futuros e CFDs; medio/longo so via acoes ou ouro fisico.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_commodities.json`.

### Regras

- IDs: COM-001, COM-002, ...
- Campo "category": "Commodities & Economia Real"
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
