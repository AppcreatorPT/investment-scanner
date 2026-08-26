import { test, expect } from "bun:test";
import { catalystDeadline, daysUntil } from "./catalyst.ts";

test("dia explicito", () => {
  expect(catalystDeadline("Voto LivePerson 2-Set-2026; Q3 Nov 2026")).toBe("2026-09-02");
  expect(catalystDeadline("Lockup expira 14 Nov 2026")).toBe("2026-11-14");
});

test("trimestre e semestre fecham no ultimo dia", () => {
  expect(catalystDeadline("Nova centrifuga Oak Ridge Q4 2026")).toBe("2026-12-31");
  expect(catalystDeadline("BLA submission Q3 2026")).toBe("2026-09-30");
  expect(catalystDeadline("Milestone Q1 2027")).toBe("2027-03-31");
  expect(catalystDeadline("Encomendas NATO; H2 2026 earnings")).toBe("2026-12-31");
  expect(catalystDeadline("Resultados H1 2027")).toBe("2027-06-30");
});

test("mes solto fecha no fim do mes, em portugues e ingles", () => {
  expect(catalystDeadline("PM647 IND/CTA antes fim Set 2026")).toBe("2026-09-30");
  expect(catalystDeadline("Q3 earnings Nov 2026")).toBe("2026-11-30");
  expect(catalystDeadline("Results due Feb 2027")).toBe("2027-02-28");
});

test("'late 2027' e o fim do ano", () => {
  expect(catalystDeadline("HREE Phase 1 operacional late 2027")).toBe("2027-12-31");
});

test("sem data legivel devolve null — nao se inventa urgencia", () => {
  expect(catalystDeadline("PERFORMA Phase 3 (iniciado Aug 3 2026)")).toBeNull();
  expect(catalystDeadline("Contratos por anunciar")).toBeNull();
  expect(catalystDeadline("")).toBeNull();
  expect(catalystDeadline(undefined as any)).toBeNull();
});

test("Fevereiro bissexto", () => {
  expect(catalystDeadline("marco Feb 2028")).toBe("2028-02-29");
});

test("daysUntil conta dias inteiros e fica negativo no passado", () => {
  expect(daysUntil("2026-09-02", "2026-08-26")).toBe(7);
  expect(daysUntil("2026-08-26", "2026-08-26")).toBe(0);
  expect(daysUntil("2026-08-01", "2026-08-26")).toBe(-25);
});
