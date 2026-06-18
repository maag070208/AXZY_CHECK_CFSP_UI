import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaExclamationTriangle,
  FaEye,
  FaGavel,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { showToast } from "@app/core/store/toast/toast.slice";
import GuardDisciplineDetailDialog from "../components/GuardDisciplineDetailDialog";
import {
  createDiscipline,
  deleteDiscipline,
  getPaginatedDisciplines,
  IGuardDiscipline,
  resolveDiscipline,
  uploadDisciplineMedia,
} from "../services/GuardDisciplineService";

dayjs.extend(utc);
dayjs.extend(timezone);

const statusColors: Record<string, "warning" | "success" | "error"> = {
  PENDING: "warning",
  RESOLVED: "success",
  DISMISSED: "error",
};

const statusLabels: Record<string, string> = {
  PENDING: "PENDIENTE",
  RESOLVED: "RESUELTO",
  DISMISSED: "DESESTIMADO",
};

const GuardDisciplinePage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string | number>(
    searchParams.get("clientId") || "",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IGuardDiscipline | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    guardId: "",
    categoryId: "",
    typeId: "",
    description: "",
    clientId: "",
  });
  const [media, setMedia] = useState<{ url: string; type: "photo" | "video" }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const { data: clients } = useCatalog("client");
  const { data: guards } = useCatalog("guard");
  const { data: categories } = useCatalog("discipline_category");
  const { data: types } = useCatalog("discipline_type");
  const user = useSelector((state: any) => state.auth);
  const isResident = user?.role === "RESDN";

  const filteredTypes = useMemo(
    () => (form.categoryId ? types.filter((t: any) => t.categoryId === form.categoryId) : []),
    [form.categoryId, types],
  );

  const externalFilters = useMemo(() => {
    const filters: any = {};
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (statusFilter === "PENDING") filters.status = "PENDING";
    else if (statusFilter === "RESOLVED") filters.status = "RESOLVED";
    else if (statusFilter === "DISMISSED") filters.status = "DISMISSED";
    if (selectedClientId) filters.clientId = selectedClientId;
    else if (isResident && user?.clientId) filters.clientId = user.clientId;
    return filters;
  }, [searchTerm, statusFilter, selectedClientId, isResident, user?.clientId]);

  const memoizedFetch = useCallback(
    async (params: any) => {
      const res = await getPaginatedDisciplines({
        ...params,
        filters: { ...params.filters, ...externalFilters },
        sort: params.sort || { key: "createdAt", direction: "desc" },
      });
      return res;
    },
    [externalFilters],
  );

  const resetForm = () => {
    setForm({ guardId: "", categoryId: "", typeId: "", description: "", clientId: "" });
    setMedia([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    for (const file of Array.from(files)) {
      const res = await uploadDisciplineMedia(file);
      if (res.success && res.data) {
        setMedia((prev) => [...prev, res.data!]);
      }
    }
    setUploadingMedia(false);
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    const missing: string[] = [];
    if (!form.guardId) missing.push("Guardia");
    if (!form.categoryId) missing.push("Categoría");
    if (!form.typeId) missing.push("Tipo");
    if (missing.length > 0) {
      dispatch(showToast({ message: `Campos obligatorios: ${missing.join(", ")}`, type: "error" }));
      return;
    }
    const selectedType = types.find((t: any) => t.id === form.typeId);
    const title = selectedType?.value || "Incidencia a Guardia";
    setSubmitting(true);
    const mediaUrls = media.filter((m) => !!m.url).map((m) => ({ url: m.url, type: m.type }));
    const res = await createDiscipline({
      guardId: form.guardId,
      title,
      categoryId: form.categoryId,
      typeId: form.typeId,
      description: form.description?.trim() || null,
      clientId: form.clientId || user?.clientId || null,
      media: mediaUrls.length > 0 ? mediaUrls : undefined,
    });
    setSubmitting(false);
    if (res.success) {
      dispatch(showToast({ message: "Incidencia creada correctamente", type: "success" }));
      setShowCreateModal(false);
      resetForm();
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: res.messages?.[0] || "Error al crear", type: "error" }));
    }
  };

  const handleOpenDetail = (record: IGuardDiscipline) => {
    setSelectedRecord(record);
    setShowDetailDialog(true);
  };

  const handleResolve = async (id: string, status: "RESOLVED" | "DISMISSED", reason?: string) => {
    setSubmitting(true);
    const res = await resolveDiscipline(id, {
      status,
      description: reason || undefined,
    });
    setSubmitting(false);
    if (res.success) {
      dispatch(showToast({ message: "Incidencia actualizada", type: "success" }));
      setShowDetailDialog(false);
      setSelectedRecord(null);
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar", type: "error" }));
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    const res = await deleteDiscipline(selectedRecord.id);
    setSubmitting(false);
    if (res.success) {
      dispatch(showToast({ message: "Registro eliminado", type: "success" }));
      setShowDeleteModal(false);
      setShowDetailDialog(false);
      setSelectedRecord(null);
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" }));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "guard",
        label: "GUARDIA",
        sortable: false,
        render: (row: IGuardDiscipline) => (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleOpenDetail(row)}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 font-medium border border-rose-100 text-sm">
               {row.guard.name?.[0]}
               {row.guard.lastName?.[0]}
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700 block">
                {row.guard.name} {row.guard.lastName}
              </span>
              <span className="text-[10px] text-slate-400 font-light block">
                @{row.guard.username}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "title",
        label: "INCIDENCIA",
        render: (row: IGuardDiscipline) => (
          <div
            className="flex flex-col cursor-pointer"
            onClick={() => handleOpenDetail(row)}
          >
            <span className="text-sm font-medium text-slate-700">
              {row.title}
            </span>
            {row.description && (
              <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{row.description}</span>
            )}
            <div className="flex gap-1.5 mt-1">
              {row.category && (
                <span
                    className="text-[9px] font-light px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: row.category.color || "#F1F5F9", color: "#475569" }}
                  >
                    {row.category.name}
                  </span>
                )}
                {row.type && (
                  <span className="text-[9px] font-light px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {row.type.name}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "createdBy",
        label: "ASIGNADO POR",
        sortable: false,
        render: (row: IGuardDiscipline) => (
          <div className="cursor-pointer" onClick={() => handleOpenDetail(row)}>
            <span className="text-sm font-medium text-slate-700">
              {row.createdBy.name} {row.createdBy.lastName}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: IGuardDiscipline) => (
          <div className="cursor-pointer" onClick={() => handleOpenDetail(row)}>
            <ITBadget color={statusColors[row.status]} size="small">
              {statusLabels[row.status]}
            </ITBadget>
          </div>
        ),
      },
      {
        key: "createdAt",
        label: "FECHA",
        render: (row: IGuardDiscipline) => (
          <div className="cursor-pointer" onClick={() => handleOpenDetail(row)}>
            <span className="text-[10px] font-medium text-slate-700 font-mono">
              {dayjs(row.createdAt).tz("America/Tijuana").format("DD MMM HH:mm")} HRS
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        label: "",
        width: 120,
        render: (row: IGuardDiscipline) => (
          <div className="flex items-center gap-1">
            <ITButton
              onClick={() => handleOpenDetail(row)}
              color="secondary"
              variant="ghost"
              size="small"
              title="Ver detalle"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && (
              <ITButton
                onClick={() => handleOpenDetail(row)}
                color="success"
                variant="outlined"
                size="small"
                title="Resolver"
              >
                <FaGavel size={14} />
              </ITButton>
            )}
            {row.status === "PENDING" && (
              <ITButton
                onClick={() => {
                  setSelectedRecord(row);
                  setShowDeleteModal(true);
                }}
                color="error"
                variant="outlined"
                size="small"
                title="Eliminar"
              >
                <FaTrash size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Incidencia a Guardias"
        subtitle="Registro de incidencias disciplinarias asignadas a guardias operativos"
        icon={FaExclamationTriangle}
        filter={
          !isResident && (
            <ITSearchSelect
              placeholder="FILTRAR POR CLIENTE..."
              options={(clients || []).map((c: any) => ({ label: c.name, value: c.id }))}
              value={selectedClientId}
              onChange={(val) => { setSelectedClientId(val); setRefreshKey((p) => p + 1); }}
              className="w-full"
            />
          )
        }
        search={{
          value: searchTerm,
          onChange: (val: string) => { setSearchTerm(val); setRefreshKey((p) => p + 1); },
          placeholder: "BUSCAR GUARDIA...",
          icon: FaUserShield,
        }}
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setRefreshKey((p) => p + 1); }}
            options={[
              { label: "TODOS", value: "ALL" },
              { label: "PENDIENTES", value: "PENDING" },
              { label: "RESUELTOS", value: "RESOLVED" },
              { label: "DESESTIMADOS", value: "DISMISSED" },
            ]}
          />
        }
        actions={
          <ITButton onClick={() => { resetForm(); setShowCreateModal(true); }} color="primary" variant="filled" size="small">
            <div className="flex items-center gap-1">
              <FaClipboardList size={14} />
              <span className="text-[10px]">Nueva Incidencia</span>
            </div>
          </ITButton>
        }
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable<IGuardDiscipline & Record<string, unknown>>
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* Create Modal */}
      <ITDialog isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="" className="!max-w-md !w-full">
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaGavel size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Asignar Incidencia</h3>
                <p className="text-xs text-slate-400 font-light">Registro disciplinario</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-6 space-y-4">
            {/* Guardia */}
            <div className="space-y-3">
              <ITSearchSelect
                placeholder="SELECCIONAR GUARDIA..."
                options={(guards || []).map((g: any) => ({ label: g.value, value: g.id }))}
                value={form.guardId}
                onChange={(val) => setForm((p: any) => ({ ...p, guardId: val }))}
              />
            </div>

            {/* Clasificación */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ITSearchSelect
                  placeholder="SELECCIONAR..."
                  options={(categories || []).map((c: any) => ({ label: c.name, value: c.id }))}
                  value={form.categoryId}
                  onChange={(val) => setForm((p: any) => ({ ...p, categoryId: val, typeId: "" }))}
                />
                <ITSearchSelect
                  placeholder="SELECCIONAR..."
                  options={filteredTypes.map((t: any) => ({ label: t.name, value: t.id }))}
                  value={form.typeId}
                  onChange={(val) => setForm((p: any) => ({ ...p, typeId: val }))}
                  disabled={!form.categoryId}
                />
              </div>
            </div>

            {/* Detalles */}
            <div className="space-y-3">
              <ITInput
                type="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                placeholder="DETALLES" name={""} />
            </div>

            {/* Evidencia */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {media.map((m, i) => (
                  <div key={i} className="relative group">
                    {m.type === "photo" ? (
                      <img src={m.url} alt="evidencia" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-200">
                        <span className="text-[8px] font-medium text-white uppercase">Video</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploadingMedia && (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <ITLoader size="sm" />
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingMedia}
                />
                <span className="text-[10px] text-slate-400 font-light">
                  {uploadingMedia ? "Subiendo..." : "+ Agregar archivo"}
                </span>
              </label>
            </div>

            {!isResident && (
              <div className="space-y-3">
                <ITSearchSelect
                  placeholder="SELECCIONAR CLIENTE..."
                  options={(clients || []).map((c: any) => ({ label: c.name, value: c.id }))}
                  value={form.clientId}
                  onChange={(val) => setForm((p: any) => ({ ...p, clientId: val }))}
                />
              </div>
            )}
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              size="small"
              onClick={() => setShowCreateModal(false)}
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="small"
              onClick={handleCreate}
              disabled={submitting}
              className="px-5 whitespace-nowrap shadow shadow-sky-100"
            >
              {submitting ? <ITLoader size="sm" /> : "Crear"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Detail Dialog */}
      <GuardDisciplineDetailDialog
        isOpen={showDetailDialog}
        onClose={() => { setShowDetailDialog(false); setSelectedRecord(null); }}
        record={selectedRecord}
        onResolve={handleResolve}
        onDelete={(record) => { setShowDetailDialog(false); setSelectedRecord(record); setShowDeleteModal(true); }}
        isAdmin={!isResident}
        resolveLoading={submitting}
      />



      {/* DELETE DISCIPLINE DIALOG */}
      <ITDialog
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <FaTrash size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Eliminar Incidencia</h3>
                <p className="text-xs text-slate-400 font-light">{selectedRecord?.title || "Registro"}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará el registro de incidencia de forma permanente.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              size="small"
              onClick={() => setShowDeleteModal(false)}
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default GuardDisciplinePage;
