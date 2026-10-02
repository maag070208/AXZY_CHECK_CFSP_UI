import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Módulo de Guardias - Gestión de Guardias", () => {
  // Lista de guardias mock mutable
  const mockUsers = [
    {
      id: "guard-1",
      name: "MARIO",
      lastName: "MANTENIMIENTO",
      username: "mario",
      active: true,
      roleId: "role-maint",
      role: { id: "role-maint", name: "MAINT", value: "Mantenimiento" },
      clientId: "client-1",
      client: { id: "client-1", name: "Plaza 2000", active: true },
      scheduleId: "sched-1",
      schedule: { id: "sched-1", name: "SIN HORARIO", startTime: "00:00", endTime: "00:00", active: true },
      assignmentLogs: [],
    },
    {
      id: "guard-2",
      name: "RICARDO",
      lastName: "SHIFT",
      username: "ricardo",
      active: true,
      roleId: "role-shift",
      role: { id: "role-shift", name: "SHIFT", value: "Jefe de Turno" },
      clientId: "client-1",
      client: { id: "client-1", name: "Plaza 2000", active: true },
      scheduleId: "sched-2",
      schedule: { id: "sched-2", name: "VESPERTINO", startTime: "15:00", endTime: "23:00", active: true },
      assignmentLogs: [],
    },
  ];

  const mockClients = [
    { id: "client-1", name: "Plaza 2000" },
    { id: "client-2", name: "Martin Amaro" },
  ];

  const mockSchedules = [
    { id: "sched-1", name: "SIN HORARIO", startTime: "00:00", endTime: "00:00", active: true },
    { id: "sched-2", name: "VESPERTINO", startTime: "15:00", endTime: "23:00", active: true },
    { id: "sched-3", name: "MATUTINO", startTime: "07:00", endTime: "15:00", active: true },
    { id: "sched-4", name: "NOCTURNO", startTime: "23:00", endTime: "07:00", active: true },
  ];

  const mockLocations = [
    { id: "loc-1", name: "PLAZA 2000-ALTA-LA FAVORITA", aisle: "A", number: "10", isOccupied: false },
    { id: "loc-2", name: "PLAZA 2000-ALTA-WALMART", aisle: "B", number: "20", isOccupied: false },
  ];

  const mockAssignments = [
    {
      id: 101,
      guardId: "guard-1",
      locationId: "loc-1",
      location: { id: "loc-1", name: "PLAZA 2000-ALTA-LA FAVORITA", aisle: "A", number: "10" },
      status: "PENDING",
      notes: "Revisar cerraduras de la entrada principal.",
      tasks: [
        { id: 201, description: "Cerrar portón principal", completed: false },
        { id: 202, description: "Apagar luces del pasillo", completed: true, completedAt: "2026-06-02T08:00:00.000Z" }
      ],
      createdAt: "2026-06-02T07:30:00.000Z",
      kardex: []
    }
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

      // Mock Catalog Client
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

      // Mock Schedules List
      await page.route("**/schedules", async (route) => {
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
              data: mockSchedules,
              messages: [],
            }),
          });
        }
      });

      // Mock Locations (for special assignment dialog)
      await page.route("**/locations", async (route) => {
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
              data: mockLocations,
              messages: [],
            }),
          });
        }
      });

      // Mock Assignments endpoints
      await page.route(/\/api\/v\d+\/assignments.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PATCH",
              "Access-Control-Allow-Headers": "*",
            },
          });
          return;
        }

        if (url.includes("/assignments/all") || url.includes("/assignments?guardId")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: mockAssignments,
              messages: [],
            }),
          });
        } else if (method === "POST") {
          const postData = JSON.parse(route.request().postData() || "{}");
          const location = mockLocations.find((l) => Number(l.id) === Number(postData.locationId));

          const newAss = {
            id: mockAssignments.length + 101,
            guardId: String(postData.guardId),
            locationId: String(postData.locationId),
            location: { id: String(postData.locationId), name: location ? location.name : "S/U", aisle: location ? location.aisle : "N/A", number: location ? location.number : "N/A" },
            status: "PENDING",
            notes: postData.notes || "",
            tasks: (postData.tasks || []).map((t: any, i: number) => ({ id: i + 301, description: t.description, completed: false })),
            createdAt: new Date().toISOString(),
            kardex: []
          };

          mockAssignments.push(newAss);

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: newAss,
              messages: [],
            }),
          });
        }
      });

      // Mock Users API (Datatable & Update)
      await page.route(/\/api\/v\d+\/users.*/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (url.endsWith("/users/login")) {
          await route.fallback();
          return;
        }

        if (method === "OPTIONS") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
              "Access-Control-Allow-Headers": "*",
            },
          });
          return;
        }

        if (url.endsWith("/users/datatable")) {
          const postData = JSON.parse(route.request().postData() || "{}");
          const filters = postData.filters || {};
          let filtered = [...mockUsers];

          if (filters.name) {
            const search = filters.name.toLowerCase();
            filtered = filtered.filter(
              (u) =>
                u.name.toLowerCase().includes(search) ||
                u.lastName.toLowerCase().includes(search)
            );
          }

          if (filters.active !== undefined) {
            filtered = filtered.filter((u) => u.active === filters.active);
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
        } else if (method === "PUT") {
          const urlParts = url.split("/");
          const id = urlParts[urlParts.length - 1];
          const postData = JSON.parse(route.request().postData() || "{}");
          const idx = mockUsers.findIndex((u) => u.id === id);

          if (idx !== -1) {
            if (postData.active !== undefined) {
              mockUsers[idx].active = postData.active;
            }
            if (postData.clientId !== undefined) {
              const client = mockClients.find((c) => String(c.id) === String(postData.clientId));
              mockUsers[idx].clientId = postData.clientId;
              mockUsers[idx].client = client ? { id: client.id, name: client.name, active: true } : undefined;
            }
            if (postData.scheduleId !== undefined) {
              const schedule = mockSchedules.find((s) => String(s.id) === String(postData.scheduleId));
              mockUsers[idx].scheduleId = postData.scheduleId;
              mockUsers[idx].schedule = schedule ? { id: schedule.id, name: schedule.name, startTime: schedule.startTime, endTime: schedule.endTime, active: true } : undefined;
            }
          }

          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: idx !== -1 ? mockUsers[idx] : null,
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

    if (useRealApi) {
      // Garantizar que exista el cliente "Martin Amaro"
      await page.goto("/#/clients");
      await page.waitForTimeout(500);

      // Search — wait for actual API response to avoid race on slow DB
      const searchInput = page.locator('input[placeholder="BUSCAR CLIENTE..."]');
      await searchInput.fill("Martin Amaro");
      await page.waitForResponse(
        (resp) => resp.url().includes("/clients/datatable") && resp.status() === 200,
        { timeout: 8000 }
      ).catch(() => {});
      const exists = await page.getByText("Martin Amaro", { exact: false }).count() > 0;
      await searchInput.fill("");
      await page.waitForResponse(
        (resp) => resp.url().includes("/clients/datatable") && resp.status() === 200,
        { timeout: 5000 }
      ).catch(() => {});

      if (!exists) {
        const ts = Date.now();
        await page.click('button:has-text("Nuevo Cliente")');
        await page.fill('input[name="name"]', "Martin Amaro");
        await page.fill('input[name="rfc"]', `MAR${ts.toString().slice(-9)}`);
        await page.fill('input[name="address"]', "Calle Falsa 123");
        await page.fill('input[name="contactName"]', "Martin Contact");
        await page.fill('input[name="contactPhone"]', "1234567890");
        await page.fill('input[name="appUsername"]', `martin_amaro_${ts}`);
        await page.fill('input[name="appPassword"]', "password123");
        await page.click('button:has-text("Crear Cliente")');
        // Graceful: name unique constraint → client already exists, close and continue
        const created = await page.getByText("Cliente creado con éxito").isVisible({ timeout: 5000 }).catch(() => false);
        if (!created) {
          await page.keyboard.press("Escape");
        }
      }
    }

    // 4. Navegar a guards
    await page.goto("/#/guards");
  });

  test("debería mostrar el Directorio de Guardias", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Directorio de Guardias");
    await expect(page.getByText(/mario mantenimiento/i)).toBeVisible();
    await expect(page.getByText(/ricardo shift/i)).toBeVisible();
  });

  test("debería permitir reasignar el horario (turno) de un guardia", async ({ page }) => {
    const row = page.locator("tr", { hasText: /mario mantenimiento/i });
    await row.getByRole("button", { name: "Horario" }).click();

    await expect(page.getByText("Cambiar Turno", { exact: true })).toBeVisible();

    const option = page.locator('select[name="scheduleId"] option', { hasText: /vespertino/i });
    const value = await option.getAttribute("value");
    await page.selectOption('select[name="scheduleId"]', value);

    await expect(page.getByText("Horario actualizado")).toBeVisible();
    await expect(row.getByText(/vespertino/i)).toBeVisible();
  });

  test("debería permitir reasignar el cliente de un guardia", async ({ page }) => {
    const row = page.locator("tr", { hasText: /mario mantenimiento/i });
    await row.getByRole("button", { name: "Cliente" }).click();

    await expect(page.getByText("Reasignar Cliente", { exact: true })).toBeVisible();

    await page.selectOption('select[name="clientId"]', { label: "Martin Amaro" });

    await expect(page.getByText("Cliente reasignado")).toBeVisible();
    await expect(row.getByText(/martin amaro/i)).toBeVisible();
  });

  test("debería permitir desactivar y activar a un guardia", async ({ page }) => {
    const row = page.locator("tr", { hasText: /mario mantenimiento/i });
    
    // Desactivar
    await row.getByRole("button", { name: "Desactivar" }).click();
    await expect(page.getByRole("heading", { name: "Desactivar Guardia" })).toBeVisible();
    await page.getByRole("button", { name: "Desactivar" }).last().click();
    await expect(page.getByText("Guardia desactivado")).toBeVisible();

    // Activar
    await row.getByRole("button", { name: "Activar" }).click();
    await expect(page.getByRole("heading", { name: "Activar Guardia" })).toBeVisible();
    await page.getByRole("button", { name: "Activar" }).last().click();
    await expect(page.getByText("Guardia activado")).toBeVisible();
  });

  test("debería abrir el expediente de tareas del guardia", async ({ page }) => {
    const row = page.locator("tr", { hasText: /mario mantenimiento/i });
    await row.getByRole("button", { name: "Ver Tareas" }).click();

    await expect(page.getByRole("heading", { name: /mario mantenimiento/i })).toBeVisible();

    if (process.env.USE_REAL_API) {
      // Real DB: mario has no seeded task assignments → expediente shows "Sin Historial"
      await expect(page.getByText(/sin historial/i)).toBeVisible();
    } else {
      // Mock: assignment cards injected — click card to open detail view
      await page.getByText("PLAZA 2000-ALTA-LA FAVORITA").first().click();
      await expect(page.getByText("Revisar cerraduras de la entrada principal.")).toBeVisible();
    }

    await page.keyboard.press("Escape");
  });

  test("debería permitir generar una asignación especial", async ({ page, request }) => {
    // En la DB real solo asael tiene ubicaciones asignadas a su cliente.
    const guardRowName = process.env.USE_REAL_API
      ? /asael guardia/i
      : /mario mantenimiento/i;

    // La API rechaza asignar un guardia que ya tiene una activa en la ubicación.
    // Como la DB real acumula corridas previas, limpiamos las PENDING de asael
    // para que la creación sea determinista.
    if (process.env.USE_REAL_API) {
      const api = "http://localhost:4444/api/v1";
      const loginRes = await request.post(`${api}/users/login`, {
        data: { username: "admin", password: "123456" },
      });
      const token = (await loginRes.json()).data as string;
      const auth = { Authorization: `Bearer ${token}` };
      const usersRes = await request.post(`${api}/users/datatable`, {
        headers: auth,
        data: { page: 1, limit: 100 },
      });
      const asael = (await usersRes.json()).data.rows.find(
        (u: any) => u.username === "asael",
      );
      if (asael) {
        const asgRes = await request.get(
          `${api}/assignments/all?guardId=${asael.id}`,
          { headers: auth },
        );
        const list = ((await asgRes.json()).data || []) as any[];
        for (const a of list.filter((x) => x.status === "PENDING")) {
          await request.delete(`${api}/assignments/${a.id}`, { headers: auth });
        }
      }
    }

    const row = page.locator("tr", { hasText: guardRowName });
    await row.getByRole("button", { name: "Asignar" }).click();

    await expect(page.getByRole("heading", { name: "Nueva Asignación", exact: true })).toBeVisible();

    // Agregar Tarea 1
    await page.fill('input[name="tempTaskDesc"]', "TEST TAREA 1");
    await page.locator('div.flex.gap-2', { has: page.locator('input[name="tempTaskDesc"]') }).locator('button').click();
    await expect(page.getByText("TEST TAREA 1")).toBeVisible();

    // Agregar Tarea 2
    await page.fill('input[name="tempTaskDesc"]', "TEST TAREA 2");
    await page.locator('div.flex.gap-2', { has: page.locator('input[name="tempTaskDesc"]') }).locator('button').click();
    await expect(page.getByText("TEST TAREA 2")).toBeVisible();

    // Eliminar Tarea 2
    const task2Row = page.locator('div.flex.items-center.justify-between', { hasText: "TEST TAREA 2" });
    await task2Row.locator('button').click();
    await expect(page.getByText("TEST TAREA 2")).not.toBeVisible();

    // Agregar notas adicionales
    await page.fill('textarea[placeholder="Instrucciones especiales..."]', "TEST OBSERVACIONES");

    // Seleccionar la primera ubicación disponible (ya limpiamos duplicados).
    // El panel flotante del select se identifica con data-it-floating.
    await page.click('input[placeholder="Buscar ubicación..."]');
    await page.locator('[data-it-floating="true"] div.cursor-pointer').first().click();

    // Enviar asignación
    await page.click('button:has-text("Crear Asignación")');

    await expect(page.getByText("Asignación creada correctamente")).toBeVisible({
      timeout: 15000,
    });
  });
});
