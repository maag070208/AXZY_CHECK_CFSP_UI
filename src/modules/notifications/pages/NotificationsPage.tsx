import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { post } from "@app/core/axios/axios";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
  ITSelect,
  ITSlideToggle,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { FaBell, FaCalendarAlt, FaEdit, FaPaperPlane, FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  ScheduledNotification,
  createScheduled,
  deleteScheduled,
  getPaginated,
  updateScheduled,
} from "../services/NotificationService";

const FREQ_OPTIONS = [
  { label: "Una vez", value: "ONCE" },
  { label: "Diario", value: "DAILY" },
  { label: "Cada 2 días", value: "EVERY_2_DAYS" },
  { label: "Semanal", value: "WEEKLY" },
  { label: "Cada 2 semanas", value: "EVERY_2_WEEKS" },
  { label: "Mensual", value: "MONTHLY" },
];

const TYPE_OPTIONS = [
  { label: "Informativa", value: "info" },
  { label: "Éxito", value: "success" },
  { label: "Advertencia", value: "warning" },
  { label: "Alerta", value: "error" },
];

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledNotification | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    frequency: "ONCE",
    timeOfDay: "08:00",
    scheduledAt: "",
    persistent: false,
    active: true,
  });

  const externalFilters = useMemo(() => {
    const f: any = {};
    if (statusFilter === "ACTIVE") f.status = "active";
    if (statusFilter === "INACTIVE") f.status = "inactive";
    return f;
  }, [statusFilter]);

  const memoizedFetch = useCallback(
    async (params: any) => {
      return getPaginated({ ...params, filters: { ...params.filters, ...externalFilters } });
    },
    [externalFilters],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", message: "", type: "info", frequency: "ONCE", timeOfDay: "08:00", scheduledAt: "", persistent: false, active: true });
    setIsModalOpen(true);
  };

  const openEdit = (row: ScheduledNotification) => {
    setEditing(row);
    setForm({
      title: row.title || "",
      message: row.message,
      type: row.type,
      frequency: row.frequency || "ONCE",
      timeOfDay: row.timeOfDay || "08:00",
      scheduledAt: row.scheduledAt ? dayjs(row.scheduledAt).format("YYYY-MM-DDTHH:mm") : "",
      persistent: row.persistent,
      active: row.active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.message.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      };
      if (form.frequency === "ONCE") {
        delete payload.timeOfDay;
      }
      const res = editing
        ? await updateScheduled(editing.id, payload)
        : await createScheduled(payload);
      if (res.success) {
        dispatch(showToast({ message: editing ? "Actualizado" : "Creado", type: "success" }));
        setIsModalOpen(false);
        setEditing(null);
        setRefreshKey((p) => p + 1);
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "Error", type: "error" }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] || "Error", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteScheduled(deleteId);
      if (res.success) {
        dispatch(showToast({ message: "Eliminado", type: "success" }));
        setDeleteId(null);
        setRefreshKey((p) => p + 1);
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] || "Error", type: "error" }));
    } finally {
      setDeleting(false);
    }
  };

  const [sendingId, setSendingId] = useState<string | null>(null);
  const handleSendNow = async (row: ScheduledNotification) => {
    setSendingId(row.id);
    try {
      const res = await post("/notifications/send", {
        title: row.title,
        message: row.message,
        type: row.type,
        channel: row.channel || "global",
        userId: row.userId || undefined,
        persistent: row.persistent,
      });
      if ((res as any).success) {
        dispatch(showToast({ message: "Notificación enviada", type: "success" }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] || "Error", type: "error" }));
    } finally {
      setSendingId(null);
    }
  };

  const columns = [
    {
      key: "message",
      label: "Notificación",
      render: (row: ScheduledNotification) => (
        <div className="flex items-start gap-3">
          <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
            row.type === "error" ? "bg-red-50 text-red-500 border-red-100" :
            row.type === "warning" ? "bg-amber-50 text-amber-500 border-amber-100" :
            row.type === "success" ? "bg-emerald-50 text-emerald-500 border-emerald-100" :
            "bg-blue-50 text-blue-500 border-blue-100"
          }`}>
            <FaBell size={12} />
          </div>
          <div>
            <p className="font-bold text-slate-700 text-[11px] uppercase tracking-tight">
              {row.title || "Sin título"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{row.message}</p>
          </div>
        </div>
      ),
    },
    {
      key: "frequency",
      label: "Programación",
      render: (row: ScheduledNotification) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 text-[11px] uppercase">
            {FREQ_OPTIONS.find((f) => f.value === row.frequency)?.label || row.frequency}
          </span>
          <span className="text-[9px] text-slate-400">
            {row.timeOfDay && `${row.timeOfDay} hrs`}
            {row.nextSendAt && ` · Próx: ${dayjs(row.nextSendAt).format("DD/MM HH:mm")}`}
            {!row.active && " · PAUSADO"}
          </span>
        </div>
      ),
    },
    {
      key: "sendCount",
      label: "Envíos",
      render: (row: ScheduledNotification) => (
        <span className="font-bold text-slate-700 text-[11px]">{row.sendCount}</span>
      ),
    },
    {
      key: "active",
      label: "Estado",
      render: (row: ScheduledNotification) => (
        <ITBadget color={row.active ? "success" : "error"} size="small">
          {row.active ? "ACTIVO" : "PAUSADO"}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "ACCIONES",
      render: (row: ScheduledNotification) => (
        <div className="flex items-center flex-wrap gap-1.5">
          <ITButton
            onClick={() => handleSendNow(row)}
            size="small"
            variant="outlined"
            color="success"
            title="Enviar ahora"
            disabled={sendingId === row.id}
          >
            {sendingId === row.id ? <ITLoader size="sm" /> : <FaPaperPlane size={14} />}
          </ITButton>
          <ITButton onClick={() => openEdit(row)} size="small" variant="outlined" title="Editar">
            <FaEdit size={14} />
          </ITButton>
          <ITButton onClick={() => setDeleteId(row.id)} size="small" variant="outlined" color="error" title="Eliminar">
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <ModuleHeader
        title="Notificaciones Programadas"
        subtitle="Configuración de alertas automáticas y recordatorios"
        icon={FaCalendarAlt}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
        onCreate={openCreate}
        createLabel="Nueva"
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "TODAS", value: "ALL" },
              { label: "ACTIVAS", value: "ACTIVE" },
              { label: "PAUSADAS", value: "INACTIVE" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-x-auto">
        <div className="min-w-[650px]">
          <ITDataTable
            key={refreshKey}
            columns={columns as any}
            fetchData={memoizedFetch as any}
            externalFilters={externalFilters as any}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <ITDialog isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title="" className="!max-w-lg !w-full">
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <FaBell size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">{editing ? "Editar" : "Nueva"} Notificación</h3>
                <p className="text-xs text-slate-400 font-light">Programación automática</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <ITSelect
                label="Tipo"
                name="type"
                value={form.type}
                onChange={(e: any) => setForm((p) => ({ ...p, type: e.target.value }))}
                options={TYPE_OPTIONS}
              />
              <ITSelect
                label="Frecuencia"
                name="frequency"
                value={form.frequency}
                onChange={(e: any) => setForm((p) => ({ ...p, frequency: e.target.value }))}
                options={FREQ_OPTIONS}
              />
            </div>

            {form.frequency === "ONCE" ? (
              <ITInput
                label="Fecha y hora de envío"
                name="scheduledAt"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e: any) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                onBlur={() => {}}
              />
            ) : (
              <ITInput
                label="Hora de envío"
                name="timeOfDay"
                type="time"
                value={form.timeOfDay}
                onChange={(e: any) => setForm((p) => ({ ...p, timeOfDay: e.target.value }))}
                onBlur={() => {}}
              />
            )}

            <ITInput
              label="Título (opcional)"
              name="title"
              placeholder="Ej: Cambio de turno"
              value={form.title}
              onChange={(e: any) => setForm((p) => ({ ...p, title: e.target.value }))}
              onBlur={() => {}}
            />

            <ITInput
              type="textarea"
              label="Mensaje *"
              name="message"
              placeholder="Escribe el mensaje..."
              value={form.message}
              onChange={(e: any) => setForm((p) => ({ ...p, message: e.target.value }))}
              onBlur={() => {}}
            />

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-700">Notificación activa</p>
                <p className="text-[10px] text-slate-400">Desactívala para pausar los envíos</p>
              </div>
              <ITSlideToggle isOn={form.active} onToggle={(v) => setForm((p) => ({ ...p, active: v }))} />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-700">Notificación persistente</p>
                <p className="text-[10px] text-slate-400">El usuario deberá descartarla manualmente</p>
              </div>
              <ITSlideToggle isOn={form.persistent} onToggle={(v) => setForm((p) => ({ ...p, persistent: v }))} />
            </div>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton variant="ghost" onClick={() => { setIsModalOpen(false); setEditing(null); }} size="small" className="px-5 shadow shadow-slate-100">Cancelar</ITButton>
            <ITButton variant="filled" color="primary" size="small" className="px-5 shadow shadow-emerald-100" onClick={handleSave} disabled={saving || !form.message.trim()}>
              {saving ? <ITLoader size="sm" color="white" /> : editing ? "Actualizar" : "Crear"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* DELETE */}
      <ITDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="" className="!max-w-md !w-full">
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><FaTrash size={18} /></div>
              <div><h3 className="text-base font-medium text-slate-800">Eliminar</h3><p className="text-xs text-slate-400 font-light">Notificación programada</p></div>
            </div>
          </div>
          <div className="px-8 py-6"><p className="text-sm text-slate-500 text-center">Esta acción es permanente.</p></div>
          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton variant="ghost" onClick={() => setDeleteId(null)} size="small" className="px-5 shadow shadow-slate-100">Cancelar</ITButton>
            <ITButton variant="filled" color="danger" size="small" className="px-5 shadow shadow-rose-100" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default NotificationsPage;
