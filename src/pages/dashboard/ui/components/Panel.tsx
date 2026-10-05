import { ReactNode } from "react";
import { SemanticTone, TONES } from "@shared/ui";
import { BOARD } from "./board";

/** El acento de un panel es un tono semántico: sin colores crudos. */
export type PanelAccent = SemanticTone;

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
 * Tarjeta de sección del tablero. Título en eyebrow y tile de acento con el
 * tinte del tono, a juego con el Centro de Reportes.
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
  <section className={`${BOARD.frame} flex flex-col ${className}`}>
    <header className={BOARD.header}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <span className={`${BOARD.tile} ${TONES[accent].soft} ${TONES[accent].softText}`}>{icon}</span>
        ) : (
          <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${TONES[accent].dot}`} />
        )}
        <h3 className={BOARD.title}>{title}</h3>
        {badge}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>

    <div className={`${BOARD.body} ${bodyClassName}`}>{children}</div>
  </section>
);
