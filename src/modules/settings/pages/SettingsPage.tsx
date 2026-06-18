import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITSelect,
  ITTabItem,
  ITTabs
} from "@axzydev/axzy_ui_system";
import { cloneElement, useCallback, useEffect, useState } from "react";
import { CirclePicker } from "react-color";
import {
  FaCog,
  FaCogs,
  FaEdit,
  FaGlobe,
  FaLayerGroup,
  FaList,
  FaPlus,
  FaTag,
  FaTags,
  FaTrash,
} from "react-icons/fa";
import {
  MdAccessTime,
  MdAcUnit,
  MdAlarm,
  MdAssignment,
  MdBuild,
  MdBusiness,
  MdCalendarMonth,
  MdCameraAlt,
  MdChat,
  MdCheckCircle,
  MdCleaningServices,
  MdComment,
  MdDescription,
  MdDirectionsCar,
  MdDoorFront,
  MdEmail,
  MdError,
  MdFingerprint,
  MdFlashOn,
  MdHome,
  MdLocalFireDepartment,
  MdLocalGasStation,
  MdLocalParking,
  MdLocalPolice,
  MdLock,
  MdLockOpen,
  MdMedicalServices,
  MdNotifications,
  MdPeople,
  MdPerson,
  MdPets,
  MdPhone,
  MdPlace,
  MdQrCode,
  MdReceiptLong,
  MdSchedule,
  MdSecurity,
  MdShield,
  MdVideocam,
  MdWarningAmber,
  MdWaterDrop,
  MdWhatshot,
  MdWindow,
} from "react-icons/md";
import { useDispatch } from "react-redux";
import * as SettingsService from "../services/SettingsService";

const COMMON_ICONS = [
  { name: "shield-alert", icon: <MdShield /> },
  { name: "account-group", icon: <MdPeople /> },
  { name: "alert-circle", icon: <MdError /> },
  { name: "shield-check", icon: <MdCheckCircle /> },
  { name: "fire", icon: <MdWhatshot /> },
  { name: "fire-department", icon: <MdLocalFireDepartment /> },
  { name: "water", icon: <MdWaterDrop /> },
  { name: "flash", icon: <MdFlashOn /> },
  { name: "lightning-bolt", icon: <MdFlashOn /> },
  { name: "account-alert", icon: <MdPerson /> },
  { name: "cctv", icon: <MdVideocam /> },
  { name: "car-emergency", icon: <MdDirectionsCar /> },
  { name: "medical-bag", icon: <MdMedicalServices /> },
  { name: "tools", icon: <MdBuild /> },
  { name: "broom", icon: <MdCleaningServices /> },
  { name: "clock-outline", icon: <MdAccessTime /> },
  { name: "map-marker", icon: <MdPlace /> },
  { name: "camera", icon: <MdCameraAlt /> },
  { name: "file-document", icon: <MdDescription /> },
  { name: "comment-text", icon: <MdComment /> },
  { name: "security", icon: <MdSecurity /> },
  { name: "lock", icon: <MdLock /> },
  { name: "lock-open-variant", icon: <MdLockOpen /> },
  { name: "fingerprint", icon: <MdFingerprint /> },
  { name: "home", icon: <MdHome /> },
  { name: "office-building", icon: <MdBusiness /> },
  { name: "parking", icon: <MdLocalParking /> },
  { name: "gas-station", icon: <MdLocalGasStation /> },
  { name: "police-badge", icon: <MdLocalPolice /> },
  { name: "door-open", icon: <MdDoorFront /> },
  { name: "window-open", icon: <MdWindow /> },
  { name: "water-pipe", icon: <MdWaterDrop /> },
  { name: "air-conditioner", icon: <MdAcUnit /> },
  { name: "paw", icon: <MdPets /> },
  { name: "bell", icon: <MdNotifications /> },
  { name: "alert", icon: <MdWarningAmber /> },
  { name: "clipboard-text", icon: <MdAssignment /> },
  { name: "qr-code", icon: <MdQrCode /> },
  { name: "file-report", icon: <MdReceiptLong /> },
  { name: "calendar", icon: <MdCalendarMonth /> },
  { name: "calendar-clock", icon: <MdSchedule /> },
  { name: "alarm", icon: <MdAlarm /> },
  { name: "phone", icon: <MdPhone /> },
  { name: "email", icon: <MdEmail /> },
  { name: "chat", icon: <MdChat /> },
];

