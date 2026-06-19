import { IconType } from "react-icons";
import { FaFilter, FaPlus, FaSync, FaTimes } from "react-icons/fa";
import { ITButton, ITDatePicker, ITInput } from "@axzydev/axzy_ui_system";

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  icon: IconType;
  // Custom actions (Legacy/Extra)
  actions?: React.ReactNode;

  // Standardized Action Props
  filter?: React.ReactNode; // Client Search
  extraFilter?: React.ReactNode; // Triple Filter or others
  dateRange?: {
    value: [Date | null, Date | null];
    onChange: (val: [Date | null, Date | null]) => void;
    placeholder?: string;
  };
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    icon?: IconType;
  };
  onRefresh?: () => void;
  refreshKey?: number;
  onCreate?: () => void;
  createLabel?: string;
  onClearFilters?: () => void;
  showClearFilters?: boolean;
}

export const ModuleHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  filter,
  extraFilter,
  dateRange,
  search,
  onRefresh,
  refreshKey = 0,
  onCreate,
  createLabel = "Nuevo",
  onClearFilters,
  showClearFilters,
}: ModuleHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Contenedor Superior: Icono + Títulos */}
      <div className="flex items-center gap-3 md:gap-4">
        <ITButton variant="rounded" color="primary" className="h-12 w-14 shrink-0">
          <div className="flex items-center justify-center">
            <Icon size={28} />
          </div>
        </ITButton>
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-xs md:text-sm mt-0.5 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Contenedor Inferior: Acciones - FLEX WRAP ALINEADO DERECHA (Todo en una línea si cabe) */}
      {(actions ||
        filter ||
        extraFilter ||
        search ||
        dateRange ||
        onRefresh ||
        onCreate) && (
        <div className="w-full pt-3 md:pt-4 border-t border-slate-100 dark:border-slate-800 md:border-none md:pt-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full">
            {/* 1. Buscador de Cliente (filter) */}
            {filter && <div className="w-full md:w-64 lg:w-72">{filter}</div>}

            {/* 2. Buscador de Texto (search) */}
            {search && (
              <div className="flex-1 min-w-[160px] md:flex-none md:w-64 lg:w-80 relative group">
                <ITInput
                  placeholder={search.placeholder || "Buscar..."}
                  name="search"
                  value={search.value}
                  onBlur={() => {}}
                  onChange={(e) => search.onChange(e.target.value)}
                  className="w-full"
                />
                {search.value && (
                  <button
                    onClick={() => search.onChange("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            )}

            {/* 3. Filtro Fecha (dateRange) */}
            {dateRange && (
              <div className="w-full md:w-64 lg:w-80">
                <ITDatePicker
                  label=""
                  name="dateRange"
                  value={dateRange.value as any}
                  range
                  onChange={(e) => {
                    const val = e.target.value as any;
                    if (Array.isArray(val)) {
                      dateRange.onChange(val as [Date | null, Date | null]);
                    }
                  }}
                  className="w-full"
                />
              </div>
            )}

            {/* 4. Triple Filtro (extraFilter) */}
            {extraFilter && (
              <div className="md:w-auto">{extraFilter}</div>
            )}

            {/* Group refresh + clear + create + actions */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 md:ml-auto w-full md:w-auto">
              {onRefresh && (
                <ITButton
                  onClick={onRefresh}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  className="w-full md:w-auto"
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <FaSync className={refreshKey % 2 === 0 ? "" : "rotate-180"} size={14} />
                    <span className="md:hidden text-xs">Refrescar</span>
                  </div>
                </ITButton>
              )}

              {showClearFilters && onClearFilters && (
                <ITButton
                  onClick={onClearFilters}
                  variant="filled"
                  color="error"
                  size="small"
                >
                  <FaFilter size={12} />
                </ITButton>
              )}

              {onCreate && (
                <ITButton onClick={onCreate} color="primary" size="small" className="w-full md:w-auto">
                  <div className="flex items-center gap-1.5 justify-center">
                    <FaPlus size={12} />
                    <span className="whitespace-nowrap text-xs md:text-sm">{createLabel}</span>
                  </div>
                </ITButton>
              )}

              {actions}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
