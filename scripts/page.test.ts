import { test, expect } from "bun:test";
import { join } from "path";

/**
 * A verificacao da pagina corre num browser a serio, em Node — o playwright depende
 * de internals do Node e nao e fiavel dentro do Bun. Este teste e o portao unico:
 * `bun test` continua a ser o comando que diz se esta tudo bem.
 */
test("verificacao da pagina no browser (scripts/page-checks.mjs)", async () => {
  const proc = Bun.spawn(["node", "--test", "scripts/page-checks.mjs"], {
    cwd: join(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) {
    const fails = out.split("\n").filter((l) => /^not ok|^\s+error:|^# fail/.test(l)).slice(0, 20);
    console.error(fails.join("\n") || out.slice(-3000));
    console.error(err.slice(-1000));
  }
  expect(code).toBe(0);
}, 180_000);
