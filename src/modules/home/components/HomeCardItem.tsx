import { ITCard, ITText } from "@axzydev/axzy_ui_system";

export const HomeCardItem = ({ item, index }: any) => {
  return (
    <ITCard
      onClick={item.action}
      className="group transform hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5 border border-slate-100/80 rounded-[24px] transition-all duration-300 overflow-hidden cursor-pointer"
      contentClassName="h-full flex flex-col p-6 min-h-[160px] justify-between"
      key={index}
    >
      <div className="flex items-center justify-between w-full">
        {/* Primary Color container for icon */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white group-hover:bg-emerald-700 transition-all duration-300 shadow-md shadow-emerald-600/10">
          {item.icon && <div className="text-xl flex items-center justify-center">{item.icon}</div>}
        </div>
        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-emerald-400 transition-colors duration-300" />
      </div>

      <div className="mt-6 space-y-1">
        <ITText className="text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">
          {item.title}
        </ITText>
        {item.description && (
          <ITText className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-normal line-clamp-2">
            {item.description}
          </ITText>
        )}
      </div>
    </ITCard>
  );
};
