import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";

export type PanelAccent = "emerald" | "rose" | "amber" | "sky" | "violet" | "slate" | "primary";

const ACCENT_BAR: Record<PanelAccent, string> = {
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  slate: "bg-slate-300",
  primary: "bg-primary-500",
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
  accent = "slate",
  children,
  className = "",
  bodyClassName = "",
}: PanelProps) => (
  <section
    className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.18)] ${className}`}
  >
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`h-4 w-1.5 shrink-0 rounded-full ${ACCENT_BAR[accent]}`} />
        {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
        <ITText className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">
          {title}
        </ITText>
        {badge}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>

    <div className={`flex flex-1 flex-col px-5 py-4 ${bodyClassName}`}>{children}</div>
  </section>
);
