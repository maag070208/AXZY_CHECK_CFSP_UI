/**
 * View-model de Configuración.
 *
 * La lógica se extrajo **tal cual** del componente para no alterar
 * comportamiento. Los catálogos de iconos y colores se quedaron en la vista:
 * son presentación, no estado.
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import * as SettingsService from "@entities/settings";

export const useSettingsPage = () => {

  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<
    "CATEGORIES" | "TYPES" | "SYSCONFIG"
  >("CATEGORIES");
  const [refreshKey, setRefreshKey] = useState(0);

  // Search Filters
  const [searchCat, setSearchCat] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchConfig, setSearchConfig] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);
  const [isAddingSubtype, setIsAddingSubtype] = useState(false);
  const [newSubtypeForm, setNewSubtypeForm] = useState({ name: "", value: "" });

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  // Form States
  const [categoryForm, setCategoryForm] = useState<any>({
    name: "",
    value: "",
    type: "INCIDENT",
    color: "",
    icon: "alert-circle",
  });
  const [typeForm, setTypeForm] = useState<any>({
    categoryId: "",
    name: "",
    value: "",
  });
  const [configForm, setConfigForm] = useState<any>({ key: "", value: "" });

  // Open Modal Handlers
  const openCategoryModal = (cat: any = null) => {
    setEditingCategory(cat);
    setCategoryForm(
      cat
        ? { ...cat, color: cat.color || "#EF4444" }
        : {
            name: "",
            value: "",
            type: "INCIDENT",
            color: "#EF4444",
            icon: "alert-circle",
          },
    );
    setIsCategoryModalOpen(true);
    setIsAddingSubtype(false);
  };

  const openTypeModal = (type: any = null) => {
    setEditingType(type);
    setTypeForm(
      type || {
        categoryId: categoriesCatalog?.[0]?.id || "",
        name: "",
        value: "",
      },
    );
    setIsTypeModalOpen(true);
  };

  const openConfigModal = (config: any = null) => {
    setEditingConfig(config);
    setConfigForm(config || { key: "", value: "" });
    setIsConfigModalOpen(true);
  };

  const { data: categoriesCatalog, refresh: refreshCatalog } =
    useCatalog("incident_category");

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
    refreshCatalog();
  };

  // Sub-types fetcher
  useEffect(() => {
    if (editingCategory) {
      fetchCategorySubtypes();
    } else {
      setCategoryTypes([]);
    }
  }, [editingCategory]);

  const fetchCategorySubtypes = async () => {
    if (!editingCategory) return;
    const res = await SettingsService.fetchTypesTable({
      filters: { categoryId: editingCategory.id },
      limit: 100,
      page: 1,
    });
    setCategoryTypes(res.data);
  };

  const handleAddSubtype = async (e: any) => {
    e.preventDefault();
    try {
      await SettingsService.createType({
        categoryId: editingCategory.id,
        ...newSubtypeForm,
      });
      dispatch(showToast({ message: "Sub-tipo agregado", type: "success" }));
      setNewSubtypeForm({ name: "", value: "" });
      setIsAddingSubtype(false);
      fetchCategorySubtypes();
      refresh();
    } catch (err) {
      dispatch(
        showToast({ message: "Error al agregar sub-tipo", type: "error" }),
      );
    }
  };

  const handleDeleteSubtype = async (id: string) => {
    if (!confirm("¿Eliminar este sub-tipo?")) return;
    try {
      await SettingsService.deleteType(id);
      dispatch(showToast({ message: "Sub-tipo eliminado", type: "success" }));
      fetchCategorySubtypes();
      refresh();
    } catch (err) {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  // CATEGORIES
  const fetchCategories = useCallback(
    (params: any) => {
      const p = {
        ...params,
        filters: { ...params.filters, search: searchCat },
      };
      return SettingsService.fetchCategoriesTable(p);
    },
    [searchCat],
  );

  const handleSaveCategory = async (e: any) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await SettingsService.updateCategory(
          editingCategory.id,
          categoryForm,
        );
        dispatch(
          showToast({ message: "Categoría actualizada", type: "success" }),
        );
      } else {
        await SettingsService.createCategory(categoryForm);
        dispatch(showToast({ message: "Categoría creada", type: "success" }));
      }
      setIsCategoryModalOpen(false);
      refresh();
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.response?.data?.messages?.[0] || "Error al guardar",
          type: "error",
        }),
      );
    }
  };

  // TYPES
  const fetchTypes = useCallback(
    (params: any) => {
      const p = {
        ...params,
        filters: { ...params.filters, search: searchType },
      };
      return SettingsService.fetchTypesTable(p);
    },
    [searchType],
  );

  const handleSaveType = async (e: any) => {
    e.preventDefault();
    try {
      const data = { ...typeForm, categoryId: typeForm.categoryId };
      if (editingType) {
        await SettingsService.updateType(editingType.id, data);
        dispatch(showToast({ message: "Tipo actualizado", type: "success" }));
      } else {
        await SettingsService.createType(data);
        dispatch(showToast({ message: "Tipo creado", type: "success" }));
      }
      setIsTypeModalOpen(false);
      refresh();
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.response?.data?.messages?.[0] || "Error al guardar",
          type: "error",
        }),
      );
    }
  };

  // SYSCONFIG
  const fetchSysConfig = useCallback(
    (params: any) => {
      const p = {
        ...params,
        filters: { ...params.filters, search: searchConfig },
      };
      return SettingsService.fetchSysConfigTable(p);
    },
    [searchConfig],
  );

  const handleSaveConfig = async (e: any) => {
    e.preventDefault();
    try {
      await SettingsService.updateSysConfig(configForm.key, configForm.value);
      dispatch(
        showToast({ message: "Configuración guardada", type: "success" }),
      );
      setIsConfigModalOpen(false);
      refresh();
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.response?.data?.messages?.[0] || "Error al guardar",
          type: "error",
        }),
      );
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => refresh(), 500);
    return () => clearTimeout(timer);
  }, [searchCat, searchType, searchConfig]);

  // Tab configuration

  /** Borrado directo desde la tabla (antes se llamaba al servicio en la vista). */
  const deleteCategoryRow = useCallback(
    async (id: string) => {
      const res = await SettingsService.deleteCategory(id);
      if (res.success) {
        showToast({ message: "Categoría eliminada", type: "success" });
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const deleteTypeRow = useCallback(
    async (id: string) => {
      const res = await SettingsService.deleteType(id);
      if (res.success) {
        showToast({ message: "Tipo eliminado", type: "success" });
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const deleteConfigRow = useCallback(
    async (key: string) => {
      const res = await SettingsService.deleteSysConfig(key);
      if (res.success) {
        showToast({ message: "Parámetro eliminado", type: "success" });
        setRefreshKey((prev) => prev + 1);
      } else {
        showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return {
    deleteConfigRow,
    categoriesCatalog,
    deleteCategoryRow,
    deleteTypeRow,
    activeTab,
    categoryForm,
    categoryTypes,
    configForm,
    editingCategory,
    editingConfig,
    editingType,
    fetchCategories,
    fetchCategorySubtypes,
    fetchSysConfig,
    fetchTypes,
    handleAddSubtype,
    handleDeleteSubtype,
    handleSaveCategory,
    handleSaveConfig,
    handleSaveType,
    isAddingSubtype,
    isCategoryModalOpen,
    isConfigModalOpen,
    isTypeModalOpen,
    newSubtypeForm,
    openCategoryModal,
    openConfigModal,
    openTypeModal,
    refresh,
    refreshKey,
    searchCat,
    searchConfig,
    searchType,
    setActiveTab,
    setCategoryForm,
    setCategoryTypes,
    setConfigForm,
    setEditingCategory,
    setEditingConfig,
    setEditingType,
    setIsAddingSubtype,
    setIsCategoryModalOpen,
    setIsConfigModalOpen,
    setIsTypeModalOpen,
    setNewSubtypeForm,
    setRefreshKey,
    setSearchCat,
    setSearchConfig,
    setSearchType,
    setTypeForm,
    typeForm,
  };
};

export type SettingsViewModel = ReturnType<typeof useSettingsPage>;
