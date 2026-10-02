/**
 * Verificación visual de la WEB contra la API local.
 *
 * Recorre rutas, captura pantalla en claro y oscuro, y reporta errores de
 * consola y respuestas HTTP >= 400. Sirve como cierre de cada lote de
 * migración: si una ruta pinta datos y no hay errores, el lote es válido.
 *
 * Uso:
 *   node scripts/visual-check.mjs                       # rutas por defecto, claro
 *   node scripts/visual-check.mjs /clients /incidents   # rutas concretas
 *   THEME=dark node scripts/visual-check.mjs /home      # modo oscuro
 *   OUT=/tmp/mis-capturas node scripts/visual-check.mjs
 *
 * Requisitos: el dev server (`pnpm dev`, puerto 5002) y la API local.
 * Credenciales configurables con CHECK_USER / CHECK_PASS.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const API = process.env.CHECK_API ?? "http://localhost:4444/api/v1";
const WEB = process.env.CHECK_WEB ?? "http://127.0.0.1:5002";
const USER = process.env.CHECK_USER ?? "admin";
const PASS = process.env.CHECK_PASS ?? "123456";
const THEME = process.env.THEME ?? "light";

const DEFAULT_ROUTES = ["/home", "/clients", "/incidents", "/guards", "/rounds", "/kardex", "/users", "/settings"];
const routes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROUTES;
const outDir = process.env.OUT ?? "/tmp/axzy-visual";
mkdirSync(outDir, { recursive: true });

/** Inicia sesión y devuelve el token; aborta si la API no responde. */
const login = async () => {
  const res = await fetch(`${API}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const json = await res.json();
  if (!json?.data) throw new Error(`Login falló: ${JSON.stringify(json).slice(0, 200)}`);
  return json.data;
};

const token = await login();
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: Number(process.env.WIDTH ?? 1600), height: Number(process.env.HEIGHT ?? 1000) },
  deviceScaleFactor: 2,
});
await context.addInitScript(
  ([t, mode]) => {
    localStorage.setItem("token", t);
    localStorage.setItem("it-theme-dark-mode", mode);
  },
  [token, THEME],
);

let failures = 0;

for (const route of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  const httpErrors = [];

  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 180)));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 180)}`));
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) httpErrors.push(`${r.status()} ${r.url().slice(-60)}`);
  });

  await page.goto(`${WEB}/#${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);

  const name = route.replace(/\//g, "_") || "_root";
  const file = path.join(outDir, `${name}-${THEME}.png`);
  await page.screenshot({ path: file });

  // Ojo: la fila del estado vacío también es un `tbody tr`, así que hay que
  // distinguirla o el conteo miente.
  const bodyText = (await page.locator("table").first().innerText().catch(() => "")) || "";
  const isEmpty =
    /no se encontraron resultados|sin resultados|no hay /i.test(bodyText) || bodyText.trim() === "";
  const rows = isEmpty ? 0 : await page.locator("table tbody tr").count();
  const ok = consoleErrors.length === 0 && httpErrors.length === 0;
  if (!ok) failures++;

  console.log(
    `${ok ? "OK  " : "FALLA"} ${route.padEnd(12)} http>=400: ${httpErrors.length}  consola: ${consoleErrors.length}  filas: ${isEmpty ? "0 (vacío)" : rows}  -> ${file}`,
  );
  if (httpErrors.length) console.log(`      http: ${httpErrors.join(" ; ")}`);
  if (consoleErrors.length) console.log(`      consola: ${consoleErrors.slice(0, 2).join(" ; ")}`);

  await page.close();
}

await browser.close();
console.log(failures === 0 ? `\nTodo OK (${routes.length} rutas, tema ${THEME})` : `\n${failures} ruta(s) con errores`);
process.exit(failures === 0 ? 0 : 1);
