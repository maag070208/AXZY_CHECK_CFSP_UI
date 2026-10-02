/**
 * Arnés temporal de revisión visual (no forma parte del producto).
 * Captura el home por tramos porque el scroll vive en un contenedor interno.
 * Uso: node .design-shot.mjs <prefijo> [ruta-hash]
 */
import { chromium } from "playwright";

const out = process.argv[2] ?? "/tmp/dsh-shots/home";
const route = process.argv[3] ?? "/home";

const login = async () => {
  const res = await fetch("http://localhost:4444/api/v1/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "123456" }),
  });
  return (await res.json()).data;
};

const token = await login();

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 2,
});
await context.addInitScript((t) => {
  localStorage.setItem("token", t);
  localStorage.setItem("it-theme-dark-mode", "light");
}, token);

const page = await context.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(`http://127.0.0.1:5002/#${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

/** Busca el elemento con scroll vertical real. */
const scroller = await page.evaluateHandle(() => {
  const all = Array.from(document.querySelectorAll("*"));
  let best = null;
  let bestDelta = 0;
  for (const el of all) {
    const delta = el.scrollHeight - el.clientHeight;
    if (delta > bestDelta && el.clientHeight > 300) {
      bestDelta = delta;
      best = el;
    }
  }
  return best ?? document.documentElement;
});

const metrics = await page.evaluate((el) => ({
  scrollHeight: el.scrollHeight,
  clientHeight: el.clientHeight,
}), scroller);

console.log("scroller:", JSON.stringify(metrics));

const shots = Math.max(1, Math.ceil(metrics.scrollHeight / metrics.clientHeight));
for (let i = 0; i < shots; i++) {
  await page.evaluate(([el, y]) => el.scrollTo(0, y), [scroller, i * metrics.clientHeight]);
  await page.waitForTimeout(700);
  const path = shots === 1 ? `${out}.png` : `${out}-${String(i + 1).padStart(2, "0")}.png`;
  await page.screenshot({ path });
  console.log("guardado:", path);
}

if (errors.length) console.log("errores consola:\n" + errors.join("\n"));

await browser.close();
