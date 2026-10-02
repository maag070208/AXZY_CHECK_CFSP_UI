import { ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { FaSync } from "react-icons/fa";
import { ICatalogItem } from "@app/core/types/catalog.types";
import { TONES } from "@shared/ui";

export interface LiveControlsProps {
  /** Un usuario de cliente no puede cambiar el alcance. */
  isClient: boolean;
  clients: ICatalogItem[];
  clientId: string;
  onClientChange: (value: string) => void;
  updatedAt: string;
  refreshing: boolean;
  onRefresh: () => void;
  /** Versión para pantallas angostas: el selector ocupa su propia fila. */
  stacked?: boolean;
}

/**
 * Controles del monitoreo: alcance por cliente, indicador en vivo y refresco.
 * Se renderiza en el header en escritorio y en una barra propia en móvil.
 */
export const LiveControls = ({
  isClient,
  clients,
  clientId,
  onClientChange,
  updatedAt,
  refreshing,
  onRefresh,
  stacked = false,
}: LiveControlsProps) => (
  <>
    {!isClient && (
      <div className={stacked ? "w-full sm:w-56" : "w-56"}>
        <ITSearchSelect
          size="sm"
          placeholder="Todos los clientes"
          options={clients.map((c) => ({ label: c.name, value: String(c.id) }))}
          value={clientId}
          clearable
          onClear={() => onClientChange("")}
          onChange={(v) => onClientChange(String(v))}
        />
      </div>
    )}

    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${TONES.success.soft} ${TONES.success.border} ${TONES.success.text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${TONES.success.dot}`} />
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
      </span>
      En vivo
    </span>

    <div className="flex items-center gap-1 rounded-full border border-secondary-200 bg-white py-1 pl-3 pr-1 dark:border-secondary-700 dark:bg-secondary-900">
      <ITText className="hidden text-[11px] font-bold tabular-nums text-secondary-400 md:block">
        {updatedAt ? `Actualizado ${updatedAt}` : "Sin datos"}
      </ITText>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        title="Refrescar"
        aria-label="Refrescar"
        className="flex h-7 w-7 items-center justify-center rounded-full text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-50 dark:hover:bg-secondary-800 dark:hover:text-secondary-200"
      >
        <FaSync size={11} className={refreshing ? "animate-spin" : ""} />
      </button>
    </div>
  </>
);
