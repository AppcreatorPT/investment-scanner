# Scan: Economia & Macro

> **RETIRADO da rotacao (Plano 2).** Tema descontinuado: era o mais fraco (avg asymmetry ~2.6,
> quase sem catalisadores dataveis) e macro nao e onde vivem apostas assimetricas de entidade
> unica. As jogadas macro *acessiveis* (ETFs UCITS de taxas/commodities/FX) dobram para
> **Materiais & Energia** e **Trading**. Ficheiro mantido apenas como referencia historica.

**Prefixo ID:** MAC- (retirado)
**Target:** — (nao gerar)

---

## Instrucoes

Actua como analista de investimento especializado em macroeconomia e estrategia de mercado. Gera uma lista curada de 30 a 50 entidades com elevado potencial de retorno financeiro ou informacional.

Usa WebSearch para verificar cada entidade antes de a incluir.

## Scope

Economistas com visoes nao-consensuais relevantes e track record de acertos, analistas macro independentes, think tanks com influencia em politica economica, gestores macro (global macro funds, CTA macro), consultoras de risco macro, plataformas de dados macro (alternativa a Bloomberg/Reuters), empresas de nowcasting economico, gestores de fundos soberanos emergentes, family offices com abordagem macro-first.

## Criterios de seleccao

- Prioriza pensadores e gestores que acertaram em pelo menos 2 chamadas macro contrarian nos ultimos 5 anos
- Exclui os nomes mainstream saturados nos media financeiros
- Destaca entidades com catalisadores de curto prazo: mudancas de politica monetaria esperadas, eleicoes com impacto macro, inflection points em ciclos de credito, mudancas regulatorias iminentes
- Para gestores de fundos: prioriza os que tem veiculos acessiveis a investidores qualificados ou retail
- Sinaliza analistas cujas previsoes estao a divergir significativamente do consenso atual
- Sinaliza red flags: guru syndrome sem accountability, ausencia de track record verificavel, conflitos de interesse

## Priorizacao de horizonte

Prioriza curto prazo (0-12 meses) sempre que possivel.

## Output

Gera JSON valido seguindo o schema definido em CLAUDE.md. Guarda em `output/YYYY-MM-DD_economia.json`.

### Regras

- IDs: MAC-001, MAC-002, ...
- Campo "category": "Economia & Macro"
- Todos os campos sao obrigatorios; usa null quando nao aplicavel
- `_meta.total_entities` deve corresponder ao comprimento real do array
- Nao incluas entidades sobre as quais nao consigas verificar pelo menos 8 campos
- **Prefere omitir a inventar**
