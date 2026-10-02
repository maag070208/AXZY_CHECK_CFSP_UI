import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { SemanticTone, TONES } from "@shared/ui";

/** El acento de un panel es un tono semántico: sin colores crudos. */
export type PanelAccent = SemanticTone;

const ACCENT_BAR: Record<PanelAccent, string> = {
  brand: TONES.brand.bar,
  success: TONES.success.bar,
  danger: TONES.danger.bar,
  warning: TONES.warning.bar,
  info: TONES.info.bar,
  accent: TONES.accent.bar,
  neutral: TONES.neutral.bar,
};

export interface PanelProps {
  title: string;
  icon?: ReactNode;
  /** Contador o etiqueta corta junto al título. */
  badge?: ReactNode;
  /** Acción alineada a la derecha del header (botón, link). */
  action?: ReactNode;
  accent?: PanelAccent;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Contenedor de sección del monitoreo. Unifica el header (barra de acento,
 * icono, título en micro-mayúsculas, contador y acción) para que todos los
 * bloques del home compartan la misma jerarquía visual.
 */
export const Panel = ({
  title,
  icon,
  badge,
  action,
  accent = "neutral",
  children,
  className = "",
  bodyClassName = "",
}: PanelProps) => (
  <section
    className={`flex flex-col overflow-hidden rounded-2xl border border-secondary-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.18)] dark:border-secondary-800 dark:bg-secondary-900 ${className}`}
  >
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-5 py-3.5 dark:border-secondary-800">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`h-4 w-1.5 shrink-0 rounded-full ${ACCENT_BAR[accent]}`} />
        {icon && <span className="shrink-0 text-secondary-400">{icon}</span>}
        <ITText className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-secondary-700 dark:text-secondary-300">
          {title}
        </ITText>
        {badge}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>

    <div className={`flex flex-1 flex-col px-5 py-4 ${bodyClassName}`}>{children}</div>
  </section>
);
