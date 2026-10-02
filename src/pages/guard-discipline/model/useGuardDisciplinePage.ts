/**
 * View-model de disciplina de guardias.
 *
 * La lógica se extrajo **tal cual** del componente para no alterar
 * comportamiento; lo que cambió es el acceso a datos, que ahora pasa por
 * `@entities/supervision` (`request` nunca lanza, así que se fue el `try/catch`).
 */
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  createDiscipline,
  deleteDiscipline,
  fetchDisciplinesTable,
  resolveDiscipline,
  uploadDisciplineMedia,
  type IGuardDiscipline,
} from "@entities/supervision";

export const useGuardDisciplinePage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { data: types } = useCatalog("discipline_type");
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
      const res = await fetchDisciplinesTable({
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

  return {
    clients,
    guards,
    categories,
    isResident,
    filteredTypes,
    form,
    handleCreate,
    handleDelete,
    handleFileUpload,
    handleOpenDetail,
    handleResolve,
    media,
    memoizedFetch,
    refreshKey,
    removeMedia,
    resetForm,
    searchTerm,
    selectedClientId,
    selectedRecord,
    setForm,
    setRefreshKey,
    setSearchTerm,
    setSelectedClientId,
    setSelectedRecord,
    setShowCreateModal,
    setShowDeleteModal,
    setShowDetailDialog,
    setStatusFilter,
    setSubmitting,
    setUploadingMedia,
    showCreateModal,
    showDeleteModal,
    showDetailDialog,
    statusFilter,
    submitting,
    uploadingMedia,
  };
};

export type GuardDisciplineViewModel = ReturnType<typeof useGuardDisciplinePage>;
