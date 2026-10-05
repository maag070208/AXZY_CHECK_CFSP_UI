import { ITText } from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { SURFACE, TONES, type SemanticTone } from "@shared/ui";

export interface HomeCardItemData {
  title: string;
  description: string;
  /** Ya renderizado por la vista: el view-model no conoce JSX. */
  icon: ReactNode;
  path: string;
}

interface Props {
  item: HomeCardItemData;
  index: number;
  tone: SemanticTone;
}

/**
 * Tarjeta de acceso rápido del inicio.
 *
 * Es un `<Link>` (no un botón con `onClick`): la navegación interna mantiene
 * Ctrl/Cmd+click, click central y semántica de enlace. El tono es semántico
 * para no depender de colores crudos que se rompen en modo oscuro.
 */
export const HomeCardItem = ({ item, index, tone }: Props) => {
  const t = TONES[tone];

  return (
    <Link
      to={item.path}
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-rise group relative flex h-full min-h-[164px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-secondary-200/70 bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-secondary-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:translate-y-0 active:shadow-sm dark:border-secondary-800 dark:bg-secondary-900"
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />

      <div className="relative flex w-full items-start justify-between p-5">
        <span
          aria-hidden="true"
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg transition-transform duration-300 group-hover:scale-110 ${t.soft} ${t.softText}`}
        >
          {item.icon}
        </span>
        <FaArrowRight
          size={12}
          aria-hidden="true"
          className="mt-1 text-secondary-300 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-primary-600"
        />
      </div>

      <div className="relative w-full space-y-1 p-5 pt-0">
        <ITText as="h3" className={`block text-sm font-black uppercase tracking-tight ${SURFACE.strong}`}>
          {item.title}
        </ITText>
        <ITText as="p" className="line-clamp-2 text-[11px] font-medium leading-snug text-secondary-500">
          {item.description}
        </ITText>
      </div>
    </Link>
  );
};
