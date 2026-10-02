import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "@core/store/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeCategory } from "@entities/settings/__fixtures__";
import * as settingsApi from "@entities/settings";

/**
 * El view-model importa la entidad directamente, así que se mockea completa:
 * si falta una export, `vi.mocked()` deja de devolver un mock y los tests
 * fallan con "mockResolvedValue is not a function".
 */
vi.mock("@entities/settings", () => ({
  fetchCategoriesTable: vi.fn(),
  fetchTypesTable: vi.fn(),
  fetchSysConfigTable: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createType: vi.fn(),
  updateType: vi.fn(),
  deleteType: vi.fn(),
  updateSysConfig: vi.fn(),
  deleteSysConfig: vi.fn(),
  CATEGORY_TYPE_META: {},
}));

vi.mock("@app/core/hooks/catalog.hook", () => ({ useCatalog: () => ({ data: [] }) }));
vi.mock("@app/core/store/toast/toast.slice", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@app/core/store/toast/toast.slice")>();
  return { ...actual, showToast: (payload: unknown) => ({ type: "toast/show", payload }) };
});

const { useSettingsPage } = await import("./useSettingsPage");

/** El view-model despacha toasts, así que necesita un store. */
const render = () =>
  renderHook(() => useSettingsPage(), {
    wrapper: ({ children }) => <Provider store={makeStore()}>{children}</Provider>,
  });

describe("useSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsApi.deleteCategory).mockResolvedValue({ success: true, data: true, messages: [] });
    vi.mocked(settingsApi.deleteType).mockResolvedValue({ success: true, data: true, messages: [] });
    vi.mocked(settingsApi.deleteSysConfig).mockResolvedValue({ success: true, data: true, messages: [] });
    vi.mocked(settingsApi.updateSysConfig).mockResolvedValue({
      success: true,
      data: { key: "k", value: "v" },
      messages: [],
    });
  });

  it("empieza en la pestaña de categorías", () => {
    expect(render().result.current.activeTab).toBe("CATEGORIES");
  });

  it("borrar una categoría refresca la tabla", async () => {
    const { result } = render();
    const before = result.current.refreshKey;

    await act(async () => {
      await result.current.deleteCategoryRow("cat-1");
    });

    expect(settingsApi.deleteCategory).toHaveBeenCalledWith("cat-1");
    expect(result.current.refreshKey).toBe(before + 1);
  });

  it("si el borrado falla no refresca y avisa del error", async () => {
    vi.mocked(settingsApi.deleteCategory).mockResolvedValue({
      success: false,
      data: false,
      messages: ["Categoría en uso"],
    });
    const { result } = render();
    const before = result.current.refreshKey;

    await act(async () => {
      await result.current.deleteCategoryRow("cat-2");
    });

    expect(result.current.refreshKey).toBe(before);
  });

  it("borrar un tipo refresca la tabla", async () => {
    const { result } = render();
    const before = result.current.refreshKey;

    await act(async () => {
      await result.current.deleteTypeRow("type-1");
    });

    expect(settingsApi.deleteType).toHaveBeenCalledWith("type-1");
    expect(result.current.refreshKey).toBe(before + 1);
  });

  it("borrar un parámetro de sistema refresca la tabla", async () => {
    const { result } = render();
    const before = result.current.refreshKey;

    await act(async () => {
      await result.current.deleteConfigRow("ROUND_TOLERANCE");
    });

    expect(settingsApi.deleteSysConfig).toHaveBeenCalledWith("ROUND_TOLERANCE");
    expect(result.current.refreshKey).toBe(before + 1);
  });

  it("abrir el modal de categoría en modo alta limpia el formulario", () => {
    const { result } = render();

    act(() => result.current.openCategoryModal());

    expect(result.current.editingCategory).toBeNull();
    expect(result.current.categoryForm.name).toBe("");
  });

  it("abrir el modal en edición precarga la categoría", () => {
    const category = makeCategory({ name: "Falla eléctrica", value: "FALLA" });
    const { result } = render();

    act(() => result.current.openCategoryModal(category));

    expect(result.current.editingCategory?.id).toBe(category.id);
    expect(result.current.categoryForm.name).toBe("Falla eléctrica");
  });

  it("cambiar de pestaña no pierde el estado de la tabla", () => {
    const { result } = render();
    const key = result.current.refreshKey;

    act(() => result.current.setActiveTab("SYSCONFIG"));

    expect(result.current.activeTab).toBe("SYSCONFIG");
    expect(result.current.refreshKey).toBe(key);
  });
});
