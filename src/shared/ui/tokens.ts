/**
 * Tokens semánticos del sistema de diseño.
 *
 * Toda la app hablaba en colores crudos de Tailwind (`emerald`, `rose`, `sky`,
 * `amber`, `violet`, `slate`) — 240 ocurrencias en 21 páginas. Esos colores no
 * existen en la paleta del tema, así que no seguían el theming y cada página
 * elegía un tono distinto para lo mismo.
 *
 * Aquí la intención manda: `brand`, `success`, `danger`, `warning`, `info`,
 * `accent`, `neutral`.
 *
 * IMPORTANTE — modo oscuro:
 * `ITThemeProvider` genera las escalas `--color-<tono>-50..950` con
 * `color-mix()` **una sola vez** y no las regenera en oscuro; su bloque `.dark`
 * sólo sobrescribe tokens `--it-*` y unas cuantas clases (`text-slate-400..800`,
 * `bg-white`, `bg-slate-50`). Por eso un `bg-success-50` a secas se quedaba casi
 * blanco sobre fondo oscuro.
 *
 * La contraparte oscura de estas escalas se define **en un solo sitio**:
 * `src/index.css`, con selectores `.dark .<utilidad>` (especificidad 0,2,0).
 * Por eso aquí NO se usan variantes `dark:` — perderían por orden de capas y
 * duplicarían la regla. Basta la clase plana.
 */

export type SemanticTone =
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "accent"
  | "neutral";

export interface ToneClasses {
  /** Fondo suave para tiles, filas y badges. */
  soft: string;
  /** Texto legible sobre `soft`. */
  softText: string;
  /** Anillo sutil que acompaña a `soft`. */
  softRing: string;
  /** Barra de acento sólida (2-3px) para filas y encabezados. */
  bar: string;
  /** Punto indicador. */
  dot: string;
  /** Fondo sólido con texto blanco. */
  solid: string;
  /** Texto de acento sobre fondo claro/oscuro. */
  text: string;
  /** Borde de acento. */
  border: string;
}

/**
 * `success` = completado/correcto · `danger` = error/crítico ·
 * `warning` = atención · `info` = informativo · `accent` = categoría
 * secundaria · `neutral` = sin estado · `brand` = identidad.
 */
export const TONES: Record<SemanticTone, ToneClasses> = {
  brand: {
    soft: "bg-primary-50",
    softText: "text-primary-700",
    softRing: "ring-primary-100",
    bar: "bg-primary-500",
    dot: "bg-primary-500",
    solid: "bg-primary-600 text-white",
    text: "text-primary-700",
    border: "border-primary-200",
  },
  success: {
    soft: "bg-success-50",
    softText: "text-success-700",
    softRing: "ring-success-100",
    bar: "bg-success-500",
    dot: "bg-success-500",
    solid: "bg-success-600 text-white",
    text: "text-success-700",
    border: "border-success-200",
  },
  danger: {
    soft: "bg-danger-50",
    softText: "text-danger-700",
    softRing: "ring-danger-100",
    bar: "bg-danger-500",
    dot: "bg-danger-500",
    solid: "bg-danger-600 text-white",
    text: "text-danger-700",
    border: "border-danger-200",
  },
  warning: {
    soft: "bg-warning-50",
    softText: "text-warning-700",
    softRing: "ring-warning-100",
    bar: "bg-warning-500",
    dot: "bg-warning-500",
    solid: "bg-warning-600 text-white",
    text: "text-warning-700",
    border: "border-warning-200",
  },
  info: {
    soft: "bg-info-50",
    softText: "text-info-700",
    softRing: "ring-info-100",
    bar: "bg-info-500",
    dot: "bg-info-500",
    solid: "bg-info-600 text-white",
    text: "text-info-700",
    border: "border-info-200",
  },
  accent: {
    soft: "bg-purple-50",
    softText: "text-purple-700",
    softRing: "ring-purple-100",
    bar: "bg-purple-500",
    dot: "bg-purple-500",
    solid: "bg-purple-600 text-white",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  neutral: {
    soft: "bg-secondary-50",
    softText: "text-secondary-600",
    softRing: "ring-secondary-100",
    bar: "bg-secondary-300",
    dot: "bg-secondary-300",
    solid: "bg-secondary-600 text-white",
    text: "text-secondary-600",
    border: "border-secondary-200",
  },
};

/** Color de `ITBadget`/`ITButton` equivalente a cada tono. */
export const TONE_TO_IT_COLOR: Record<
  SemanticTone,
  "primary" | "success" | "danger" | "warning" | "info" | "purple" | "secondary"
> = {
  brand: "primary",
  success: "success",
  danger: "danger",
  warning: "warning",
  info: "info",
  accent: "purple",
  neutral: "secondary",
};

/** Superficies y estructura, para no repetir las mismas clases en cada panel. */
export const SURFACE = {
  /** Tarjeta/panel base. */
  panel: "rounded-2xl border border-secondary-100 bg-white",
  /** Sombra suave estándar. */
  panelShadow: "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.18)]",
  /** Contenedor de tabla. */
  tableCard:
    "overflow-hidden rounded-2xl border border-secondary-100 bg-white",
  /** Encabezado de sección en micro-mayúsculas. */
  sectionLabel: "text-[11px] font-black uppercase tracking-[0.14em]",
  /** Etiqueta secundaria. */
  microLabel: "text-[10px] font-black uppercase tracking-[0.12em] text-secondary-500",
  /** Valor principal de celda/tarjeta. */
  value: "text-[13px] font-bold text-secondary-800",
  /** Texto principal. `secondary-900` no tiene override oscuro: se declara. */
  strong: "text-secondary-900",
  /** Divisor. */
  divider: "border-secondary-100",
} as const;
