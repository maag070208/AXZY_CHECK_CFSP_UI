import { complianceColor } from "@app/core/utils/supervision.utils";

const STROKE: Record<ReturnType<typeof complianceColor>, string> = {
  success: "stroke-emerald-500",
  warning: "stroke-amber-500",
  danger: "stroke-rose-500",
  gray: "stroke-slate-300",
};

const TEXT: Record<ReturnType<typeof complianceColor>, string> = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
  gray: "text-slate-400",
};

interface ScoreRingProps {
  /** 0-100, o null cuando aún no hay nada que medir. */
  percent: number | null;
  size?: number;
  caption?: string;
  /** Fuerza el color (p. ej. "no cumple" aunque el % sea alto). */
  tone?: ReturnType<typeof complianceColor>;
}

/** Anillo de progreso con el porcentaje al centro. */
export const ScoreRing = ({ percent, size = 72, caption, tone }: ScoreRingProps) => {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = percent ?? 0;
  const color = tone ?? complianceColor(percent);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={`${STROKE[color]} transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`font-black tabular-nums ${TEXT[color]}`} style={{ fontSize: size * 0.24 }}>
          {percent === null ? "—" : `${percent}%`}
        </span>
        {caption && <span className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">{caption}</span>}
      </div>
    </div>
  );
};
