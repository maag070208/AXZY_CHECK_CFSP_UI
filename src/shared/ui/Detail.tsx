import { ReactNode } from "react";
import { SURFACE, TONES, type SemanticTone } from "./tokens";

interface DetailSectionProps {
  title: string;
  icon?: ReactNode;
  /** Acción alineada a la derecha del encabezado. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Bloque de un panel de detalle (modal). Superficie elevada, título en
 * micro-mayúsculas e icono en tile: mismo lenguaje que el resto de la WEB.
 */
export const DetailSection = ({
  title,
  icon,
  action,
  children,
  className = "",
  bodyClassName = "",
}: DetailSectionProps) => (
  <section className={`${SURFACE.panel} ${SURFACE.panelShadow} ${className}`}>
    <header className="flex items-center justify-between gap-3 border-b border-secondary-100 px-5 py-3.5 dark:border-secondary-800">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-300">
            {icon}
          </span>
        )}
        <h4 className={`${SURFACE.sectionLabel} truncate text-secondary-500 dark:text-secondary-400`}>{title}</h4>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
    <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>
  </section>
);

interface DetailMetaProps {
  label: string;
  value: ReactNode;
  tone?: SemanticTone;
  className?: string;
}

/** Dato corto etiqueta/valor para encabezados de detalle. */
export const DetailMeta = ({ label, value, tone = "neutral", className = "" }: DetailMetaProps) => (
  <div className={`flex min-w-0 flex-col gap-0.5 ${className}`}>
    <span className={SURFACE.microLabel}>{label}</span>
    <span className={`truncate text-[13px] font-bold tracking-tight ${TONES[tone].text}`}>{value}</span>
  </div>
);

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

/** Fila etiqueta/valor para los bloques laterales. */
export const DetailRow = ({ label, value }: DetailRowProps) => (
  <div className="flex items-center justify-between gap-3">
    <span className={SURFACE.microLabel}>{label}</span>
    <span className={`text-[12px] font-bold tracking-tight ${SURFACE.strong}`}>{value}</span>
  </div>
);
