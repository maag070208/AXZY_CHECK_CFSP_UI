import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Ubicaciones - Gestión de Ubicaciones", () => {
  // Lista de ubicaciones mock mutable
  const mockLocations = [
    {
      id: "loc-1",
      clientId: "client-1",
      zoneId: "zone-1",
      name: "PLAZA 2000-ALTA-LA FAVORITA",
      reference: "Detrás de caja",
      client: { name: "Plaza 2000" },
      zone: { name: "ALTA" },
      isOccupied: false,
    },
    {
      id: "loc-2",
      clientId: "client-1",
      zoneId: "zone-1",
      name: "PLAZA 2000-ALTA-WALMART",
      reference: "Puerta principal",
      client: { name: "Plaza 2000" },
      zone: { name: "ALTA" },
      isOccupied: false,
    },
  ];

  const mockClients = [
    { id: "client-1", name: "Plaza 2000" },
    { id: "client-2", name: "Martin Amaro" },
  ];

  const mockZones = [
    { id: "zone-1", clientId: "client-1", name: "ALTA", active: true },
    { id: "zone-2", clientId: "client-1", name: "BAJA", active: true },
  ];

  test.beforeEach(async ({ page }) => {
    const useRealApi = !!process.env.USE_REAL_API;

    page.on("console", (msg) => {
      console.log(`[Navegador] ${msg.type()}: ${msg.text()}`);
    });

    if (!useRealApi) {
      const validMockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";

      // Mock Login
      await page.route("**/users/login", async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
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

      // Mock Catalog Clients
      await page.route("**/catalog/client", async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
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
              data: mockClients,
              messages: [],
            }),
          });
        }
      });

      // Mock Zones by Client
      await page.route(/\/api\/v\d+\/zones\/client\/.*/, async (route) => {
        const method = route.request().method();
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
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
              data: mockZones,
              messages: [],
            }),
          });
        }
      });

      // Mock Locations API
      await page.route(/\/api\/v\d+\/locations.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
              "Access-Control-Allow-Headers": "*",
            },
          });
          return;
        }

        // Case 1: Datatable
        if (url.endsWith("/locations/datatable")) {
          const postData = JSON.parse(route.request().postData() || "{}");
          const filters = postData.filters || {};
          let filtered = [...mockLocations];

          if (filters.name) {
            const search = filters.name.toLowerCase();
            filtered = filtered.filter((l) =>
              l.name.toLowerCase().includes(search)
            );
          }

          if (filters.clientId) {
            filtered = filtered.filter(
              (l) => String(l.clientId) === String(filters.clientId)
            );
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: {
                rows: filtered,
                total: filtered.length,
                page: 1,
                limit: 10,
              },
              messages: [],
            }),
          });
        }
        // Case 2: Create (POST /locations)
        else if (url.endsWith("/locations") && method === "POST") {
          const postData = JSON.parse(route.request().postData() || "{}");
          const client = mockClients.find((c) => String(c.id) === String(postData.clientId));
          const zone = mockZones.find((z) => String(z.id) === String(postData.zoneId));

          const newLoc = {
            id: `loc-${Date.now()}`,
            clientId: postData.clientId,
            zoneId: postData.zoneId,
            name: postData.name,
            reference: postData.reference || "",
            client: { name: client ? client.name : "S/C" },
            zone: { name: zone ? zone.name : "S/Z" },
            isOccupied: false,
          };

          mockLocations.push(newLoc);

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: newLoc,
              messages: [],
            }),
          });
        }
        // Case 3: Update (PUT /locations/:id)
        else if (method === "PUT") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const postData = JSON.parse(route.request().postData() || "{}");
          const idx = mockLocations.findIndex((l) => l.id === id);

          if (idx !== -1) {
            const client = mockClients.find((c) => String(c.id) === String(postData.clientId));
            const zone = mockZones.find((z) => String(z.id) === String(postData.zoneId));

            mockLocations[idx] = {
              ...mockLocations[idx],
              clientId: postData.clientId || mockLocations[idx].clientId,
              zoneId: postData.zoneId || mockLocations[idx].zoneId,
              name: postData.name || mockLocations[idx].name,
              reference: postData.reference || mockLocations[idx].reference,
              client: { name: client ? client.name : (mockLocations[idx].client?.name || "S/C") },
              zone: { name: zone ? zone.name : (mockLocations[idx].zone?.name || "S/Z") },
            };
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: idx !== -1 ? mockLocations[idx] : null,
              messages: [],
            }),
          });
        }
        // Case 4: Delete (DELETE /locations/:id)
        else if (method === "DELETE") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const idx = mockLocations.findIndex((l) => l.id === id);

          if (idx !== -1) {
            mockLocations.splice(idx, 1);
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: true,
              messages: [],
            }),
          });
        }
      });
    }

    // 1. Ir a login
    await page.goto("/#/login");

    // 2. Autenticarse
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');

    // 3. Confirmar login
    await expect(page).toHaveURL(/.*#\/home/);

    // 4. Navegar a locations
    await page.goto("/#/locations");
  });

  const uniqueLocNameInput = "OFICINA E2E";
  const uniqueLocNameExpected = "Plaza 2000-ALTA-OFICINA E2E";
  const modifiedLocNameInput = "Plaza 2000-ALTA-OFICINA E2E MODIFICADA";

  test("debería permitir agregar una nueva ubicación exitosamente", async ({ page }) => {
    // 1. Verificar título
    await expect(page.locator("h1")).toContainText("Directorio de Ubicaciones");

    // 2. Click en Nueva Ubicación
    await page.click('button:has-text("Nueva Ubicación")');

    // 3. Verificar modal abierto
    await expect(page.getByRole("heading", { name: "Registro de Ubicación", exact: true })).toBeVisible();

    // 4. Seleccionar Cliente
    await page.click('input[placeholder="Seleccionar cliente..."]');
    await page.fill('input[placeholder="Seleccionar cliente..."]', "Plaza 2000");
    await page.locator('.absolute.z-50').locator('div.cursor-pointer', { hasText: 'Plaza 2000' }).first().click();

    // 5. Seleccionar Zona
    await expect(page.locator('select[name="zoneId"]')).toBeEnabled();
    await page.selectOption('select[name="zoneId"]', { label: "ALTA" });

    // 6. Llenar nombre de la ubicación
    await page.fill('input[name="name"]', uniqueLocNameInput);

    // 7. Enviar
    await page.click('button:has-text("Registrar Punto")');

    // 8. Verificar toast
    await expect(page.getByText("Ubicación creada con éxito")).toBeVisible();

    // 9. Verificar que aparezca en la tabla
    await expect(page.getByText(uniqueLocNameExpected)).toBeVisible();
  });

  test("debería permitir editar la ubicación recién creada", async ({ page }) => {
    // 1. Ubicar fila y click en editar
    const row = page.locator("tr", { hasText: uniqueLocNameExpected });
    await row.getByRole("button", { name: "Editar" }).click();

    // 2. Verificar modal abierto
    await expect(page.getByRole("heading", { name: "Actualizar Ubicación", exact: true })).toBeVisible();

    // 3. Modificar nombre
    await page.fill('input[name="name"]', modifiedLocNameInput);

    // 4. Registrar Punto (guardar cambios)
    await page.click('button:has-text("Registrar Punto")');

    // 5. Verificar toast
    await expect(page.getByText("Ubicación actualizada")).toBeVisible();

    // 6. Verificar cambio en la tabla
    await expect(page.getByText(modifiedLocNameInput)).toBeVisible();
  });

  test("debería permitir buscar y filtrar la ubicación", async ({ page }) => {
    const otherRow = page.locator("tr").filter({ hasNotText: modifiedLocNameInput }).filter({ hasText: /CLIENTE:/i }).first();

    // 1. Buscar
    await page.fill('input[placeholder="BUSCAR UBICACIÓN..."]', "OFICINA E2E MODIFICADA");
    await page.waitForTimeout(600); // debounce

    // 2. Verificar filtrado
    await expect(page.getByText(modifiedLocNameInput)).toBeVisible();
    await expect(otherRow).toBeHidden();

    // 3. Limpiar buscador
    await page.fill('input[placeholder="BUSCAR UBICACIÓN..."]', "");
    await page.waitForTimeout(600); // debounce
    await expect(otherRow).toBeVisible();
  });

  test("debería permitir eliminar la ubicación tras confirmar en el modal", async ({ page }) => {
    // 1. Click eliminar
    const row = page.locator("tr", { hasText: modifiedLocNameInput });
    await row.getByRole("button", { name: "Eliminar" }).click();

    // 2. Verificar modal confirmación
    await expect(page.getByRole("heading", { name: "Confirmar Eliminación", exact: true })).toBeVisible();

    // 3. Confirmar
    await page.click('button:has-text("Sí, Eliminar")');

    // 4. Verificar toast
    await expect(page.getByText("Ubicación eliminada")).toBeVisible();

    // 5. Verificar desaparición de la tabla
    await expect(page.getByText(modifiedLocNameInput)).toBeHidden();
  });
});
