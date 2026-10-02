import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "@core/store/store";
import type { IShiftPlan } from "@entities/supervision";
import * as supervision from "@entities/supervision";
import { useShiftPlansTab } from "./useShiftPlansTab";

vi.mock("@entities/supervision", () => ({
  getShiftPlans: vi.fn(),
  updateShiftPlan: vi.fn(),
  deleteShiftPlan: vi.fn(),
}));

const plan = (over: Partial<IShiftPlan> = {}) => ({ id: "plan-1", active: true, ...over }) as unknown as IShiftPlan;

const render = (onChanged = vi.fn()) => {
  const view = renderHook(() => useShiftPlansTab({ onChanged }), {
    wrapper: ({ children }) => <Provider store={makeStore()}>{children}</Provider>,
  });
  return { ...view, onChanged };
};

describe("useShiftPlansTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supervision.getShiftPlans).mockResolvedValue({ success: true, data: [plan()], messages: [] });
    vi.mocked(supervision.updateShiftPlan).mockResolvedValue({ success: true, data: plan(), messages: [] });
    vi.mocked(supervision.deleteShiftPlan).mockResolvedValue({ success: true, data: true, messages: [] });
  });

  it("carga la programación al montar", async () => {
    const { result } = render();
    await act(async () => {});

    expect(supervision.getShiftPlans).toHaveBeenCalled();
    expect(result.current.plans).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it("si la carga falla deja la lista vacía", async () => {
    vi.mocked(supervision.getShiftPlans).mockResolvedValue({ success: false, data: [], messages: ["Sin permiso"] });
    const { result } = render();
    await act(async () => {});

    expect(result.current.plans).toEqual([]);
  });

  it("alternar activo avisa al contenedor", async () => {
    const { result, onChanged } = render();
    await act(async () => {});

    await act(async () => {
      await result.current.toggleActive(plan(), false);
    });

    expect(supervision.updateShiftPlan).toHaveBeenCalledWith("plan-1", { active: false });
    expect(onChanged).toHaveBeenCalled();
    expect(result.current.busyId).toBeNull();
  });

  it("si falla el cambio de estado no avisa al contenedor", async () => {
    vi.mocked(supervision.updateShiftPlan).mockResolvedValue({ success: false, data: plan(), messages: [] });
    const { result, onChanged } = render();
    await act(async () => {});
    onChanged.mockClear();

    await act(async () => {
      await result.current.toggleActive(plan(), false);
    });

    expect(onChanged).not.toHaveBeenCalled();
  });

  it("eliminar limpia la selección y avisa", async () => {
    const { result, onChanged } = render();
    await act(async () => {});

    act(() => result.current.setToDelete(plan()));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(supervision.deleteShiftPlan).toHaveBeenCalledWith("plan-1");
    expect(result.current.toDelete).toBeNull();
    expect(onChanged).toHaveBeenCalled();
  });

  it("sin selección no llama a la API", async () => {
    const { result } = render();
    await act(async () => {});

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(supervision.deleteShiftPlan).not.toHaveBeenCalled();
  });
});
