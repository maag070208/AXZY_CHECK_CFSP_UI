import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { SemanticTone, SURFACE, TONES } from "@shared/ui";

export type StatusTone = SemanticTone;

export interface StatusStripItem {
  label: string;
  value: string | number;
  tone?: StatusTone;
  /** Detalle corto tras la etiqueta, p. ej. "1 estancada". */
  note?: string;
  noteTone?: "up" | "down" | "neutral";
  icon?: ReactNode;
  onClick?: () => void;
}

const NOTE_TONE = {
  up: TONES.success.text,
  down: TONES.danger.text,
  neutral: "text-secondary-400 dark:text-secondary-500",
} as const;

/**
 * Tira de estado del monitoreo: todas las métricas en un solo bloque compacto
 * en lugar de tarjetas sueltas, para que la página respire. Cada celda navega
 * a su módulo; el punto de color indica si el valor requiere atención.
 *
 * Todos los colores salen de `tokens.ts` para que la tira funcione en modo
 * oscuro (un `text-slate-900` suelto dejaba los números invisibles).
 */
export const StatusStrip = ({ items }: { items: StatusStripItem[] }) => (
  <div className={`${SURFACE.panel} ${SURFACE.panelShadow}`}>
    <div className="grid grid-cols-2 divide-x divide-y divide-secondary-100 dark:divide-secondary-800 sm:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
      {items.map((item) => {
        const interactive = Boolean(item.onClick);
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            disabled={!interactive}
            className={`
              group flex flex-col gap-1 px-4 py-3.5 text-left transition-colors
              ${interactive ? "cursor-pointer hover:bg-secondary-50 focus:outline-none focus-visible:bg-secondary-50 dark:hover:bg-secondary-800/60 dark:focus-visible:bg-secondary-800/60" : "cursor-default"}
            `}
          >
            <span className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONES[item.tone ?? "neutral"].dot}`} />
              <ITText as="span" className={`${SURFACE.microLabel} truncate`}>
                {item.label}
              </ITText>
            </span>

            <span className="flex items-baseline gap-1.5">
              <ITText as="span" className={`text-[22px] font-black leading-none tabular-nums tracking-tight ${SURFACE.strong}`}>
                {item.value}
              </ITText>
              {item.note && (
                <ITText as="span" className={`truncate text-[11px] font-bold ${NOTE_TONE[item.noteTone ?? "neutral"]}`}>
                  {item.note}
                </ITText>
              )}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);
