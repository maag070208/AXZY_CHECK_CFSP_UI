import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { SemanticTone, TONES } from "@shared/ui";

export type StatusTone = SemanticTone;

export interface StatusStripItem {
  label: string;
  value: string | number;
  tone?: StatusTone;
  /** Detalle corto tras el valor, p. ej. "1 estancada". */
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
 * Resumen de métricas al estilo Centro de Reportes: tarjetas con fondo del
 * tinte del tono, número grande de color y nota breve. Cada una navega.
 */
export const StatusStrip = ({ items }: { items: StatusStripItem[] }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
    {items.map((item) => {
      const tone = TONES[item.tone ?? "neutral"];
      const interactive = Boolean(item.onClick);
      return (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          disabled={!interactive}
          className={`group flex flex-col gap-2 rounded-2xl border p-4 text-left transition-[transform,box-shadow,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${tone.border} ${tone.soft} ${
            interactive ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]" : "cursor-default"
          }`}
        >
          <span className="flex items-start justify-between gap-2">
            <ITText as="span" className="text-[12px] font-medium text-secondary-500 dark:text-secondary-400">
              {item.label}
            </ITText>
            <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] ${tone.softText}`}>
              {item.icon ?? <span className={`h-2 w-2 rounded-full ${tone.dot}`} />}
            </span>
          </span>

          <ITText as="span" className={`text-3xl font-black leading-none tabular-nums ${tone.text}`}>
            {item.value}
          </ITText>

          {item.note && (
            <ITText as="span" className={`truncate text-[11px] font-semibold ${NOTE_TONE[item.noteTone ?? "neutral"]}`}>
              {item.note}
            </ITText>
          )}
        </button>
      );
    })}
  </div>
);
