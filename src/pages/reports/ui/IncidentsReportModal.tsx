import {
  ITBadget,
  ITButton,
  ITDatePicker,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITLoader,
  ITStatCard,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import {
  FaAlignLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaUserShield,
} from "react-icons/fa";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialClientId?: string;
}

import { useIncidentsReportModal } from "../model/useIncidentsReportModal";

const BAR_COLORS = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
];

/** Lista de desglose con barra proporcional. */
const BreakdownList = ({
  title,
  icon,
  items,
  total,
  useItemColor = false,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{ id: string; name: string; count: number; color?: string | null }>;
  total: number;
  useItemColor?: boolean;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6">
    <ITFlex align="center" gap={2} className="mb-5">
      <span className="text-slate-400">{icon}</span>
      <ITText className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {title}
      </ITText>
    </ITFlex>

    {items.length === 0 ? (
      <ITText className="text-xs text-slate-400 font-medium py-4 text-center">
        Sin datos en el periodo
      </ITText>
    ) : (
      <ITFlex direction="column" gap={3}>
        {items.map((item, index) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const barClass =
            useItemColor && item.color
              ? ""
              : BAR_COLORS[index % BAR_COLORS.length];
          return (
            <div key={item.id}>
              <ITFlex align="center" justify="between" gap={2} className="mb-1">
                <ITText className="text-[11px] font-bold text-slate-600 truncate">
                  {item.name}
                </ITText>
                <ITText className="text-[11px] font-black text-slate-500">
                  {item.count} · {pct}%
                </ITText>
              </ITFlex>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{
                    width: `${Math.max(pct, 3)}%`,
                    backgroundColor:
                      useItemColor && item.color ? item.color : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </ITFlex>
    )}
  </div>
);

export const IncidentsReportModal = ({
  isOpen,
  onClose,
  initialClientId,
}: Props) => {
  const { dateRange, setDateRange, data, loading, fetchReport } = useIncidentsReportModal({ isOpen, initialClientId });
  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="!max-w-5xl w-full!"
    >
      <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-slate-100">
          <ITFlex align="center" gap={3}>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <FaExclamationTriangle size={18} />
            </div>
            <div>
              <ITText className="text-base font-medium text-slate-800">
                Reporte de Incidencias
              </ITText>
              <ITText className="text-xs text-slate-400 font-light">
                Resumen analítico por categoría y guardia
              </ITText>
            </div>
          </ITFlex>
        </div>

        {/* Body */}
        <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
          <ITFlex align="center" justify="between" gap={3} wrap="wrap" className="mb-6">
            <div className="w-full md:w-80">
              <ITDatePicker
                name="incidentRange"
                label=""
                range
                placeholder="Selecciona un rango"
                value={dateRange}
                onChange={(e) => {
                  const val = e.target.value;
                  if (Array.isArray(val)) {
                    setDateRange(val as [Date | null, Date | null]);
                  }
                }}
              />
            </div>
            <ITButton
              onClick={fetchReport}
              variant="filled"
              color="primary"
              size="sm"
              disabled={loading}
              title="Actualizar"
            >
              {loading ? <ITLoader size="sm" /> : <FaSync size={12} />}
            </ITButton>
          </ITFlex>

          {loading && !data ? (
            <div className="py-16 flex justify-center">
              <ITLoader size="lg" />
            </div>
          ) : !data || data.total === 0 ? (
            <ITEmptyState
              icon={<FaExclamationTriangle size={40} />}
              title="Sin incidencias en el periodo"
              description="No se registraron incidencias en el rango de fechas seleccionado."
            />
          ) : (
            <>
              <ITGrid container columns={12} spacing={4} className="mb-6">
                <ITGrid item xs={6} md={3}>
                  <ITStatCard
                    label="Total"
                    value={data.total}
                    icon={<FaAlignLeft />}
                    color="bg-sky-50"
                  />
                </ITGrid>
                <ITGrid item xs={6} md={3}>
                  <ITStatCard
                    label="Pendientes"
                    value={data.pending}
                    icon={<FaExclamationTriangle />}
                    color="bg-amber-50"
                  />
                </ITGrid>
                <ITGrid item xs={6} md={3}>
                  <ITStatCard
                    label="Atendidas"
                    value={data.attended}
                    icon={<FaCheckCircle />}
                    color="bg-emerald-50"
                  />
                </ITGrid>
                <ITGrid item xs={6} md={3}>
                  <ITStatCard
                    label="Resolución"
                    value={`${data.resolutionRate}%`}
                    icon={<FaCheckCircle />}
                    color="bg-violet-50"
                  />
                </ITGrid>
              </ITGrid>

              <ITGrid container columns={12} spacing={4}>
                <ITGrid item xs={12} md={6}>
                  <BreakdownList
                    title="Por categoría"
                    icon={<FaAlignLeft size={12} />}
                    items={data.byCategory}
                    total={data.total}
                    useItemColor
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <BreakdownList
                    title="Por guardia"
                    icon={<FaUserShield size={12} />}
                    items={data.byGuard}
                    total={data.total}
                  />
                </ITGrid>
              </ITGrid>

              <ITFlex align="center" gap={2} className="mt-6">
                <ITBadget color="info" size="sm" variant="outlined">
                  {data.byDay.length} días con registros
                </ITBadget>
                {data.pending > 0 && (
                  <ITBadget color="warning" size="sm" variant="outlined">
                    {data.pending} por atender
                  </ITBadget>
                )}
              </ITFlex>
            </>
          )}
        </div>
      </div>
    </ITDialog>
  );
};
