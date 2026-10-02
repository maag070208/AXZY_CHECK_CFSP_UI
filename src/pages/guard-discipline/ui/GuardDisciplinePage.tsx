import { ModulePage } from "@app/core/components/ModulePage";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
  ITTripleFilter,
  isLightColor,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useMemo } from "react";
import {
  FaClipboardList,
  FaExclamationTriangle,
  FaEye,
  FaGavel,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import GuardDisciplineDetailDialog from "./GuardDisciplineDetailDialog";
import type { IGuardDiscipline } from "@entities/supervision";
import { useGuardDisciplinePage } from "../model/useGuardDisciplinePage";

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
  const {
    clients,
    guards,
    categories,
    isResident,
    filteredTypes,
    form,
    setForm,
    media,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedClientId,
    setSelectedClientId,
    refreshKey,
    setRefreshKey,
    showCreateModal,
    setShowCreateModal,
    showDetailDialog,
    setShowDetailDialog,
    showDeleteModal,
    setShowDeleteModal,
    selectedRecord,
    setSelectedRecord,
    submitting,
    uploadingMedia,
    memoizedFetch,
    resetForm,
    handleFileUpload,
    handleCreate,
    handleOpenDetail,
    handleResolve,
    handleDelete,
    removeMedia,
  } = useGuardDisciplinePage();

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
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: row.category.color || "#F1F5F9",
                    color: row.category.color
                      ? isLightColor(row.category.color) ? "#1e293b" : "#ffffff"
                      : "#475569",
                  }}
                >
                  {row.category.name}
                </span>
              )}
                {row.type && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
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
            <ITBadget color={statusColors[row.status]} size="sm">
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
              variant="outlined"
              size="sm"
              title="Ver detalle"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && (
              <ITButton
                onClick={() => {
                  setSelectedRecord(row);
                  setShowDeleteModal(true);
                }}
                color="error"
                variant="outlined"
                size="sm"
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
    <ModulePage
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
        <ITButton onClick={() => { resetForm(); setShowCreateModal(true); }} color="primary" variant="filled" size="sm">
          <div className="flex items-center gap-1">
            <FaClipboardList size={14} />
            <span className="text-[10px]">Nueva Incidencia</span>
          </div>
        </ITButton>
      }
      onRefresh={() => setRefreshKey((p) => p + 1)}
      refreshKey={refreshKey}
    >

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
      <ITDialog isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="" className="!max-w-md w-full!">
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
                onChange={(val) => {
                  const guard = (guards || []).find((g: any) => g.id === val) as any;
                  setForm((p: any) => ({
                    ...p,
                    guardId: val,
                    clientId: guard?.clientId || p.clientId,
                  }));
                }}
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

            {!isResident && form.guardId && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Cliente:</span>
                  <span className="text-[11px] font-medium text-slate-700">
                    {clients?.find((c: any) => c.id === form.clientId)?.name || "Sin cliente asignado"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
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
        className="!max-w-md w-full!"
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
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </ModulePage>
  );
};

export default GuardDisciplinePage;
