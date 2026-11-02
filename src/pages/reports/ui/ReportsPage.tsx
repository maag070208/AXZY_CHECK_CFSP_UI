import { ModulePage } from "@app/core/components/ModulePage";
import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITLoader,
  ITSearchSelect,
  ITText,
  type Column,
} from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import {
  FaArrowRight,
  FaChartBar,
  FaCheckCircle,
  FaEdit,
  FaExclamationTriangle,
  FaFilePdf,
  FaLockOpen,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import type { ReportConfigRow } from "@entities/report";
import { DataTableCard, SURFACE, TONES } from "@shared/ui";
import { AperturaCierreReportModal } from "./AperturaCierreReportModal";
import { GuardPerformanceReportModal } from "./GuardPerformanceReportModal";
import { IncidentsReportModal } from "./IncidentsReportModal";
import { useReportsPage } from "../model/useReportsPage";

type ReportTone = keyof typeof TONES;

/**
 * Métrica compacta del resumen.
 *
 * Sustituye a las tres `ITStatCard` con fondo tintado: el bloque pasa de una
 * fila de tarjetas altas a una tira delgada que no resta protagonismo al
 * catálogo.
 */
const StatInline = ({
  icon,
  tone,
  value,
  label,
}: {
  icon: ReactNode;
  tone: ReportTone;
  value: number;
  label: string;
}) => {
  const t = TONES[tone];
  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl border border-secondary-100 bg-white px-4 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.soft} ${t.text}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <ITText as="div" className={`text-lg leading-none font-black ${SURFACE.strong}`}>
          {value}
        </ITText>
        <ITText as="div" className="mt-1 truncate text-[10px] font-black tracking-wider text-secondary-400 uppercase">
          {label}
        </ITText>
      </div>
    </div>
  );
};

/**
 * Fila compacta de un tipo de reporte del catálogo.
 * `available` controla si es accionable o un "próximamente".
 */
