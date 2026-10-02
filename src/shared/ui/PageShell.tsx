import {
  ITBreadcrumbItem,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { IconType } from "react-icons";
import { FaFilter, FaPlus, FaSync, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { SURFACE } from "./tokens";

export interface PageShellProps {
  title: string;
  subtitle?: string;
  icon: IconType;
  /** Por defecto: Inicio › título. */
  breadcrumbs?: ITBreadcrumbItem[];
  /** Por defecto regresa a la pantalla anterior. */
  backAction?: () => void;
  /** Botones extra junto a Refrescar / Nuevo. */
  actions?: ReactNode;

  // ── Filtros, en el orden estándar de FANSAL ──
  /** 1. Selector de cliente / entidad principal. */
  filter?: ReactNode;
  /** 2. Búsqueda de texto. */
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    icon?: IconType;
  };
  /** 3. Rango de fechas. */
  dateRange?: {
    value: [Date | null, Date | null];
    onChange: (val: [Date | null, Date | null]) => void;
    placeholder?: string;
  };
  /** 4. Filtro triple u otro. */
  extraFilter?: ReactNode;

  onRefresh?: () => void;
  refreshKey?: number;
  onCreate?: () => void;
  createLabel?: string;
  onClearFilters?: () => void;
  showClearFilters?: boolean;

  // ── Estados de página ──
  // `ModulePage` no los exponía, así que 16 páginas no podían mostrar carga ni
  // error: se quedaban con la tabla en blanco.
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;

  /** Mismo conjunto que acepta `ITPage`. */
  maxWidth?: "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  children: ReactNode;
}

/**
 * Shell único de página: encabezado + barra de filtros en el orden estándar +
 * estados de carga/error/vacío.
 *
 * Reemplaza a la vez a `ModulePage` (16 páginas de listado) y a las 9 páginas
 * que montaban `ITPage` a mano, que era la causa de que cada pantalla se viera
 * distinta.
 */
export const PageShell = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  backAction,
  actions,
  filter,
  search,
  dateRange,
  extraFilter,
  onRefresh,
  refreshKey = 0,
  onCreate,
  createLabel = "Nuevo",
  onClearFilters,
  showClearFilters,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  maxWidth = "7xl",
  children,
}: PageShellProps) => {
  const navigate = useNavigate();
  const hasFilters = Boolean(filter || search || dateRange || extraFilter);
  const hasActions = Boolean(onRefresh || onCreate || actions || (showClearFilters && onClearFilters));

  const headerActions = hasActions ? (
    <ITFlex align="center" gap={2} wrap="wrap">
      {onRefresh && (
        <ITButton variant="outlined" color="secondary" onClick={onRefresh} title="Refrescar" ariaLabel="Refrescar">
          <FaSync size={12} className={refreshKey % 2 === 0 ? "" : "rotate-180"} />
        </ITButton>
      )}
      {showClearFilters && onClearFilters && (
        <ITButton variant="outlined" color="secondary" onClick={onClearFilters} title="Limpiar filtros" ariaLabel="Limpiar filtros">
          <FaFilter size={12} />
        </ITButton>
      )}
      {actions}
      {onCreate && (
        <ITButton variant="filled" color="primary" onClick={onCreate}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText as="span" className="text-[11px] font-bold whitespace-nowrap">{createLabel}</ITText>
          </ITFlex>
        </ITButton>
      )}
    </ITFlex>
  ) : undefined;

  return (
    <ITPage
      noPadding
      maxWidth={maxWidth}
      title={title}
      description={subtitle}
      icon={<Icon size={20} />}
      backAction={backAction ?? (() => navigate(-1))}
      breadcrumbs={breadcrumbs ?? [{ label: "Inicio", onClick: () => navigate("/home") }, { label: title }]}
      actions={headerActions}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={empty}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
    >
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {filter && <div className="w-full md:w-64 lg:w-72">{filter}</div>}

          {search && (
            <div className="relative min-w-[180px] flex-1 md:w-64 md:flex-none lg:w-80">
              <ITInput
                name="search"
                placeholder={search.placeholder ?? "Buscar..."}
                value={search.value}
                iconLeft={search.icon ? <search.icon size={13} className="text-secondary-400" /> : undefined}
                onBlur={() => {}}
                onChange={(e) => search.onChange(e.target.value)}
                className="w-full"
              />
              {search.value && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => search.onChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-300 transition-colors hover:text-secondary-500"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          )}

          {dateRange && (
            <div className="w-full md:w-64 lg:w-80">
              <ITDatePicker
                name="dateRange"
                label=""
                range
                placeholder={dateRange.placeholder}
                value={dateRange.value}
                onChange={(e) => {
                  const val = e.target.value;
                  if (Array.isArray(val)) dateRange.onChange(val as [Date | null, Date | null]);
                }}
                className="w-full"
              />
            </div>
          )}

          {extraFilter && <div className="md:w-auto">{extraFilter}</div>}
        </div>
      )}
      {children}
    </ITPage>
  );
};

/** Contenedor estándar de tabla. Unifica radio, borde y sombra. */
export const DataTableCard = ({
  children,
  /** `true` cuando la tabla lleva `min-w-*` y necesita scroll lateral. */
  scrollX = false,
  className = "",
}: {
  children: ReactNode;
  scrollX?: boolean;
  className?: string;
}) => (
  <div className={`${SURFACE.tableCard} ${scrollX ? "overflow-x-auto" : "overflow-hidden"} ${className}`}>
    {children}
  </div>
);
