# Scan: Espaco & Deep Tech

**Prefixo ID:** SDT-
**Target:** 30-50 entidades

---

## Instrucoes

Actua como analista de investimento especializado em space tech e deep tech. Gera uma lista curada de 30 a 50 entidades com elevado potencial de retorno financeiro.

Usa WebSearch para verificar cada entidade antes de a incluir.

## Scope

Empresas de lancamento (small launch, reusability), satelites (EO, communications, IoT), in-space manufacturing, space mining, space debris removal, propulsao avancada, empresas de ground segment, biotecnologia sintetica, advanced materials (nao cobertos na categoria Materiais), robotics avancada, drones autonomos (civil), brain-computer interfaces, haptics, lidar/sensor fusion, digital twins industriais, tecnologias de desalinizacao avancada, agricultura de precisao deep tech.

## Criterios de seleccao

- Foco em empresas pre-receita ou early-stage com tecnologia diferenciadora validada (prototipos, testes, contratos piloto)
- Exclui SpaceX e Blue Origin (consensus)
- Destaca catalisadores de curto prazo: launches programados, contratos NASA/ESA/DOD, demonstracoes tecnologicas, SPACs em pipeline, IPOs iminentes
- Sinaliza entidades com propriedade intelectual forte e barreiras de entrada elevadas
- Sinaliza red flags: SPAC legacy com destruicao de valor, cash runway <12 meses sem funding a vista, tecnologia nao demonstrada em condicoes reais, TAM inflacionado

## Priorizacao de horizonte

Inclui mais entidades de longo prazo nesta categoria (natureza do deep tech), mas prioriza curto prazo quando existirem catalisadores identificaveis.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_espaco-deeptech.json`.

### Regras

- IDs: SDT-001, SDT-002, ...
- Campo "category": "Espaco & Deep Tech"
- Todos os campos sao obrigatorios; usa null quando nao aplicavel
- `_meta.total_entities` deve corresponder ao comprimento real do array
- Nao incluas entidades sobre as quais nao consigas verificar pelo menos 8 campos
- **Prefere omitir a inventar**
