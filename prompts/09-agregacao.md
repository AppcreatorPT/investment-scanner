# Agregacao de Resultados

> **DEPRECADO (Plano 2):** nao gerar `_agregado.json` (dado duplicado). A agregacao e feita
> **ao vivo pelo dashboard**, que carrega varios JSONs de temas e cruza-os. Este ficheiro fica
> como referencia da logica, mas o passo de gerar ficheiro foi retirado do workflow.

---

## Instrucoes

Le todos os ficheiros JSON em `output/` com a data de hoje (ou a data especificada pelo utilizador). Combina-os num unico ficheiro agregado.

## Passos

1. **Combinar** todos os arrays `entities` num unico array, ordenado por:
   - `asymmetry_score` descendente (5 → 1)
   - Depois por `return_horizon` (curto > medio > longo)

2. **Cross-category plays**: identificar entidades que poderiam pertencer a mais do que uma categoria. Bloco separado:
   ```json
   "cross_category_highlights": [
     {
       "entity_id": "AIC-015",
       "overlapping_categories": ["IA & Computacao", "Longevidade & Saude"],
       "reason": "AI drug discovery para aging"
     }
   ]
   ```

3. **Portfolio construction**:
   ```json
   "portfolio_construction": {
     "allocation_by_category": { "Longevidade & Saude": "15%", ... },
     "top20_global_asymmetry": ["id1", "id2", ...],
     "top10_liquid": ["id1", ...],
     "top10_ipos_proximos_12m": ["id1", ...]
   }
   ```

4. **Stress scenarios**:
   ```json
   "stress_scenarios": {
     "recessao": { "beneficiam": ["id1"], "vulneraveis": ["id2"] },
     "escalada_geopolitica": { "beneficiam": ["id1"], "vulneraveis": ["id2"] },
     "crash_cripto": { "expostos": ["id1"] },
     "subida_taxas": { "vulneraveis": ["id1"] }
   }
   ```

5. **Action items**:
   ```json
   "action_items": {
     "agir_esta_semana": ["id1", "id2"],
     "watchlist_1_3_meses": ["id1", "id2"],
     "research_aprofundado": ["id1", "id2"]
   }
   ```

## Output

> **Nao gerar ficheiro.** A agregacao e feita ao vivo pelo dashboard (carrega varios JSONs
> de temas da mesma data e cruza-os: top global por `asymmetry_score`, buy-list, etc.).
> A logica acima fica como referencia conceptual do que o dashboard deve mostrar.
