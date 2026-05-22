import { post } from "@app/core/axios/axios";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDatePicker,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  createReportConfiguration,
  updateReportConfiguration,
} from "../services/ReportConfigurationsService";
import { getRecurringConfigurationsList } from "../services/ReportsService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  configToEdit?: any;
}

export const AperturaCierreReportModal = ({
  isOpen,
  onClose,
  configToEdit,
}: Props) => {
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
    post("/clients/datatable", { page: 1, limit: 1000 }).then((res: any) => {
      if (res.success && res.data) {
        setClients(res.data.rows || []);
      }
    });

    getRecurringConfigurationsList()
      .then((res) => {
        if (res.success && res.data) {
          setConfigurations(res.data);
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

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Reporte: Apertura / Cierre"
      size="lg"
    >
      <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]">
        <div className="p-10 space-y-10 overflow-y-auto flex-1">
          {/* Nombre de la Configuración */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                DATOS GENERALES
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nombre del Reporte
                </label>
                <ITInput
                  label=""
                  name="name"
                  placeholder="Ej. Reporte Semanal Plaza 2000"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Fechas */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                PERIODO DE EVALUACIÓN
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Rango de Fechas
                </label>
                <div className="w-full">
                  <ITDatePicker
                    label=""
                    name="dateRange"
                    value={dateRange as any}
                    range
                    onChange={(e) => {
                      const val = e.target.value as any;
                      if (Array.isArray(val)) {
                        setDateRange(val as [Date | null, Date | null]);
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Cliente */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                CLIENTE
              </h4>
            </div>
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Filtrar Rutas por Cliente
              </label>
              <ITSearchSelect
                placeholder="SELECCIONE UN CLIENTE..."
                options={clients.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
                value={selectedClientId}
                onChange={(val) => {
                  setSelectedClientId(val);
                  setSelectedConfigIds([]); // Reset selection when client changes
                }}
              />
            </div>
          </section>

          {/* Rutas */}
          {selectedClientId && (
            <section>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  RUTAS A INCLUIDAS ({selectedConfigIds.length})
                </h4>
              </div>

              {loadingConfig ? (
                <div className="flex justify-center p-10 bg-slate-50 rounded-2xl border border-slate-100">
                  <ITLoader size="md" />
                </div>
              ) : filteredConfigurations.length > 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                  {filteredConfigurations.map((config) => {
                    const isSelected = selectedConfigIds.includes(config.id);
                    return (
                      <div
                        key={config.id}
                        onClick={() => toggleConfig(config.id)}
                        className={`flex items-center gap-4 p-4 cursor-pointer transition-all border-b border-slate-100 last:border-0 hover:bg-slate-100 ${isSelected ? "bg-emerald-50/50" : ""}`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-600 text-white" : "bg-white border-2 border-slate-300"}`}
                        >
                          {isSelected && <FaCheckCircle size={12} />}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-bold tracking-tight uppercase ${isSelected ? "text-emerald-900" : "text-slate-700"}`}
                          >
                            {config.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {selectedClientId
                      ? "Este cliente no tiene rutas configuradas"
                      : "Seleccione un cliente primero"}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            type="button"
            variant="filled"
            onClick={onClose}
            color="secondary"
          >
            Cancelar
          </ITButton>

          <ITButton
            type="button"
            onClick={handleSave}
            color="primary"
            disabled={
              isGenerating || selectedConfigIds.length === 0 || !name.trim()
            }
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <ITLoader size="sm" />
                <span>GUARDANDO...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                <span>Guardar Configuración</span>
              </div>
            )}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