const ReportTypeRow = ({
  icon,
  tone,
  title,
  description,
  available,
  ctaLabel,
  onClick,
}: {
  icon: ReactNode;
  tone: ReportTone;
  title: string;
  description: string;
  available: boolean;
  ctaLabel: string;
  onClick?: () => void;
}) => {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:outline-none sm:px-5 ${
        available ? "cursor-pointer hover:bg-secondary-50/70" : "cursor-not-allowed opacity-60"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.soft} ${t.text}`}>
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <ITText as="span" className={`truncate text-[13px] font-black tracking-tight uppercase ${SURFACE.strong}`}>
            {title}
          </ITText>
          {!available && (
            <ITBadget color="gray" size="sm" variant="outlined">
              PRÓXIMAMENTE
            </ITBadget>
          )}
        </span>
        <ITText as="span" className="mt-0.5 block truncate text-[11px] font-medium text-secondary-500">
          {description}
        </ITText>
      </span>

      <span className="hidden shrink-0 items-center gap-1.5 text-[10px] font-black tracking-widest text-secondary-400 uppercase transition-colors group-hover:text-primary-600 sm:flex">
        {ctaLabel}
        {available && <FaArrowRight size={10} />}
      </span>
    </button>
  );
};

const ReportsPage = () => {
  const {
    clients,
    refreshKey,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    refresh,
    aperturaCierreOpen,
    setAperturaCierreOpen,
    incidentsOpen,
    setIncidentsOpen,
    performanceOpen,
    setPerformanceOpen,
    configToEdit,
    setConfigToEdit,
    configToDelete,
    setConfigToDelete,
    isGenerating,
    isDeleting,
    savedCount,
    fetchData,
    handleGenerateSavedReport,
    handleEdit,
    confirmDelete,
    closeModal,
  } = useReportsPage();

  const columns: Column<ReportConfigRow>[] = [
    {
      label: "CONFIGURACIÓN",
      key: "name",
      type: "string",
      render: (row: ReportConfigRow) => (
        <div className="flex flex-col">
          <span className={`mb-1 text-[11px] font-black tracking-tight uppercase ${SURFACE.strong}`}>
            {row.name}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
            <span className="text-[9px] font-black tracking-widest text-secondary-400 uppercase">
              {row.client?.name || "GLOBAL"}
            </span>
          </div>
        </div>
      ),
    },
    {
      label: "TIPO",
      key: "reportType",
      type: "string",
      render: (row: ReportConfigRow) => (
        <ITBadget color="primary" size="sm" variant="outlined">
          {row.reportType === "ADMINISTRATIVE_MATRIX"
            ? "APERTURA / CIERRE"
            : row.reportType}
        </ITBadget>
      ),
    },
    {
      label: "RANGO",
      key: "configuration",
      type: "string",
      render: (row: ReportConfigRow) => {
        const conf = row.configuration || {};
        return (
          <div className="text-[10px] font-bold tracking-widest text-secondary-500 uppercase">
            {conf.startDate && conf.endDate
              ? `${dayjs(conf.startDate).format("DD/MM/YY")} - ${dayjs(conf.endDate).format("DD/MM/YY")}`
              : "SIN RANGO"}
            {conf.recurringConfigurationIds && (
              <span className="mt-0.5 block text-secondary-400">
                {conf.recurringConfigurationIds.length} RUTAS
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: "ACCIONES",
      key: "id",
      type: "actions",
      actions: (row: ReportConfigRow) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => handleGenerateSavedReport(row)}
            variant="outlined"
            title="Generar PDF"
            size="sm"
            color="success"
            disabled={isGenerating === row.id}
          >
            {isGenerating === row.id ? (
              <ITLoader size="sm" />
            ) : (
              <FaFilePdf size={14} />
            )}
          </ITButton>
          <ITButton
            onClick={() => handleEdit(row)}
            variant="outlined"
            title="Editar"
            size="sm"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => setConfigToDelete(row)}
            variant="outlined"
            color="error"
            title="Eliminar"
            size="sm"
          >
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Centro de Reportes"
      subtitle="Genera matrices y documentos operativos a partir de tus recorridos"
      icon={FaChartBar}
      filter={
        <ITSearchSelect
          className="z-20!"
          placeholder="Filtrar por Cliente..."
          options={(clients || []).map((c) => ({
            label: c.name,
            value: c.id,
          }))}
          value={selectedClientId}
          onChange={(val: string | number) => setSelectedClientId(String(val))}
        />
      }
      search={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: "BUSCAR CONFIGURACIÓN...",
      }}
      onRefresh={refresh}
      refreshKey={refreshKey}
    >
      {/* RESUMEN */}
      <div className="mb-8 flex flex-wrap gap-3">
        <StatInline
          icon={<FaChartBar size={14} />}
          tone="info"
          value={3}
          label="Tipos de reporte"
        />
        <StatInline
          icon={<FaCheckCircle size={14} />}
          tone="success"
          value={3}
          label="Disponibles ahora"
        />
        <StatInline
          icon={<FaFilePdf size={14} />}
          tone="accent"
          value={savedCount}
          label="Configuraciones guardadas"
        />
      </div>

      {/* CATÁLOGO DE REPORTES */}
      <section className="mb-8">
        <ITText
          as="h2"
          className="mb-3 text-[11px] font-black tracking-[0.2em] text-secondary-400 uppercase"
        >
          Reportes disponibles
        </ITText>

        <div className="divide-y divide-secondary-100 overflow-hidden rounded-2xl border border-secondary-100 bg-white">
          <ReportTypeRow
            icon={<FaLockOpen size={17} />}
            tone="info"
            title="Apertura / Cierre"
            description="Matriz de asistencia por punto de control, con evidencia obligatoria por día en un rango de fechas."
            available
            ctaLabel="Configurar reporte"
            onClick={() => {
              setConfigToEdit(null);
              setAperturaCierreOpen(true);
            }}
          />

          <ReportTypeRow
            icon={<FaExclamationTriangle size={17} />}
            tone="warning"
            title="Incidencias"
            description="Resumen analítico de incidencias por categoría y guardia durante el periodo."
            available
            ctaLabel="Ver reporte"
            onClick={() => setIncidentsOpen(true)}
          />

          <ReportTypeRow
            icon={<FaUserShield size={17} />}
            tone="accent"
            title="Rendimiento Guardia"
            description="Desempeño, puntualidad y carga de trabajo por cada elemento operativo."
            available
            ctaLabel="Ver reporte"
            onClick={() => setPerformanceOpen(true)}
          />
        </div>
      </section>

      {/* CONFIGURACIONES GUARDADAS */}
      <section className="mb-8">
        <ITText
          as="h2"
          className="mb-3 text-[11px] font-black tracking-[0.2em] text-secondary-400 uppercase"
        >
          Configuraciones guardadas
        </ITText>

        <DataTableCard>
          <ITDataTable<ReportConfigRow>
            key={refreshKey}
            columns={columns}
            fetchData={fetchData}
            title=""
            defaultItemsPerPage={10}
          />
        </DataTableCard>
      </section>

      {/* MODAL: CONFIGURACIÓN APERTURA / CIERRE */}
      <AperturaCierreReportModal
        isOpen={aperturaCierreOpen}
        configToEdit={configToEdit}
        onClose={closeModal}
      />

      {/* MODAL: REPORTE DE INCIDENCIAS */}
      <IncidentsReportModal
        isOpen={incidentsOpen}
        onClose={() => setIncidentsOpen(false)}
        initialClientId={
          selectedClientId ? String(selectedClientId) : undefined
        }
      />

      {/* MODAL: RENDIMIENTO GUARDIA */}
      <GuardPerformanceReportModal
        isOpen={performanceOpen}
        onClose={() => setPerformanceOpen(false)}
      />

      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      <ITConfirmDialog
        isOpen={!!configToDelete}
        onClose={() => setConfigToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar configuración"
        message={`¿Seguro que deseas eliminar "${configToDelete?.name ?? ""}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </ModulePage>
  );
};

export default ReportsPage;
