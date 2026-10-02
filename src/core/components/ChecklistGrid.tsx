import { ITText } from "@axzydev/axzy_ui_system";
import { FaCheck, FaTimes } from "react-icons/fa";
import { IChecklistAnswer, IChecklistItemDefinition } from "@app/core/types/supervision.types";

interface ChecklistGridProps {
  catalog: IChecklistItemDefinition[];
  /** Estado por clave. */
  values: Record<string, boolean>;
  /** Si se omite, la grilla es de solo lectura. */
  onToggle?: (key: string, ok: boolean) => void;
  columns?: 2 | 3;
}

/** Convierte respuestas de la API a un mapa clave → ok. */
export const answersToMap = (answers: IChecklistAnswer[]): Record<string, boolean> =>
  Object.fromEntries(answers.map((a) => [a.key, a.ok]));

/** Convierte el mapa del formulario a la lista que espera la API. */
export const mapToAnswers = (
  catalog: IChecklistItemDefinition[],
  values: Record<string, boolean>,
): IChecklistAnswer[] => catalog.map((c) => ({ key: c.key, ok: !!values[c.key] }));

/**
 * Checklist agrupado por categoría del catálogo (Equipo, Uniforme, Aseo...).
 * Cada elemento es un botón que alterna cumple / no cumple.
 */
export const ChecklistGrid = ({ catalog, values, onToggle, columns = 3 }: ChecklistGridProps) => {
  const groups = catalog.reduce<Record<string, IChecklistItemDefinition[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});
  const readOnly = !onToggle;
  const gridCols = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([group, items]) => {
        const ok = items.filter((i) => values[i.key]).length;
        return (
          <div key={group} className="space-y-2">
            <div className="flex items-center justify-between">
              <ITText className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group}</ITText>
              <ITText className="text-[10px] font-bold text-slate-400 tabular-nums">
                {ok}/{items.length}
              </ITText>
            </div>
            <div className={`grid grid-cols-1 ${gridCols} gap-2`}>
              {items.map((item) => {
                const checked = !!values[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={readOnly}
                    aria-pressed={checked}
                    onClick={() => onToggle?.(item.key, !checked)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                      checked
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : readOnly
                          ? "bg-slate-50 border-slate-100 text-slate-400"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    } ${readOnly ? "cursor-default" : "cursor-pointer active:scale-[0.99]"}`}
                  >
                    <span className="text-[13px] font-semibold leading-tight">{item.label}</span>
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        checked ? "bg-emerald-500 text-white" : readOnly ? "text-rose-300" : "bg-slate-100 text-slate-300"
                      }`}
                    >
                      {checked ? <FaCheck size={9} /> : <FaTimes size={9} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
