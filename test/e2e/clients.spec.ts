import { test, expect } from "@playwright/test";

// Configurar el describe para ejecutarse de forma secuencial (serial)
test.describe.configure({ mode: "serial" });

test.describe("Módulo de Clientes - Gestión de Clientes", () => {
  // Lista de clientes mock mutable para simular base de datos (se inicializa una sola vez para persistir cambios entre pruebas en modo mock)
  const mockClients = [
    {
      id: "185d109b-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      name: "Martin Amaro",
      address: "Universo M60 A",
      rfc: "AAGM070208AL5",
      contactName: "MARTIN ASAEL AMARO GARCIA",
      contactPhone: "6645102632",
      active: true,
      softDelete: false,
    },
    {
      id: "bb2fda15-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      name: "Plaza 2000",
      address: "Universo M60 A",
      rfc: "AAGM070208AL5",
      contactName: "ROBERTO",
      contactPhone: "6645102632",
      active: true,
      softDelete: false,
    },
  ];

  test.beforeEach(async ({ page }) => {
    const useRealApi = !!process.env.USE_REAL_API;

    // Escuchar consola del navegador para debugging
    page.on("console", (msg) => {
      console.log(`[Navegador] ${msg.type()}: ${msg.text()}`);
    });

    if (!useRealApi) {
      // Token JWT mock válido y no expirado
      const validMockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFkbWluIiwiY2xpZW50SWQiOm51bGwsImV4cCI6MjUyNDYwODAwMH0.dummy-signature";
      
      // Mockear la petición de Login
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

      // Mockear unificado de API de Clientes (el regex busca /api/vX/clients para evitar interferir con rutas de frontend)
      await page.route(/\/api\/v\d+\/clients.*/, async (route) => {
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

        // Caso 1: Obtener datatable
        if (url.endsWith("/clients/datatable")) {
          const postData = JSON.parse(route.request().postData() || "{}");
          const filters = postData.filters || {};
          
          let filteredClients = mockClients;
          
          // Filtro por término de búsqueda (nombre)
          if (filters.name) {
            const search = filters.name.toLowerCase();
            filteredClients = filteredClients.filter(c => c.name.toLowerCase().includes(search));
          }
          
          // Filtro por estado activo/inactivo
          if (filters.active !== undefined) {
            filteredClients = filteredClients.filter(c => c.active === filters.active);
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
                rows: filteredClients,
                total: filteredClients.length,
                page: 1,
                limit: 10,
              },
              messages: [],
            }),
          });
        }
        // Caso 2: Crear cliente (POST a /clients)
        else if (url.endsWith("/clients") && method === "POST") {
          const postData = JSON.parse(route.request().postData() || "{}");
          const newClient = {
            id: `client-${Date.now()}`,
            name: postData.name || "CLIENTE NUEVO",
            address: postData.address || "",
            rfc: postData.rfc || "",
            contactName: postData.contactName || "",
            contactPhone: postData.contactPhone || "",
            active: true,
            softDelete: false,
          };

          mockClients.push(newClient);

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: [newClient],
              messages: [],
            }),
          });
        }
        // Caso 3: Editar cliente (PUT a /clients/:id)
        else if (method === "PUT") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const postData = JSON.parse(route.request().postData() || "{}");
          const clientIndex = mockClients.findIndex((c) => c.id === id);
          
          if (clientIndex !== -1) {
            mockClients[clientIndex] = {
              ...mockClients[clientIndex],
              name: postData.name || mockClients[clientIndex].name,
              address: postData.address || mockClients[clientIndex].address,
              rfc: postData.rfc || mockClients[clientIndex].rfc,
              contactName: postData.contactName || mockClients[clientIndex].contactName,
              contactPhone: postData.contactPhone || mockClients[clientIndex].contactPhone,
              active: postData.active !== undefined ? postData.active : mockClients[clientIndex].active,
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
              data: clientIndex !== -1 ? [mockClients[clientIndex]] : [],
              messages: [],
            }),
          });
        }
        // Caso 4: Eliminar cliente (DELETE a /clients/:id)
        else if (method === "DELETE") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          
          const index = mockClients.findIndex(c => c.id === id);
          if (index !== -1) {
            mockClients.splice(index, 1);
          }

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
    }

    // 1. Ir a la pantalla de login
    await page.goto("/#/login");

    // 2. Autenticarse por la interfaz de usuario normal (contraseña real de seed es '123456')
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "123456");
    await page.click('button[type="submit"]');

    // 3. Confirmar que se inició sesión y cargó el Home
    await expect(page).toHaveURL(/.*#\/home/);

    // 4. Navegar al directorio de clientes
    await page.goto("/#/clients");
  });

  const uniqueClientName = "CLIENTE GENERADO E2E";
  const modifiedClientName = "CLIENTE GENERADO E2E MODIFICADO";

  test("debería permitir agregar un nuevo cliente exitosamente con nombre único", async ({ page }) => {
    // 0. Limpieza preventiva: buscar y forzar leftovers a la primera página para eliminarlos
    await page.fill('input[placeholder="BUSCAR CLIENTE..."]', "GENERADO E2E");
    await page.click('button:has-text("TODOS")');
    await page.waitForResponse(resp => resp.url().includes("/clients") && resp.status() === 200).catch(() => {});
    
    while (await page.locator("tr").filter({ hasText: /CLIENTE GENERADO E2E/i }).first().count() > 0) {
      const row = page.locator("tr").filter({ hasText: /CLIENTE GENERADO E2E/i }).first();
      await row.getByRole("button", { name: "Eliminar" }).click();
      await page.click('button:has-text("Eliminar Cliente")');
      await expect(page.getByText("Cliente eliminado")).toBeVisible();
      await expect(row).toBeHidden();
    }

    // Limpiar buscador para el inicio real de la prueba
    await page.fill('input[placeholder="BUSCAR CLIENTE..."]', "");
    await page.waitForResponse(resp => resp.url().includes("/clients") && resp.status() === 200).catch(() => {});

    // 1. Verificar título principal de la sección
    await expect(page.locator("h1")).toContainText("Directorio de Clientes");

    // 2. Abrir el modal "Nuevo Cliente"
    await page.click('button:has-text("Nuevo Cliente")');

    // 3. Verificar visibilidad del modal de creación
    await expect(page.getByRole("heading", { name: "Nuevo Cliente", exact: true })).toBeVisible();

    // 4. Completar campos del formulario
    await page.fill('input[name="name"]', uniqueClientName);
    await page.fill('input[name="rfc"]', "XAXX010101000");
    await page.fill('input[name="address"]', "Avenida E2E 123");
    await page.fill('input[name="contactName"]', "Administrador E2E");
    await page.fill('input[name="contactPhone"]', "5512345678");
    await page.fill('input[name="appUsername"]', "user_e2e_test");
    await page.fill('input[name="appPassword"]', "password123");

    // 5. Enviar formulario
    await page.click('button:has-text("Confirmar Registro")');

    // 6. Verificar toast de éxito
    await expect(page.getByText("Cliente creado con éxito")).toBeVisible();

    // 7. Verificar que el nuevo cliente aparezca en la tabla
    await expect(page.getByText(uniqueClientName)).toBeVisible();
  });

  test("debería permitir editar el cliente recién creado y ver el cambio en la tabla", async ({ page }) => {
    // 1. Ubicar la fila del cliente generado y presionar "Editar"
    const row = page.locator("tr", { hasText: uniqueClientName });
    await row.getByRole("button", { name: "Editar" }).click();

    // 2. Esperar que el modal de edición abra
    await expect(page.getByRole("heading", { name: new RegExp(`Editar Cliente: ${uniqueClientName}`, "i"), exact: false })).toBeVisible();

    // 3. Modificar el nombre del cliente generado y deshabilitar el estado
    await page.fill('input[name="name"]', modifiedClientName);
    await page.getByRole("switch").click();

    // 4. Guardar cambios
    await page.click('button:has-text("Actualizar Información")');

    // 5. Verificar toast de éxito
    await expect(page.getByText("Cliente actualizado con éxito")).toBeVisible();

    // 6. Filtrar por inactivos y verificar que el nombre modificado aparezca en la tabla
    await page.click('button:has-text("INACTIVOS")');
    await expect(page.getByText(modifiedClientName)).toBeVisible();
  });

  test("debería filtrar el cliente modificado por búsqueda de texto y por estado", async ({ page }) => {
    // 0. Identificar otra fila de cliente en la tabla
    const otherClientRow = page.locator("tr").filter({ hasNotText: modifiedClientName }).filter({ hasText: /ID:/i }).first();

    // 1. Buscar "GENERADO E2E"
    await page.fill('input[placeholder="BUSCAR CLIENTE..."]', "GENERADO E2E");
    
    // 2. Assert: "CLIENTE GENERADO E2E MODIFICADO" (inactivo) debe estar visible y el otro cliente debe ocultarse
    await expect(page.getByText(modifiedClientName)).toBeVisible();
    await expect(otherClientRow).toBeHidden();

    // 3. Limpiar campo de búsqueda
    await page.fill('input[placeholder="BUSCAR CLIENTE..."]', "");
    await expect(page.getByText(modifiedClientName)).toBeVisible();
    await expect(otherClientRow).toBeVisible();

    // 4. Filtrar por estado "INACTIVOS"
    await page.click('button:has-text("INACTIVOS")');

    // 5. Assert: Como el nuevo cliente es inactivo, debe mostrarse y el otro (activo) debe ocultarse
    await expect(page.getByText(modifiedClientName)).toBeVisible();
    await expect(otherClientRow).toBeHidden();

    // 6. Volver a filtrar por "ACTIVOS"
    await page.click('button:has-text("ACTIVOS")');
    await expect(page.getByText(modifiedClientName)).toBeHidden();
    await expect(otherClientRow).toBeVisible();
  });

  test("debería permitir eliminar el cliente modificado tras confirmar en el modal", async ({ page }) => {
    // 1. Ubicar la fila del cliente modificado y presionar "Eliminar"
    const row = page.locator("tr", { hasText: modifiedClientName });
    await row.getByRole("button", { name: "Eliminar" }).click();

    // 2. Esperar modal de confirmación
    await expect(page.getByRole("heading", { name: "Confirmar Eliminación", exact: true })).toBeVisible();

    // 3. Confirmar eliminación
    await page.click('button:has-text("Eliminar Cliente")');

    // 4. Verificar toast de confirmación
    await expect(page.getByText("Cliente eliminado")).toBeVisible();

    // 5. Comprobar que desapareció de la tabla
    await expect(page.getByText(modifiedClientName)).toBeHidden();
  });
});
