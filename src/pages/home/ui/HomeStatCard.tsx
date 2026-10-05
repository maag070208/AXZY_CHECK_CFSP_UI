import { ITText } from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import { SURFACE, TONES, type SemanticTone } from "@shared/ui";

interface Props {
  label: string;
  value: string | number;
  /** Texto secundario opcional (p. ej. el título de la ruta). */
  hint?: string;
  icon: ReactNode;
  tone: SemanticTone;
  loading?: boolean;
}

/**
 * Tarjeta de métrica del inicio.
 *
 * Los números usan `tabular-nums` para que no "bailen" al actualizarse, y el
 * valor nunca es un `<div onClick>`: si hiciera falta navegar, sería un enlace.
 */
export const HomeStatCard = ({ label, value, hint, icon, tone, loading }: Props) => {
  const t = TONES[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-secondary-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-secondary-800 dark:bg-secondary-900">
      <span aria-hidden="true" className={`absolute left-0 top-0 h-full w-1 ${t.bar}`} />

      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className={`flex h-10 w-10 items-center justify-center rounded-xl text-base ${t.soft} ${t.softText}`}>
          {icon}
        </span>
        {hint ? (
          <ITText as="span" className="max-w-[60%] truncate text-right text-[10px] font-bold uppercase tracking-[0.08em] text-secondary-400">
            {hint}
          </ITText>
        ) : null}
      </div>

      <div className="mt-4">
        {loading ? (
          <span aria-hidden="true" className="block h-8 w-16 animate-pulse rounded-lg bg-secondary-100 dark:bg-secondary-800" />
        ) : (
          <ITText as="span" className={`block text-3xl font-black leading-none tabular-nums ${SURFACE.strong}`}>
            {value}
          </ITText>
        )}
        <ITText as="span" className={`mt-2 block text-[11px] font-black uppercase tracking-[0.12em] ${t.text}`}>
          {label}
        </ITText>
      </div>
    </div>
  );
};
