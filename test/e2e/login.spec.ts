import { test, expect } from "@playwright/test";

test.describe("Módulo de Autenticación - Login", () => {
  test.beforeEach(async ({ page }) => {
    // Escuchar la consola del navegador para debug
    page.on("console", (msg) => {
      console.log(`[Navegador] ${msg.type()}: ${msg.text()}`);
    });

    // Ir a la página de login usando la ruta hash correspondiente a HashRouter
    await page.goto("/#/login");
  });

  test("debería mostrar el formulario de inicio de sesión", async ({ page }) => {
    // Verificar título principal
    await expect(page.locator("h1")).toContainText("AXZY Check Web");
    // Verificar campos de texto
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    // Verificar botón de entrada
    await expect(page.getByRole("button", { name: "Entrar al Sistema" })).toBeVisible();
  });

  test("debería mostrar error con credenciales incorrectas", async ({ page }) => {
    // Interceptar petición (incluyendo OPTIONS preflight)
    await page.route("**/users/login", async (route) => {
      const method = route.request().method();
      if (method === "OPTIONS") {
        await route.fulfill({
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            success: false,
            data: null,
            messages: ["Usuario o contraseña incorrectos"],
          }),
        });
      }
    });

    // Llenar campos
    await page.fill('input[name="username"]', "usuario_incorrecto");
    await page.fill('input[name="password"]', "password_incorrecto");

    // Click en botón
    await page.click('button[type="submit"]');

    // Verificar mensaje de error en pantalla
    await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
  });

  test("debería iniciar sesión y redirigir al Home con credenciales correctas", async ({ page }) => {
    // Generar un token mock JWT válido y no expirado (exp: 2050) para pasar la validación en auth.slice.ts
    const validMockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

    // Interceptar petición (incluyendo OPTIONS preflight y POST exitoso)
    await page.route("**/users/login", async (route) => {
      const method = route.request().method();
      if (method === "OPTIONS") {
        await route.fulfill({
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            success: true,
            data: validMockToken,
            messages: [],
          }),
        });
      }
    });

    // Llenar campos
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin123");

    // Click en botón
    await page.click('button[type="submit"]');

    // Debe cambiar la URL a /home (usando hash routing)
    await expect(page).toHaveURL(/.*#\/home/);
  });
});