const SettingsPage = () => {
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
    const res = await SettingsService.getPaginatedIncidentTypes({
      filters: { categoryId: editingCategory.id },
      limit: 100,
      page: 1,
    });
    setCategoryTypes(res.data);
  };

  const handleAddSubtype = async (e: any) => {
    e.preventDefault();
    try {
      await SettingsService.createIncidentType({
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
      await SettingsService.deleteIncidentType(id);
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
      return SettingsService.getPaginatedIncidentCategories(p);
    },
    [searchCat],
  );

  const handleSaveCategory = async (e: any) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await SettingsService.updateIncidentCategory(
          editingCategory.id,
          categoryForm,
        );
        dispatch(
          showToast({ message: "Categoría actualizada", type: "success" }),
        );
      } else {
        await SettingsService.createIncidentCategory(categoryForm);
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
      return SettingsService.getPaginatedIncidentTypes(p);
    },
    [searchType],
  );

  const handleSaveType = async (e: any) => {
    e.preventDefault();
    try {
      const data = { ...typeForm, categoryId: typeForm.categoryId };
      if (editingType) {
        await SettingsService.updateIncidentType(editingType.id, data);
        dispatch(showToast({ message: "Tipo actualizado", type: "success" }));
      } else {
        await SettingsService.createIncidentType(data);
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
      return SettingsService.getPaginatedSysConfig(p);
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
  const tabs: ITTabItem[] = [
    {
      id: "CATEGORIES",
      label: "Categorías",
      icon: <FaLayerGroup />,
      content: (
        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <ITDataTable
            key={`cat-${refreshKey}`}
            title=""
            defaultItemsPerPage={10}
            fetchData={fetchCategories as any}
            columns={[
              {
                key: "name",
                label: "IDENTIFICACIÓN / VALOR",
                type: "string",
                render: (row: any) => {
                  const matchedIcon = COMMON_ICONS.find((i) => i.name === row.icon);
                  return (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: row.color || "#64748b", color: "#ffffff" }}
                      >
                        {matchedIcon ? cloneElement(matchedIcon.icon, { color: "#ffffff" } as any) : <FaLayerGroup color="#ffffff" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                          {row.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: row.color || "#64748b" }}
                          />
                          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                            VALOR: {row.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "type",
                label: "CLASIFICACIÓN",
                type: "string",
                render: (row: any) => (
                  <ITBadget
                    color={row.type === "INCIDENT" ? "warning" : row.type === "MAINTENANCE" ? "info" : "error"}
                    size="small"
                  >
                    {row.type === "INCIDENT" ? "INCIDENTE" : row.type === "MAINTENANCE" ? "MANTENIMIENTO" : "DISCIPLINA"}
                  </ITBadget>
                ),
              },
              {
                key: "actions",
                label: "CONTROL",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex items-center gap-2">
                    <ITButton
                      size="small"
                      variant="outlined"
                      onClick={() => openCategoryModal(row)}
                      title="Editar"
                    >
                      <FaEdit size={14} />
                    </ITButton>
                    <ITButton
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        if (confirm("¿Eliminar?")) {
                          await SettingsService.deleteIncidentCategory(row.id);
                          refresh();
                        }
                      }}
                      title="Eliminar"
                    >
                      <FaTrash size={14} />
                    </ITButton>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      id: "TYPES",
      label: "Tipos de Incidentes",
      icon: <FaTags />,
      content: (
        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <ITDataTable
            key={`type-${refreshKey}`}
            title=""
            defaultItemsPerPage={10}
            fetchData={fetchTypes as any}
            columns={[
              {
                key: "name",
                label: "TIPO / CATEGORÍA",
                type: "string",
                render: (row: any) => (
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                      {row.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                        CAT: {row.category?.name || "SIN CATEGORÍA"}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "actions",
                label: "CONTROL",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex items-center gap-2">
                    <ITButton
                      size="small"
                      variant="outlined"
                      onClick={() => openTypeModal(row)}
                      title="Editar"
                    >
                      <FaEdit size={14} />
                    </ITButton>
                    <ITButton
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        if (confirm("¿Eliminar?")) {
                          await SettingsService.deleteIncidentType(row.id);
                          refresh();
                        }
                      }}
                      title="Eliminar"
                    >
                      <FaTrash size={14} />
                    </ITButton>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      id: "SYSCONFIG",
      label: "Configuración Global",
      icon: <FaGlobe />,
      content: (
        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <ITDataTable
            key={`sys-${refreshKey}`}
            title=""
            defaultItemsPerPage={10}
            fetchData={fetchSysConfig as any}
            columns={[
              {
                key: "key",
                label: "PARÁMETRO / CLAVE",
                type: "string",
                render: (row: any) => (
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                      {row.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                        CONFIGURACIÓN INTERNA
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "value",
                label: "VALOR ACTUAL",
                type: "string",
                render: (row: any) => (
                   <code className="bg-slate-50 px-2.5 py-1.5 rounded-lg text-sky-500 text-[11px] font-bold border border-slate-100">
                    {row.value}
                  </code>
                ),
              },
              {
                key: "actions",
                label: "CONTROL",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex items-center gap-2">
                    <ITButton
                      size="small"
                      variant="outlined"
                      onClick={() => openConfigModal(row)}
                      title="Editar"
                    >
                      <FaEdit size={14} />
                    </ITButton>
                    <ITButton
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={async () => {
                        if (confirm("¿Eliminar?")) {
                          await SettingsService.deleteSysConfig(row.key);
                          refresh();
                        }
                      }}
                      title="Eliminar"
                    >
                      <FaTrash size={14} />
                    </ITButton>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-10 min-h-screen bg-slate-50/50">
      <ModuleHeader
        title="Configuración del Sistema"
        subtitle="Administración de catálogos y parámetros globales"
        icon={FaCogs}
        search={{
          value:
            activeTab === "CATEGORIES"
              ? searchCat
              : activeTab === "TYPES"
                ? searchType
                : searchConfig,
          onChange: (val) => {
            if (activeTab === "CATEGORIES") setSearchCat(val);
            else if (activeTab === "TYPES") setSearchType(val);
            else setSearchConfig(val);
          },
          placeholder: "BUSCAR...",
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
        onCreate={() => {
          if (activeTab === "CATEGORIES") openCategoryModal();
          else if (activeTab === "TYPES") openTypeModal();
          else openConfigModal();
        }}
        createLabel="Agregar"
      />

      <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/40 border border-white">
        <ITTabs
          items={tabs}
          defaultActiveId={activeTab}
          onChange={(id: string) => setActiveTab(id as any)}
        />
      </div>

      {/* Modals Improvements */}
      <ITDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaTag size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</h3>
                <p className="text-xs text-slate-400 font-light">Configuración del sistema</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <ITInput
              label="Nombre Interno (Mayúsculas)"
              name="name"
              value={categoryForm.name}
              onChange={(e: any) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              onBlur={() => {}}
              placeholder="EJ: SEGURIDAD"
              required
            />
            <ITInput
              label="Valor (Nombre a mostrar)"
              name="value"
              value={categoryForm.value}
              onChange={(e: any) =>
                setCategoryForm({ ...categoryForm, value: e.target.value })
              }
              onBlur={() => {}}
              placeholder="EJ: Seguridad"
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Tipo de Aplicación
              </label>
              <ITSelect
                name=""
                className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-sky-500 transition-all text-sm font-bold text-slate-700"
                value={categoryForm.type}
                onChange={(e: any) =>
                  setCategoryForm({ ...categoryForm, type: e.target.value })
                }
                options={[
                  { label: "Incidente", value: "INCIDENT" },
                  { label: "Mantenimiento", value: "MAINTENANCE" },
                  { label: "Disciplina", value: "DISCIPLINE" },
                ]}
              />
               
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Ícono (App Móvil)
              </label>
              <div className="grid grid-cols-8 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                {COMMON_ICONS.map((ico) => (
                  <button
                    key={ico.name}
                    type="button"
                    onClick={() =>
                      setCategoryForm({ ...categoryForm, icon: ico.name })
                    }
                    className={`flex items-center justify-center p-2 rounded-xl transition-all ${categoryForm.icon === ico.name ? "bg-sky-500 text-white shadow-lg shadow-sky-100" : "bg-white text-slate-400 hover:text-sky-500 hover:bg-sky-50 border border-slate-100"}`}
                    title={ico.name}
                  >
                    <span className="text-xl">{ico.icon}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  Seleccionado:
                </span>
                <code className="text-xs font-medium text-sky-500">
                  {categoryForm.icon || "alert-circle"}
                </code>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Color de la Categoría
              </label>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-center shadow-inner">
                <CirclePicker
                  color={categoryForm.color}
                  onChangeComplete={(color) =>
                    setCategoryForm({ ...categoryForm, color: color.hex })
                  }
                  width="100%"
                  circleSize={26}
                  circleSpacing={14}
                />
              </div>
            </div>
            {/* Sub-types */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <FaTags className="text-sky-500" />
                  Sub-tipos Asociados
                </h3>
                {editingCategory && !isAddingSubtype && (
                  <ITButton
                    size="small"
                    variant="outlined"
                    onClick={() => setIsAddingSubtype(true)}
                    className="text-sky-500 font-medium text-xs p-1"
                  >
                    <FaPlus />
                  </ITButton>
                )}
              </div>
              {!editingCategory ? (
                <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <FaLayerGroup className="text-slate-200 text-4xl mb-3" />
                  <p className="text-slate-400 text-sm">
                    Crea la categoría primero para gestionar sus sub-tipos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {isAddingSubtype && (
                    <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <form onSubmit={handleAddSubtype} className="space-y-3">
                        <ITInput
                          label="Nombre del Sub-tipo"
                          name="st_name"
                          value={newSubtypeForm.name}
                          onChange={(e: any) =>
                            setNewSubtypeForm({
                              ...newSubtypeForm,
                              name: e.target.value,
                            })
                          }
                          onBlur={() => {}}
                          required
                        />
                        <ITInput
                          label="Valor/Código"
                          name="st_value"
                          value={newSubtypeForm.value}
                          onChange={(e: any) =>
                            setNewSubtypeForm({
                              ...newSubtypeForm,
                              value: e.target.value,
                            })
                          }
                          onBlur={() => {}}
                          required
                        />
                        <div className="flex justify-end gap-2">
                          <ITButton
                            type="button"
                            size="small"
                            variant="ghost"
                            onClick={() => setIsAddingSubtype(false)}
                          >
                            Cancelar
                          </ITButton>
                          <ITButton
                            type="submit"
                            size="small"
                            color="primary"
                            className="rounded-xl"
                          >
                            Confirmar
                          </ITButton>
                        </div>
                      </form>
                    </div>
                  )}
                  <div className="pr-2 space-y-2">
                    {categoryTypes.length === 0 && !isAddingSubtype ? (
                      <p className="text-slate-400 text-xs italic text-center py-4">
                        No hay sub-tipos registrados.
                      </p>
                    ) : (
                      categoryTypes.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:border-sky-200 transition-all shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {t.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {t.value}
                            </p>
                          </div>
                          <ITButton
                            size="small"
                            variant="outlined"
                            onClick={() => handleDeleteSubtype(t.id)}
                            color="danger"
                          >
                            <FaTrash size={12} />
                          </ITButton>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setIsCategoryModalOpen(false)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleSaveCategory as any}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-sky-100"
            >
              Guardar Cambios
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Type Modal */}
      <ITDialog
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaList size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">{editingType ? "Editar Tipo" : "Nuevo Tipo"}</h3>
                <p className="text-xs text-slate-400 font-light">Configuración del sistema</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSaveType}>
            <div className="px-8 py-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Categoría Padre
                </label>
                <select
                  name="categoryId"
                  className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-sky-500 transition-all text-sm font-medium text-slate-700"
                  value={typeForm.categoryId}
                  onChange={(e: any) =>
                    setTypeForm({ ...typeForm, categoryId: e.target.value })
                  }
                  required
                >
                  <option value="">Selecciona categoría</option>
                  {(categoriesCatalog || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <ITInput
                label="Nombre del Tipo"
                name="name"
                value={typeForm.name}
                onChange={(e: any) =>
                  setTypeForm({ ...typeForm, name: e.target.value })
                }
                onBlur={() => {}}
                required
              />
              <ITInput
                label="Valor (Símbolo)"
                name="value"
                value={typeForm.value}
                onChange={(e: any) =>
                  setTypeForm({ ...typeForm, value: e.target.value })
                }
                onBlur={() => {}}
                required
              />
            </div>
            <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
              <ITButton
                variant="ghost"
                onClick={() => setIsTypeModalOpen(false)}
                size="small"
                className="px-5 whitespace-nowrap shadow shadow-slate-100"
              >
                Cancelar
              </ITButton>
              <ITButton
                variant="filled"
                color="primary"
                type="submit"
                size="small"
                className="px-5 whitespace-nowrap shadow shadow-sky-100"
              >
                Guardar Tipo
              </ITButton>
            </div>
          </form>
        </div>
      </ITDialog>

      {/* Config Modal */}
      <ITDialog
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaCog size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">{editingConfig ? "Editar Parámetro" : "Nuevo Parámetro"}</h3>
                <p className="text-xs text-slate-400 font-light">Configuración del sistema</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSaveConfig}>
            <div className="px-8 py-6 space-y-4">
              <ITInput
                label="Clave del Sistema"
                name="key"
                value={configForm.key}
                onChange={(e: any) =>
                  setConfigForm({ ...configForm, key: e.target.value })
                }
                onBlur={() => {}}
                required
                readOnly={!!editingConfig}
              />
              <ITInput
                label="Valor Configurado"
                name="value"
                value={configForm.value}
                onChange={(e: any) =>
                  setConfigForm({ ...configForm, value: e.target.value })
                }
                onBlur={() => {}}
                required
              />
            </div>
            <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
              <ITButton
                variant="ghost"
                onClick={() => setIsConfigModalOpen(false)}
                size="small"
                className="px-5 whitespace-nowrap shadow shadow-slate-100"
              >
                Cancelar
              </ITButton>
              <ITButton
                variant="filled"
                color="primary"
                type="submit"
                size="small"
                className="px-5 whitespace-nowrap shadow shadow-sky-100"
              >
                Guardar Parámetro
              </ITButton>
            </div>
          </form>
        </div>
      </ITDialog>
    </div>
  );
};

export default SettingsPage;
