import { ITText } from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import { FaArrowRight } from "react-icons/fa";
import { SURFACE, TONES } from "@shared/ui";

export interface HomeCardItemData {
  title: string;
  description: string;
  action: () => void;
  /** Ya renderizado por la vista: el view-model no conoce JSX. */
  icon: ReactNode;
}

interface Props {
  item: HomeCardItemData;
  index: number;
}

/**
 * Tarjeta de acceso rápido del inicio.
 *
 * Antes usaba `emerald` (que no existe en la paleta del tema, así que se veía
 * mal en modo oscuro) y `props: any`. El icono llega ya renderizado desde la
 * vista, para que el view-model quede libre de JSX.
 */
export const HomeCardItem = ({ item, index }: Props) => (
  <button
    type="button"
    onClick={item.action}
    style={{ animationDelay: `${index * 30}ms` }}
    className="group relative flex h-full min-h-[150px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-secondary-200/70 bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-primary-300 active:translate-y-0 active:shadow-sm dark:border-secondary-800 dark:bg-secondary-900"
  >
    <span className={`absolute inset-x-0 top-0 h-1 ${TONES.brand.dot}`} />

    <div className="relative flex w-full items-start justify-between p-5">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110 ${TONES.brand.soft} ${TONES.brand.softText}`}
      >
        {item.icon}
      </span>
      <FaArrowRight
        size={12}
        className="text-secondary-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary-600"
      />
    </div>

    <div className="relative w-full space-y-1 p-5 pt-0">
      <ITText
        className={`block text-sm font-black uppercase tracking-tight transition-colors group-hover:text-primary-700 ${SURFACE.strong}`}
      >
        {item.title}
      </ITText>
      <ITText className="line-clamp-2 text-[11px] font-medium leading-snug text-secondary-500">
        {item.description}
      </ITText>
    </div>
  </button>
);
