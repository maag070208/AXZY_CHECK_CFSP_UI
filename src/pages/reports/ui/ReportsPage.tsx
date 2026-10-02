import { ModulePage } from "@app/core/components/ModulePage";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITGrid,
  ITLoader,
  ITSearchSelect,
  ITStatCard,
  ITText,
  type Column,
} from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import {
  FaArrowRight,
  FaChartBar,
  FaChartLine,
  FaCheckCircle,
  FaEdit,
  FaExclamationTriangle,
  FaFilePdf,
  FaLockOpen,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import { AperturaCierreReportModal } from "./AperturaCierreReportModal";
import { GuardPerformanceReportModal } from "./GuardPerformanceReportModal";
import { IncidentsReportModal } from "./IncidentsReportModal";
import type { ReportConfigRow } from "@entities/report";
import { useReportsPage } from "../model/useReportsPage";



/**
 * Tarjeta de un tipo de reporte dentro del catálogo.
 * `available` controla si es accionable o un "próximamente".
 */
const ReportTypeCard = ({
  icon,
  iconClassName,
  title,
  description,
  available,
  ctaLabel,
  onClick,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  available: boolean;
  ctaLabel: string;
  onClick?: () => void;
}) => (
  <ITCard
    onClick={onClick}
    className={`h-full ${available ? "" : "opacity-70"}`}
  >
    <ITFlex direction="column" gap={4} className="h-full">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconClassName}`}
      >
        {icon}
      </div>

      <ITFlex align="center" justify="between" gap={2} wrap="wrap">
        <ITText
          as="h3"
          className="text-[13px] font-black uppercase tracking-widest text-slate-800"
        >
          {title}
        </ITText>
        <ITBadget
          color={available ? "success" : "gray"}
          size="sm"
          variant="outlined"
        >
          {available ? "DISPONIBLE" : "PRÓXIMAMENTE"}
        </ITBadget>
      </ITFlex>

      <ITText className="text-xs text-slate-500 font-medium leading-relaxed">
        {description}
      </ITText>

      <ITFlex
        align="center"
        gap={2}
        className={`mt-auto text-[10px] font-black uppercase tracking-widest ${
          available ? "text-sky-600" : "text-slate-400"
        }`}
      >
        <ITText as="span" className="text-inherit">
          {ctaLabel}
        </ITText>
        {available && <FaArrowRight size={10} />}
      </ITFlex>
    </ITFlex>
  </ITCard>
);

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
          <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
            {row.name}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
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
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {conf.startDate && conf.endDate
              ? `${dayjs(conf.startDate).format("DD/MM/YY")} - ${dayjs(conf.endDate).format("DD/MM/YY")}`
              : "SIN RANGO"}
            {conf.recurringConfigurationIds && (
              <span className="block mt-0.5 text-slate-400">
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
      <ITGrid container columns={12} spacing={4} className="mb-10">
        <ITGrid item xs={12} md={4}>
          <ITStatCard
            label="Tipos de reporte"
            value={3}
            icon={<FaChartBar />}
            color="bg-sky-50"
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <ITStatCard
            label="Disponibles ahora"
            value={3}
            icon={<FaCheckCircle />}
            color="bg-emerald-50"
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <ITStatCard
            label="Configuraciones guardadas"
            value={savedCount}
            icon={<FaFilePdf />}
            color="bg-violet-50"
          />
        </ITGrid>
      </ITGrid>

      {/* CATÁLOGO DE REPORTES */}
      <section className="mb-10">
        <ITText
          as="h2"
          className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5"
        >
          Reportes disponibles
        </ITText>

        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={6} lg={4}>
            <ReportTypeCard
              icon={<FaLockOpen size={20} />}
              iconClassName="bg-sky-50 text-sky-600"
              title="Apertura / Cierre"
              description="Matriz de asistencia por punto de control. Valida la evidencia obligatoria por día en un rango de fechas."
              available
              ctaLabel="Configurar reporte"
              onClick={() => {
                setConfigToEdit(null);
                setAperturaCierreOpen(true);
              }}
            />
          </ITGrid>

          <ITGrid item xs={12} md={6} lg={4}>
            <ReportTypeCard
              icon={<FaExclamationTriangle size={20} />}
              iconClassName="bg-amber-50 text-amber-500"
              title="Incidencias"
              description="Resumen analítico de incidencias por categoría y guardia durante el periodo seleccionado."
              available
              ctaLabel="Ver reporte"
              onClick={() => setIncidentsOpen(true)}
            />
          </ITGrid>

          <ITGrid item xs={12} md={6} lg={4}>
            <ReportTypeCard
              icon={<FaUserShield size={20} />}
              iconClassName="bg-violet-50 text-violet-500"
              title="Rendimiento Guardia"
              description="Estadísticas de desempeño, puntualidad y carga de trabajo por cada elemento operativo."
              available
              ctaLabel="Ver reporte"
              onClick={() => setPerformanceOpen(true)}
            />
          </ITGrid>
        </ITGrid>
      </section>

      {/* CONFIGURACIONES GUARDADAS */}
      <section className="mb-10">
        <ITFlex align="center" gap={2} className="mb-5">
          <FaChartLine size={12} className="text-slate-400" />
          <ITText
            as="h2"
            className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400"
          >
            Configuraciones guardadas
          </ITText>
        </ITFlex>

        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <ITDataTable<ReportConfigRow>
            key={refreshKey}
            columns={columns}
            fetchData={fetchData}
            title=""
            defaultItemsPerPage={10}
          />
        </div>
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
