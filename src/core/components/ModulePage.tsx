import { ITBreadcrumbItem, ITButton, ITDatePicker, ITFlex, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { CSSProperties, ReactNode } from "react";
import { IconType } from "react-icons";
import { FaFilter, FaPlus, FaSync, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export interface ModulePageProps {
  title: string;
  subtitle?: string;
  icon: IconType;
  /** Por defecto: Inicio › título. */
  breadcrumbs?: ITBreadcrumbItem[];
  /** Por defecto regresa a la pantalla anterior. */
  backAction?: () => void;
  /** Botones extra junto a Refrescar / Nuevo. */
  actions?: ReactNode;

  // Filtros, en el orden estándar de FANSAL:
  /** 1. Selector de cliente / entidad principal. */
  filter?: ReactNode;
  /** 2. Búsqueda de texto. */
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    /** Ícono a la izquierda del campo. */
    icon?: IconType;
  };
  /** 3. Rango de fechas. */
  dateRange?: {
    value: [Date | null, Date | null];
    onChange: (val: [Date | null, Date | null]) => void;
    placeholder?: string;
  };
  /** 4. Filtro triple u otros. */
  extraFilter?: ReactNode;

  onRefresh?: () => void;
  refreshKey?: number;
  onCreate?: () => void;
  createLabel?: string;
  onClearFilters?: () => void;
  showClearFilters?: boolean;

  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Página estándar de módulo: encabezado de `ITPage` (ícono, título,
 * breadcrumbs, regresar y acciones) + barra de filtros en el orden
 * estándar (cliente → búsqueda → fechas → filtro triple).
 */
export const ModulePage = ({
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
  style,
  children,
}: ModulePageProps) => {
  const navigate = useNavigate();
  const hasFilters = !!(filter || search || dateRange || extraFilter);

  const headerActions =
    onRefresh || onCreate || actions || (showClearFilters && onClearFilters) ? (
      <ITFlex align="center" gap={2} wrap="wrap">
        {onRefresh && (
          <ITButton variant="outlined" color="secondary" onClick={onRefresh} title="Refrescar">
            <FaSync size={12} className={refreshKey % 2 === 0 ? "" : "rotate-180"} />
          </ITButton>
        )}
        {showClearFilters && onClearFilters && (
          <ITButton variant="outlined" color="error" onClick={onClearFilters} title="Limpiar filtros">
            <FaFilter size={12} />
          </ITButton>
        )}
        {actions}
        {onCreate && (
          <ITButton variant="filled" color="primary" onClick={onCreate}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px] whitespace-nowrap">{createLabel}</ITText>
            </ITFlex>
          </ITButton>
        )}
      </ITFlex>
    ) : undefined;

  return (
    <div style={style}>
      <ITPage
        noPadding
        title={title}
        description={subtitle}
        icon={<Icon size={20} />}
        backAction={backAction ?? (() => navigate(-1))}
        breadcrumbs={breadcrumbs ?? [{ label: "Inicio", onClick: () => navigate("/home") }, { label: title }]}
        actions={headerActions}
      >
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {filter && <div className="w-full md:w-64 lg:w-72">{filter}</div>}

            {search && (
              <div className="relative flex-1 min-w-[180px] md:flex-none md:w-64 lg:w-80">
                <ITInput
                  name="search"
                  placeholder={search.placeholder || "Buscar..."}
                  value={search.value}
                  iconLeft={search.icon ? <search.icon size={13} className="text-slate-400" /> : undefined}
                  onBlur={() => {}}
                  onChange={(e) => search.onChange(e.target.value)}
                  className="w-full"
                />
                {search.value && (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    onClick={() => search.onChange("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
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
                  value={dateRange.value as [Date | null, Date | null]}
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
    </div>
  );
};
