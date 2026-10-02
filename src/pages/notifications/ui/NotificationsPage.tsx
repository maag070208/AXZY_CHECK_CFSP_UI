import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITInput,
  ITLoader,
  ITSelect,
  ITSlideToggle,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FaBell, FaCalendarAlt, FaEdit, FaPaperPlane, FaTrash } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  FREQUENCY_OPTIONS,
  frequencyLabel,
  NOTIFICATION_TYPE_OPTIONS,
  type ScheduledNotification,
} from "@entities/scheduled-notification";
import { ITText } from "@axzydev/axzy_ui_system";
import { ConfirmDialog, DataTableCard, FieldLabel, FormDialog, PageShell, SURFACE, TONES } from "@shared/ui";
import { useNotificationsDeps } from "../model/deps";
import { useNotificationsPage } from "../model/useNotificationsPage";

/** Fondo del icono según el tipo de notificación. */
const typeTile: Record<string, string> = {
  error: TONES.danger.soft,
  warning: TONES.warning.soft,
  success: TONES.success.soft,
  info: TONES.info.soft,
};

/** Vista de notificaciones programadas. */
const NotificationsPage = () => {
  const vm = useNotificationsPage(useNotificationsDeps());

  const columns = useMemo<Column<ScheduledNotification>[]>(
    () => [
      {
        key: "message",
        type: "string",
        label: "Notificación",
        render: (row) => (
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/5 ${typeTile[row.type] ?? TONES.info.soft}`}
            >
              <FaBell size={12} />
            </div>
            <div className="min-w-0">
              <p className={`text-[11px] font-bold uppercase tracking-tight ${SURFACE.strong}`}>
                {row.title || "Sin título"}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-secondary-400">{row.message}</p>
            </div>
          </div>
        ),
      },
      {
        key: "frequency",
        type: "string",
        label: "Programación",
        render: (row) => (
          <div className="flex flex-col">
            <span className={`text-[11px] font-bold uppercase ${SURFACE.strong}`}>
              {frequencyLabel(row.frequency)}
            </span>
            <span className="text-[9px] text-secondary-400">
              {row.timeOfDay && `${row.timeOfDay} hrs`}
              {row.nextSendAt && ` · Próx: ${dayjs(row.nextSendAt).format("DD/MM HH:mm")}`}
              {!row.active && " · PAUSADO"}
            </span>
          </div>
        ),
      },
      {
        key: "sendCount",
        type: "number",
        label: "Envíos",
        render: (row) => <span className={`text-[11px] font-bold tabular-nums ${SURFACE.strong}`}>{row.sendCount}</span>,
      },
      {
        key: "active",
        type: "boolean",
        label: "Estado",
        render: (row) => (
          <ITBadget color={row.active ? "success" : "error"} size="sm">
            {row.active ? "ACTIVO" : "PAUSADO"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        type: "actions",
        label: "Acciones",
        render: (row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <ITButton
              onClick={() => vm.send(row)}
              size="sm"
              variant="outlined"
              color="success"
              title="Enviar ahora"
              disabled={vm.sendingId === row.id}
            >
              {vm.sendingId === row.id ? <ITLoader size="sm" /> : <FaPaperPlane size={14} />}
            </ITButton>
            <ITButton onClick={() => vm.openEdit(row)} size="sm" variant="outlined" color="secondary" title="Editar">
              <FaEdit size={14} />
            </ITButton>
            <ITButton onClick={() => vm.requestDelete(row)} size="sm" variant="outlined" color="error" title="Eliminar">
              <FaTrash size={14} />
            </ITButton>
          </div>
        ),
      },
    ],
    [vm],
  );

  return (
    <PageShell
      title="Notificaciones Programadas"
      subtitle="Configuración de alertas automáticas y recordatorios"
      icon={FaCalendarAlt}
      onRefresh={vm.refresh}
      refreshKey={vm.refreshKey}
      onCreate={vm.openCreate}
      createLabel="Nueva"
      extraFilter={
        <ITTripleFilter
          value={vm.statusFilter}
          onChange={vm.setStatusFilter}
          options={[
            { label: "TODAS", value: "ALL" },
            { label: "ACTIVAS", value: "ACTIVE" },
            { label: "PAUSADAS", value: "INACTIVE" },
          ]}
        />
      }
    >
      <DataTableCard scrollX>
        <div className="min-w-[650px]">
          <ITDataTable<ScheduledNotification>
            key={vm.refreshKey}
            columns={columns}
            fetchData={vm.tableFetch}
            externalFilters={vm.externalFilters}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </DataTableCard>

      <FormDialog
        isOpen={vm.isFormOpen}
        onClose={vm.closeForm}
        title={vm.editing ? "Editar notificación" : "Nueva notificación"}
        size="lg"
        submitLabel={vm.editing ? "Actualizar" : "Crear"}
        onSubmit={vm.save}
        submitting={vm.saving}
        submitDisabled={!vm.canSave}
      >
        <div className="grid grid-cols-2 gap-3">
          <ITSelect
            label="Tipo"
            name="type"
            value={vm.form.type}
            onChange={(e) => vm.setField("type", e.target.value as never)}
            options={NOTIFICATION_TYPE_OPTIONS}
          />
          <ITSelect
            label="Frecuencia"
            name="frequency"
            value={vm.form.frequency}
            onChange={(e) => vm.setField("frequency", e.target.value as never)}
            options={FREQUENCY_OPTIONS}
          />
        </div>

        {vm.form.frequency === "ONCE" ? (
          <ITInput
            label="Fecha y hora de envío"
            name="scheduledAt"
            value={vm.form.scheduledAt}
            onChange={(e) => vm.setField("scheduledAt", e.target.value)}
            onBlur={() => {}}
          />
        ) : (
          <ITInput
            label="Hora de envío"
            name="timeOfDay"
            value={vm.form.timeOfDay}
            onChange={(e) => vm.setField("timeOfDay", e.target.value)}
            onBlur={() => {}}
          />
        )}

        <ITInput
          label="Título (opcional)"
          name="title"
          placeholder="Ej: Cambio de turno"
          value={vm.form.title}
          onChange={(e) => vm.setField("title", e.target.value)}
          onBlur={() => {}}
        />

        <ITInput
          type="textarea"
          label="Mensaje *"
          name="message"
          placeholder="Escribe el mensaje..."
          value={vm.form.message}
          onChange={(e) => vm.setField("message", e.target.value)}
          onBlur={() => {}}
        />

        <div className="flex items-center justify-between rounded-xl border border-secondary-100 bg-secondary-50 p-4 dark:border-secondary-800 dark:bg-secondary-800/50">
          <div>
            <FieldLabel>Notificación activa</FieldLabel>
            <ITText className="text-[10px] text-secondary-400">Desactívala para pausar los envíos</ITText>
          </div>
          <ITSlideToggle isOn={vm.form.active} onToggle={(v) => vm.setField("active", v)} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-secondary-100 bg-secondary-50 p-4 dark:border-secondary-800 dark:bg-secondary-800/50">
          <div>
            <FieldLabel>Notificación persistente</FieldLabel>
            <ITText className="text-[10px] text-secondary-400">El usuario deberá descartarla manualmente</ITText>
          </div>
          <ITSlideToggle isOn={vm.form.persistent} onToggle={(v) => vm.setField("persistent", v)} />
        </div>
      </FormDialog>

      <ConfirmDialog
        isOpen={!!vm.toDelete}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
        loading={vm.deleting}
        variant="danger"
        title="Eliminar notificación"
        message="Esta acción es permanente."
        confirmLabel="Eliminar"
      />
    </PageShell>
  );
};

export default NotificationsPage;
