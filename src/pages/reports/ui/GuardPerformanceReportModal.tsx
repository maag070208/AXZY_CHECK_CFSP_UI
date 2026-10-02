import { ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaUserShield } from "react-icons/fa";
import { AnalyticsTab } from "@pages/reports/ui/AnalyticsTab";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Reporte de Rendimiento Guardia. Reutiliza la analítica operativa existente
 * (KPIs, top de desempeño, distribución y carga de trabajo) ya conectada al
 * backend de `/reports/guards/*`.
 */
export const GuardPerformanceReportModal = ({ isOpen, onClose }: Props) => (
  <ITDialog
    isOpen={isOpen}
    onClose={onClose}
    title=""
    className="!max-w-6xl w-full!"
  >
    <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
      <div className="px-8 pt-8 pb-4 border-b border-slate-100">
        <ITFlex align="center" gap={3}>
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
            <FaUserShield size={18} />
          </div>
          <div>
            <ITText className="text-base font-medium text-slate-800">
              Rendimiento Guardia
            </ITText>
            <ITText className="text-xs text-slate-400 font-light">
              Desempeño, puntualidad y carga de trabajo por elemento operativo
            </ITText>
          </div>
        </ITFlex>
      </div>

      <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
        <AnalyticsTab />
      </div>
    </div>
  </ITDialog>
);
