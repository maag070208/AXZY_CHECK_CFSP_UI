import { ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight } from "react-icons/fa";

export const HomeCardItem = ({ item, index }: any) => {
  const accent = item.accent ?? "from-emerald-500 to-emerald-700";
  return (
    <button
      type="button"
      onClick={item.action}
      style={{ animationDelay: `${index * 30}ms` }}
      className={`
        group relative text-left
        w-full h-full min-h-[150px]
        flex flex-col justify-between
        rounded-2xl bg-white
        border border-slate-200/70
        shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)]
        hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:-translate-y-1
        active:translate-y-0 active:shadow-sm
        transition-all duration-300 ease-out
        overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-emerald-300
      `}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
      />
      <div
        className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${accent} opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 blur-2xl`}
      />

      <div className="relative p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`
              w-11 h-11 rounded-xl bg-gradient-to-br ${accent}
              flex items-center justify-center text-white text-lg
              shadow-sm ring-1 ring-white/20
              transition-transform duration-300
              group-hover:scale-110 group-hover:rotate-3
            `}
          >
            {item.icon}
          </div>
          <FaArrowRight
            size={12}
            className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all duration-200"
          />
        </div>

        <div className="space-y-1 flex-1">
          <ITText className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">
            {item.title}
          </ITText>
          <ITText className="text-[11px] text-slate-500 font-medium leading-snug line-clamp-2">
            {item.description}
          </ITText>
        </div>
      </div>
    </button>
  );
};
