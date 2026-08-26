#!/usr/bin/env bun
/**
 * Passo 1-2 da rotina (ADR-1): trazer para o repo as posicoes que o utilizador
 * escreveu na pagina publicada.
 *
 *   Artifact action:"read" url:<.artifact-url>   → guardar o HTML num ficheiro
 *   bun run scripts/merge-artifact-state.ts <ficheiro.html> [--dry-run]
 *
 * Corre ANTES de build-dashboard.ts. Nunca falha a rotina: se nao conseguir ler
 * a pagina, diz porque e deixa PORTFOLIO.md exactamente como estava.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { extractState, merge } from "./portfolio-state.ts";
import { readPositions, writePositions } from "./portfolio-md.ts";

const ROOT = join(import.meta.dir, "..");
const PORTFOLIO = join(ROOT, "PORTFOLIO.md");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--"));

if (!file) {
  console.log("Uso: bun run scripts/merge-artifact-state.ts <html-do-artifact> [--dry-run]");
  process.exit(1);
}

const html = existsSync(file) ? readFileSync(file, "utf-8") : null;
if (html === null) console.log(`aviso: ${file} nao existe`);

const { state, reason } = extractState(html);
console.log(`leitura da pagina: ${reason}`);

const md = readFileSync(PORTFOLIO, "utf-8");
const repo = readPositions(md);
const { positions, changed, log } = merge(repo, state, reason);

for (const line of log) console.log("  " + line);

if (!changed) {
  console.log(`PORTFOLIO.md inalterado — ${repo.length} posicoes preservadas.`);
  process.exit(0);
}
if (dryRun) {
  console.log(`--dry-run: escreveria ${positions.length} posicoes em PORTFOLIO.md.`);
  process.exit(0);
}

writeFileSync(PORTFOLIO, writePositions(md, positions));
console.log(`PORTFOLIO.md actualizado — ${positions.length} posicoes.`);
