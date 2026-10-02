import {
  ITBadget,
  ITButton,
  ITDatePicker,
  ITEmptyState,
  ITSearchSelect,
  ITSegmentedControl,
  ITSkeleton,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";

import { FaChevronLeft, FaChevronRight, FaClipboardCheck, FaSync, FaTshirt } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useAgendaBoard, type AgendaStatusFilter } from "../model/useAgendaBoard";
import { ScoreRing } from "@app/core/components/ScoreRing";
import { useCatalog } from "@app/core/hooks/catalog.hook";

import { type IAgendaItem, type IAgendaSummary } from "@entities/supervision";
import {
  AGENDA_STATUS_META,
  describeSummary,
  formatShiftDate,
  formatTime,
  fullName,
  todayShiftDate,
} from "@app/core/utils/supervision.utils";





interface AgendaBoardProps {
  canRegister: boolean;
  isClient: boolean;
  /** Cambia cuando se edita la programación. */
  reloadKey: number;
  onConfigure?: () => void;
}

/**
 * Agenda del día: por cliente y turno, la entrega de turno y la revisión de
 * uniforme de cada guardia, con su estado y acceso directo para registrarlas.
 */
export const AgendaBoard = ({ canRegister, isClient, reloadKey, onConfigure }: AgendaBoardProps) => {
  const navigate = useNavigate();
  const { data: clients } = useCatalog("client");
  const {
    date,
    setDate,
    clientId,
    setClientId,
    filter,
    setFilter,
    agenda,
    groupsByClient,
    loading,
    error,
    reload,
  } = useAgendaBoard({ reloadKey });

  const shiftDay = (delta: number) => setDate((d) => dayjs(d).add(delta, "day").format("YYYY-MM-DD"));

  const registerHandover = (i: IAgendaItem) =>
    navigate(`/shift-handovers/new?clientId=${i.client.id}&scheduleId=${i.schedule.id}&shiftDate=${i.shiftDate}`);
  const reviewUniform = (i: IAgendaItem) =>
    navigate(`/uniforms?nuevo=1&guardId=${i.guard?.id}&shiftDate=${i.shiftDate}`);


  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <ITButton variant="outlined" color="secondary" size="sm" onClick={() => shiftDay(-1)} title="Día anterior">
            <FaChevronLeft size={11} />
          </ITButton>
          <div className="w-44">
            <ITDatePicker
              name="agendaDate"
              size="sm"
              value={dayjs(date).toDate()}
              onChange={(e) => {
                const v = e.target.value;
                if (v instanceof Date) setDate(dayjs(v).format("YYYY-MM-DD"));
              }}
            />
          </div>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={() => shiftDay(1)} title="Día siguiente">
            <FaChevronRight size={11} />
          </ITButton>
          {date !== todayShiftDate() && (
            <ITButton variant="text" color="primary" size="sm" onClick={() => setDate(todayShiftDate())}>
              Hoy
            </ITButton>
          )}
          {!isClient && (
            <div className="w-56">
              <ITSearchSelect
                size="sm"
                placeholder="Todos los clientes"
                options={clients.map((c) => ({ label: c.name, value: String(c.id) }))}
                value={clientId}
                clearable
                onClear={() => setClientId("")}
                onChange={(v) => setClientId(String(v))}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ITSegmentedControl
            size="sm"
            value={filter}
            onChange={(v) => setFilter(v as AgendaStatusFilter)}
            options={[
              { value: "all", label: "Todo" },
              { value: "pending", label: "Pendientes" },
              { value: "overdue", label: "Vencidos" },
              { value: "done", label: "Realizados" },
            ]}
          />
          <ITButton variant="outlined" color="secondary" size="sm" onClick={() => reload()} title="Refrescar">
            <FaSync size={11} className={loading ? "animate-spin" : ""} />
          </ITButton>
        </div>
      </div>

      {agenda && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SummaryCard icon={<FaClipboardCheck />} title="Entregas de turno" summary={agenda.handoverSummary} />
          <SummaryCard icon={<FaTshirt />} title="Revisiones de uniforme" summary={agenda.uniformSummary} />
        </div>
      )}

      {loading && !agenda ? (
        <div className="space-y-3">
          <ITSkeleton variant="rectangular" height={120} className="rounded-2xl" />
          <ITSkeleton variant="rectangular" height={120} className="rounded-2xl" />
        </div>
      ) : error ? (
        <ITEmptyState title="No se pudo cargar la agenda" description={error} action={<ITButton label="Reintentar" onClick={() => reload()} />} />
      ) : agenda && agenda.items.length === 0 ? (
        <ITEmptyState
          icon={<FaClipboardCheck />}
          title="Nada programado para este día"
          description="Programa los turnos de tus clientes para generar entregas y revisiones de uniforme."
          action={onConfigure ? <ITButton color="primary" label="Configurar programación" onClick={onConfigure} /> : undefined}
        />
      ) : groupsByClient.length === 0 ? (
        <ITEmptyState title="Sin resultados" description="No hay compromisos con este filtro." />
      ) : (
        <div className="space-y-6">
          {groupsByClient.map(({ client, shifts }) => (
            <section key={client} className="space-y-3">
              <ITText className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{client}</ITText>
              {shifts.map((g) => (
                <div key={g.key} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-slate-50/70 border-b border-slate-100">
                    <div>
                      <ITText className="text-sm font-black text-slate-800">
                        {g.item.schedule.name}{" "}
                        <span className="font-semibold text-slate-400">
                          {g.item.schedule.startTime} - {g.item.schedule.endTime}
                        </span>
                      </ITText>
                      <ITText className="text-[11px] text-slate-500">
                        {formatShiftDate(g.item.shiftDate)} · vence {formatTime(g.item.dueAt)}
                      </ITText>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {g.handover && (
                      <Row
                        icon={<FaClipboardCheck />}
                        title="Entrega de turno"
                        subtitle={g.handover.record ? `Registró ${g.handover.record.by} a las ${formatTime(g.handover.record.createdAt)}` : undefined}
                        item={g.handover}
                        action={
                          g.handover.record ? (
                            <ITButton variant="text" color="secondary" size="sm" onClick={() => navigate(`/shift-handovers?detalle=${g.handover!.record!.id}`)}>
                              Ver
                            </ITButton>
                          ) : canRegister && g.handover.status !== "UPCOMING" ? (
                            <ITButton color="primary" size="sm" onClick={() => registerHandover(g.handover!)}>
                              Registrar entrega
                            </ITButton>
                          ) : null
                        }
                      />
                    )}
                    {g.uniforms.map((u) => (
                      <Row
                        key={u.id}
                        icon={<FaTshirt />}
                        title={`Uniforme · ${fullName(u.guard)}`}
                        subtitle={
                          u.record
                            ? `${u.record.score}% · ${u.record.compliant ? "cumple" : "no cumple"} · ${u.record.by}`
                            : undefined
                        }
                        item={u}
                        action={
                          u.record ? (
                            <ITButton variant="text" color="secondary" size="sm" onClick={() => navigate(`/uniforms?detalle=${u.record!.id}`)}>
                              Ver
                            </ITButton>
                          ) : canRegister && u.status !== "UPCOMING" ? (
                            <ITButton variant="outlined" color="primary" size="sm" onClick={() => reviewUniform(u)}>
                              Revisar
                            </ITButton>
                          ) : null
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ icon, title, summary }: { icon: React.ReactNode; title: string; summary: IAgendaSummary }) => {
  const hasItems = summary.total > 0;
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white">
      {hasItems ? (
        <ScoreRing percent={summary.compliancePercent} size={58} />
      ) : (
        <span className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center text-xl shrink-0">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-slate-400">
          {hasItems && icon}
          <ITText className="text-sm font-black text-slate-800">{title}</ITText>
        </div>
        <ITText className="text-xs text-slate-500">
          {hasItems ? describeSummary(summary) : "Sin compromisos programados"}
        </ITText>
      </div>
    </div>
  );
};

const Row = ({
  icon,
  title,
  subtitle,
  item,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  item: IAgendaItem;
  action: React.ReactNode;
}) => {
  const meta = AGENDA_STATUS_META[item.status];
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs">{icon}</span>
        <div className="min-w-0">
          <ITText className="text-sm font-bold text-slate-800 truncate">{title}</ITText>
          {subtitle && <ITText className="text-xs text-slate-500 truncate">{subtitle}</ITText>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ITBadget color={meta.color} size="sm">
          {meta.label}
        </ITBadget>
        {action}
      </div>
    </div>
  );
};
