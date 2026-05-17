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
    <div className="flex flex-col gap-6 mb-8">
      {/* Contenedor Superior: Icono + Títulos */}
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-emerald-50/30 rounded-2xl shadow-sm border border-emerald-100 text-emerald-600 shrink-0">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 racking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
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
        <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 md:border-none md:pt-0">
          <div className="flex flex-wrap items-center justify-end gap-4 w-full">
            {/* 1. Buscador de Cliente (filter) */}
            {filter && <div className="w-full md:w-72">{filter}</div>}

            {/* 2. Buscador de Texto (search) */}
            {search && (
              <div className="w-full md:w-80 relative group">
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
              <div className="w-full md:w-80">
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
              <div className="w-full md:w-auto">{extraFilter}</div>
            )}

            {/* 5. Refrescar */}
            {onRefresh && (
              <ITButton
                onClick={onRefresh}
                variant="outlined"
                color="secondary"
              >
                <FaSync className={refreshKey % 2 === 0 ? "" : "rotate-180"} />
              </ITButton>
            )}

            {/* 6. Limpiar Filtros */}
            {showClearFilters && onClearFilters && (
              <ITButton
                onClick={onClearFilters}
                variant="filled"
                color="error"
                size="small"
                title="Limpiar Filtros"
              >
                <FaFilter size={12} />
              </ITButton>
            )}

            {/* 7. Nuevo */}
            {onCreate && (
              <ITButton onClick={onCreate} color="primary">
                <div className="flex items-center gap-2">
                  <FaPlus size={12} />
                  <span className="whitespace-nowrap">{createLabel}</span>
                </div>
              </ITButton>
            )}

            {actions}
          </div>
        </div>
      )}
    </div>
  );
};
