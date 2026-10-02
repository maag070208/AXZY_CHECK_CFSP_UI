import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";

/**
 * Tonos semánticos del pulso operativo. Cada KPI recibe un tono para que la
 * franja se lea de un vistazo: color = tipo de dato, no decoración.
 */
export type KpiTone = "emerald" | "sky" | "amber" | "indigo" | "violet" | "teal" | "rose" | "slate";

interface ToneStyle {
  tile: string;
  glow: string;
  accent: string;
}

const TONES: Record<KpiTone, ToneStyle> = {
  emerald: { tile: "bg-emerald-50 text-emerald-600 ring-emerald-100", glow: "bg-emerald-400/10", accent: "bg-emerald-500" },
  sky: { tile: "bg-sky-50 text-sky-600 ring-sky-100", glow: "bg-sky-400/10", accent: "bg-sky-500" },
  amber: { tile: "bg-amber-50 text-amber-600 ring-amber-100", glow: "bg-amber-400/10", accent: "bg-amber-500" },
  indigo: { tile: "bg-indigo-50 text-indigo-600 ring-indigo-100", glow: "bg-indigo-400/10", accent: "bg-indigo-500" },
  violet: { tile: "bg-violet-50 text-violet-600 ring-violet-100", glow: "bg-violet-400/10", accent: "bg-violet-500" },
  teal: { tile: "bg-teal-50 text-teal-600 ring-teal-100", glow: "bg-teal-400/10", accent: "bg-teal-500" },
  rose: { tile: "bg-rose-50 text-rose-600 ring-rose-100", glow: "bg-rose-400/10", accent: "bg-rose-500" },
  slate: { tile: "bg-slate-100 text-slate-500 ring-slate-200/70", glow: "bg-slate-400/10", accent: "bg-slate-400" },
};

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: KpiTone;
  /** Texto corto bajo el valor (contexto, no una tendencia numérica). */
  hint?: string;
  /** Dirección semántica del hint: define el color del punto y del texto. */
  hintTone?: "up" | "down" | "neutral";
  onClick?: () => void;
}

const HINT_TONE: Record<NonNullable<KpiCardProps["hintTone"]>, { dot: string; text: string }> = {
  up: { dot: "bg-emerald-500", text: "text-emerald-700" },
  down: { dot: "bg-rose-500", text: "text-rose-700" },
  neutral: { dot: "bg-slate-300", text: "text-slate-500" },
};

/**
 * Métrica del monitoreo en vivo. Más densa que `ITStatCard`: lleva tile de
 * icono, valor tabular grande y una pista con punto semántico.
 */
export const KpiCard = ({ label, value, icon, tone = "slate", hint, hintTone = "neutral", onClick }: KpiCardProps) => {
  const t = TONES[tone];
  const h = HINT_TONE[hintTone];

  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`
        group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 text-left
        shadow-[0_1px_2px_rgba(15,23,42,0.04)]
        transition-all duration-300 ease-out
        ${interactive ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" : "cursor-default"}
      `}
    >
      <span className={`absolute -top-10 -right-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-500 ${t.glow} group-hover:opacity-100 opacity-70`} />

      <div className="relative flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] ring-1 transition-transform duration-300 group-hover:scale-105 ${t.tile}`}>
          {icon}
        </span>
        <ITText className="text-[10px] font-black uppercase leading-tight tracking-[0.14em] text-slate-400">
          {label}
        </ITText>
      </div>

      <div className="relative mt-3 flex items-end gap-2">
        <ITText className="text-[30px] font-black leading-none tabular-nums tracking-tight text-slate-900">
          {value}
        </ITText>
      </div>

      <div className="relative mt-2 flex min-h-[16px] items-center gap-1.5">
        {hint && (
          <>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${h.dot}`} />
            <ITText className={`truncate text-[11px] font-bold ${h.text}`}>{hint}</ITText>
          </>
        )}
      </div>
    </button>
  );
};
