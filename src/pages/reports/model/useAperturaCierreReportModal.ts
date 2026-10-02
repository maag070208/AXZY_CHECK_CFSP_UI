/**
 * View-model del modal de reporte de apertura/cierre.
 */
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { fetchClientsTable } from "@entities/client";
import { listRoutes } from "@entities/route";
import {
  createReportConfiguration,
  updateReportConfiguration,
  type ReportConfigRow,
} from "@entities/report";

export interface AperturaCierreReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialClientId?: string;
  /** Configuración a editar; null para crear. */
  configToEdit?: ReportConfigRow | null;
}

export const useAperturaCierreReportModal = ({
  isOpen,
  onClose,
  onSaved: _onSaved,
  initialClientId: _initialClientId,
  configToEdit,
}: AperturaCierreReportModalProps) => {
  const dispatch = useDispatch();

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [selectedConfigIds, setSelectedConfigIds] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf("month").toDate(),
    dayjs().endOf("month").toDate(),
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoadingConfig(true);
    // Antes era un `post("/clients/datatable")` suelto desde la vista.
    void fetchClientsTable({ page: 1, limit: 1000, filters: {} }).then((res) => {
      setClients(res.data ?? []);
    });

    listRoutes()
      .then((res: { success: boolean; data?: unknown[] }) => {
        if (res.success && res.data) {
          setConfigurations(res.data as any);
        }
      })
      .finally(() => setLoadingConfig(false));

    if (configToEdit) {
      setName(configToEdit.name || "");
      setSelectedClientId(configToEdit.clientId || "");
      setSelectedConfigIds(
        configToEdit.configuration?.recurringConfigurationIds || [],
      );
      if (
        configToEdit.configuration?.startDate &&
        configToEdit.configuration?.endDate
      ) {
        setDateRange([
          dayjs(configToEdit.configuration.startDate).toDate(),
          dayjs(configToEdit.configuration.endDate).toDate(),
        ]);
      } else {
        setDateRange([
          dayjs().startOf("month").toDate(),
          dayjs().endOf("month").toDate(),
        ]);
      }
    } else {
      setName("");
      setSelectedClientId("");
      setSelectedConfigIds([]);
      setDateRange([
        dayjs().startOf("month").toDate(),
        dayjs().endOf("month").toDate(),
      ]);
    }
  }, [isOpen, configToEdit]);

  const filteredConfigurations = selectedClientId
    ? configurations.filter(
        (c) =>
          c.clientId === selectedClientId || c.client?.id === selectedClientId,
      )
    : [];

  const toggleConfig = (id: string) => {
    setSelectedConfigIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      dispatch(
        showToast({
          message: "Debe ingresar un nombre para la configuración",
          type: "error",
        }),
      );
      return;
    }
    if (selectedConfigIds.length === 0) {
      dispatch(
        showToast({
          message: "Debe seleccionar al menos una ronda",
          type: "error",
        }),
      );
      return;
    }
    const startDateStr = dateRange[0]
      ? dayjs(dateRange[0]).format("YYYY-MM-DD")
      : null;
    const endDateStr = dateRange[1]
      ? dayjs(dateRange[1]).format("YYYY-MM-DD")
      : null;

    if (!startDateStr || !endDateStr) {
      dispatch(
        showToast({
          message: "Fechas inválidas",
          type: "error",
        }),
      );
      return;
    }

    const payload = {
      name,
      reportType: "ADMINISTRATIVE_MATRIX",
      clientId: selectedClientId || null,
      configuration: {
        recurringConfigurationIds: selectedConfigIds,
        startDate: startDateStr,
        endDate: endDateStr,
      },
      active: true,
    };

    setIsGenerating(true);
    try {
      const response = configToEdit
        ? await updateReportConfiguration(configToEdit.id, payload)
        : await createReportConfiguration(payload);

      if (response.success) {
        dispatch(
          showToast({
            message: "Configuración guardada con éxito",
            type: "success",
          }),
        );
        onClose();
      } else {
        dispatch(
          showToast({
            message: "Error al guardar configuración",
            type: "error",
          }),
        );
      }
    } catch (error) {
      dispatch(
        showToast({
          message: "Error de red al guardar configuración",
          type: "error",
        }),
      );
    } finally {
      setIsGenerating(false);
    }
  };


  const clearConfigSelection = () => setSelectedConfigIds([]);

  return {
    clearConfigSelection,
    filteredConfigurations,
    clients,
    configurations,
    dateRange,
    setDateRange,
    handleSave,
    isGenerating,
    loadingConfig,
    name,
    setName,
    selectedClientId,
    setSelectedClientId,
    selectedConfigIds,
    toggleConfig,
  };
};

export type AperturaCierreReportModalViewModel = ReturnType<typeof useAperturaCierreReportModal>;
