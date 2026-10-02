/**
 * View-model de reportes.
 *
 * La vista queda como puro render: antes llamaba a la API y gestionaba los
 * tres modales, el estado de generación y el borrado.
 *
 * `ReportConfigRow` vive en `@entities/report`: tenerlo declarado también en la
 * vista rompía el genérico de `ITDataTable` (dos tipos con el mismo nombre y
 * forma distinta) y producía errores en cascada que parecían no tener relación.
 */
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  deleteReportConfiguration,
  fetchReportConfigurationsTable,
  generateAdministrativeMatrixPdf,
  type ReportConfigRow,
} from "@entities/report";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";

export const useReportsPage = () => {
  const dispatch = useDispatch();
  const { data: clients } = useCatalog("client");

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [aperturaCierreOpen, setAperturaCierreOpen] = useState(false);
  const [incidentsOpen, setIncidentsOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [configToEdit, setConfigToEdit] = useState<ReportConfigRow | null>(null);
  const [configToDelete, setConfigToDelete] = useState<ReportConfigRow | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const fetchData = useCallback(
    async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<ReportConfigRow>> => {
      const res = await fetchReportConfigurationsTable({
        ...params,
        filters: {
          ...params.filters,
          ...(searchTerm ? { search: searchTerm } : {}),
          ...(selectedClientId ? { clientId: String(selectedClientId) } : {}),
        },
      });

      setSavedCount((prev) => (prev === res.total ? prev : res.total));
      return { data: res.data as unknown as ReportConfigRow[], total: res.total };
    },
    [searchTerm, selectedClientId],
  );

  const handleGenerateSavedReport = useCallback(
    async (configRow: ReportConfigRow) => {
      setIsGenerating(configRow.id);

      if (configRow.reportType !== "ADMINISTRATIVE_MATRIX") {
        setIsGenerating(null);
        dispatch(showToast({ message: "Tipo de reporte no soportado aún", type: "info" }));
        return;
      }

      const { recurringConfigurationIds = [], startDate, endDate } = configRow.configuration;

      if (!startDate || !endDate) {
        setIsGenerating(null);
        dispatch(
          showToast({
            message: "La configuración no tiene un rango de fechas válido",
            type: "error",
          }),
        );
        return;
      }

      // La entidad descarga el PDF; la vista sólo ve el resultado.
      const res = await generateAdministrativeMatrixPdf({
        recurringConfigurationIds,
        startDate,
        endDate,
        fileName: `${configRow.name.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD")}.pdf`,
      });

      setIsGenerating(null);
      dispatch(
        showToast({
          message: res.success ? "Reporte generado con éxito" : "Error al generar reporte",
          type: res.success ? "success" : "error",
        }),
      );
    },
    [dispatch],
  );

  const handleEdit = useCallback(
    (row: ReportConfigRow) => {
      if (row.reportType === "ADMINISTRATIVE_MATRIX") {
        setConfigToEdit(row);
        setAperturaCierreOpen(true);
        return;
      }
      dispatch(showToast({ message: "Este tipo de reporte no se puede editar", type: "info" }));
    },
    [dispatch],
  );

  const confirmDelete = useCallback(async () => {
    if (!configToDelete || isDeleting) return;
    const target = configToDelete;
    setIsDeleting(true);

    const res = await deleteReportConfiguration(target.id);

    setIsDeleting(false);
    setConfigToDelete(null);

    if (res.success) {
      dispatch(showToast({ message: "Configuración eliminada", type: "success" }));
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(
        showToast({
          message: res.messages?.[0] || "Error al eliminar configuración",
          type: "error",
        }),
      );
    }
  }, [configToDelete, isDeleting, dispatch]);

  const closeModal = useCallback(() => {
    setAperturaCierreOpen(false);
    setConfigToEdit(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return {
    clients,
    refresh,
    setRefreshKey,
    setConfigToEdit,
    refreshKey,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    aperturaCierreOpen,
    setAperturaCierreOpen,
    incidentsOpen,
    setIncidentsOpen,
    performanceOpen,
    setPerformanceOpen,
    configToEdit,
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
  };
};

export type ReportsViewModel = ReturnType<typeof useReportsPage>;
