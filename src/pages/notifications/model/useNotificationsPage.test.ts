import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeScheduledNotification } from "@entities/scheduled-notification/__fixtures__";
import { canSaveNotification, EMPTY_NOTIFICATION_FORM, toNotificationPayload } from "@entities/scheduled-notification";
import type { NotificationsDeps } from "./deps";
import { useNotificationsPage } from "./useNotificationsPage";

const setup = (overrides: Partial<NotificationsDeps> = {}) => {
  const deps: NotificationsDeps = {
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn().mockResolvedValue({ success: true, data: makeScheduledNotification(), messages: [] }),
    update: vi.fn().mockResolvedValue({ success: true, data: makeScheduledNotification(), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    sendNow: vi.fn().mockResolvedValue({ success: true, data: null, messages: [] }),
    notify: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => useNotificationsPage(deps));
  return { ...view, deps };
};

describe("useNotificationsPage", () => {
  it("traduce el triple filtro a status", async () => {
    const { result, deps } = setup();

    act(() => result.current.setStatusFilter("ACTIVE"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].filters.status).toBe("active");

    act(() => result.current.setStatusFilter("INACTIVE"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[1][0].filters.status).toBe("inactive");
  });

  it("no deja guardar sin mensaje", async () => {
    const { result, deps } = setup();

    act(() => result.current.openCreate());
    expect(result.current.canSave).toBe(false);

    await act(async () => {
      await result.current.save();
    });

    expect(deps.create).not.toHaveBeenCalled();
  });

  it("crear manda el formulario y refresca", async () => {
    const { result, deps } = setup();

    act(() => result.current.openCreate());
    act(() => result.current.setField("message", "Mensaje nuevo"));
    act(() => result.current.setField("type", "warning"));

    await act(async () => {
      await result.current.save();
    });

    expect(deps.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Mensaje nuevo", type: "warning" }),
    );
    expect(deps.notify).toHaveBeenCalledWith("Notificación creada", "success");
    expect(result.current.refreshKey).toBe(1);
    expect(result.current.isFormOpen).toBe(false);
  });

  it("editar precarga el formulario y actualiza por id", async () => {
    const row = makeScheduledNotification({ id: "notif-7", message: "Original", frequency: "WEEKLY" });
    const { result, deps } = setup();

    act(() => result.current.openEdit(row));
    expect(result.current.form.message).toBe("Original");
    expect(result.current.form.frequency).toBe("WEEKLY");
    expect(result.current.editing?.id).toBe("notif-7");

    act(() => result.current.setField("message", "Editado"));
    await act(async () => {
      await result.current.save();
    });

    expect(deps.update).toHaveBeenCalledWith("notif-7", expect.objectContaining({ message: "Editado" }));
    expect(deps.notify).toHaveBeenCalledWith("Notificación actualizada", "success");
  });

  it("si guardar falla, muestra el mensaje del backend", async () => {
    const { result, deps } = setup({
      create: vi.fn().mockResolvedValue({ success: false, data: null, messages: ["Cuota excedida"] }),
    });

    act(() => result.current.openCreate());
    act(() => result.current.setField("message", "x"));
    await act(async () => {
      await result.current.save();
    });

    expect(deps.notify).toHaveBeenCalledWith("Cuota excedida", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("eliminar avisa y refresca", async () => {
    const row = makeScheduledNotification();
    const { result, deps } = setup();

    act(() => result.current.requestDelete(row));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith(row.id);
    expect(deps.notify).toHaveBeenCalledWith("Notificación eliminada", "success");
    expect(result.current.toDelete).toBeNull();
  });

  it("enviar ahora marca el id en curso y luego lo limpia", async () => {
    const row = makeScheduledNotification({ id: "notif-send" });
    const { result, deps } = setup();

    await act(async () => {
      await result.current.send(row);
    });

    expect(deps.sendNow).toHaveBeenCalledWith(row);
    expect(deps.notify).toHaveBeenCalledWith("Notificación enviada", "success");
    expect(result.current.sendingId).toBeNull();
  });

  it("cerrar el formulario descarta la edición", () => {
    const { result } = setup();

    act(() => result.current.openEdit(makeScheduledNotification()));
    act(() => result.current.closeForm());

    expect(result.current.isFormOpen).toBe(false);
    expect(result.current.editing).toBeNull();
  });
});

describe("helpers de notificaciones", () => {
  it("en frecuencia única no se manda timeOfDay", () => {
    const payload = toNotificationPayload({ ...EMPTY_NOTIFICATION_FORM, message: "hola", frequency: "ONCE" });
    expect("timeOfDay" in payload).toBe(false);
  });

  it("en frecuencia recurrente sí se manda timeOfDay", () => {
    const payload = toNotificationPayload({ ...EMPTY_NOTIFICATION_FORM, message: "hola", frequency: "DAILY" });
    expect(payload.timeOfDay).toBe("08:00");
  });

  it("scheduledAt viaja en ISO", () => {
    const payload = toNotificationPayload({
      ...EMPTY_NOTIFICATION_FORM,
      message: "hola",
      scheduledAt: "2026-10-01T08:30",
    });
    expect(String(payload.scheduledAt)).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it("canSaveNotification exige mensaje no vacío", () => {
    expect(canSaveNotification({ ...EMPTY_NOTIFICATION_FORM, message: "   " })).toBe(false);
    expect(canSaveNotification({ ...EMPTY_NOTIFICATION_FORM, message: "algo" })).toBe(true);
  });
});
