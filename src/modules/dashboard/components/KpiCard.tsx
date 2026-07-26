import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { FaArrowUp, FaArrowDown, FaChevronRight } from "react-icons/fa";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: "primary" | "danger" | "warning" | "info" | "success" | "purple";
  trend?: { value: number; direction: "up" | "down" };
  subtitle?: string;
  pulse?: boolean;
  onClick?: () => void;
  breakdown?: Array<{
    label: string;
    value: number;
    tone?: "primary" | "warning" | "info" | "danger" | "success" | "purple";
  }>;
}

type Palette = {
  iconBg: string;
  iconText: string;
  accent: string;
  glow: string;
  ring: string;
};

const colorMap: Record<KpiCardProps["color"], Palette> = {
  primary: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-700",
    accent: "from-emerald-500 to-emerald-600",
    glow: "group-hover:shadow-emerald-200/60",
    ring: "ring-emerald-100",
  },
  danger: {
    iconBg: "bg-rose-50",
    iconText: "text-rose-700",
    accent: "from-rose-500 to-rose-600",
    glow: "group-hover:shadow-rose-200/60",
    ring: "ring-rose-100",
  },
  warning: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-700",
    accent: "from-amber-500 to-amber-600",
    glow: "group-hover:shadow-amber-200/60",
    ring: "ring-amber-100",
  },
  info: {
    iconBg: "bg-sky-50",
    iconText: "text-sky-700",
    accent: "from-sky-500 to-sky-600",
    glow: "group-hover:shadow-sky-200/60",
    ring: "ring-sky-100",
  },
  success: {
    iconBg: "bg-green-50",
    iconText: "text-green-700",
    accent: "from-green-500 to-green-600",
    glow: "group-hover:shadow-green-200/60",
    ring: "ring-green-100",
  },
  purple: {
    iconBg: "bg-violet-50",
    iconText: "text-violet-700",
    accent: "from-violet-500 to-violet-600",
    glow: "group-hover:shadow-violet-200/60",
    ring: "ring-violet-100",
  },
};

export const KpiCard = ({
  label,
  value,
  icon,
  color,
  trend,
  subtitle,
  pulse = false,
  onClick,
  breakdown,
}: KpiCardProps) => {
  const palette = colorMap[color];
  const isCritical = pulse && Number(value) > 0;
  const Wrapper: any = onClick ? "button" : "div";

  const toneClass: Record<NonNullable<KpiCardProps["breakdown"]>[number]["tone"] & string, string> = {
    primary: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-violet-50 text-violet-700 ring-violet-100",
    info: "bg-sky-50 text-sky-700 ring-sky-100",
    danger: "bg-rose-50 text-rose-700 ring-rose-100",
    success: "bg-green-50 text-green-700 ring-green-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`
        group relative flex flex-col items-stretch
        w-full text-left overflow-hidden
        rounded-2xl bg-white
        border border-slate-200/70
        shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)]
        hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${palette.glow}
        transition-all duration-300 ease-out
        ${onClick ? "cursor-pointer hover:-translate-y-1 active:translate-y-0" : "cursor-default"}
      `}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${palette.accent}`}
      />

      <div className="flex items-start justify-between w-full p-5 pb-3">
        <div
          className={`
            w-11 h-11 rounded-xl ${palette.iconBg} ${palette.iconText}
            ring-1 ${palette.ring}
            flex items-center justify-center text-lg
            transition-transform duration-300
            group-hover:scale-105
          `}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
              trend.direction === "up"
                ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100"
                : "text-rose-700 bg-rose-50 ring-1 ring-rose-100"
            }`}
          >
            {trend.direction === "up" ? (
              <FaArrowUp size={9} />
            ) : (
              <FaArrowDown size={9} />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="flex flex-col px-5 pb-5">
        <ITText className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">
          {label}
        </ITText>
        <ITText
          className={`text-[34px] leading-none font-black tracking-tight tabular-nums ${
            isCritical ? "text-rose-600" : "text-slate-900"
          }`}
        >
          {value}
        </ITText>
        {subtitle && (
          <ITText className="text-[11px] text-slate-500 font-semibold mt-2">
            {subtitle}
          </ITText>
        )}
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4 -mt-1">
          {breakdown.map((b, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ring-1 ${
                toneClass[b.tone ?? "primary"]
              }`}
            >
              <span className="tabular-nums text-[11px]">{b.value}</span>
              <span className="opacity-80">{b.label}</span>
            </span>
          ))}
        </div>
      )}

      {isCritical && (
        <span className="absolute top-4 right-4 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        </span>
      )}

      {onClick && (
        <FaChevronRight
          size={11}
          className="absolute bottom-4 right-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200"
        />
      )}
    </Wrapper>
  );
};
