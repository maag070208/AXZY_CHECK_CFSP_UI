/**
 * Lenguaje visual "premium minimal" del tablero, alineado con el Centro de
 * Reportes: superficies blancas elevadas, radios grandes, tiles con tinte del
 * tono, eyebrows en micro-mayúsculas y badges pill.
 *
 * Todo sale de `TONES` (tokens semánticos), no de colores crudos de Tailwind:
 * así funciona igual en claro y en oscuro.
 */
export const BOARD = {
  /** Tarjeta elevada. */
  frame: "rounded-2xl border border-secondary-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-20px_rgba(15,23,42,0.22)] dark:border-secondary-800 dark:bg-secondary-900",
  header: "flex items-center justify-between gap-3 border-b border-secondary-100 px-5 py-3.5 dark:border-secondary-800",
  body: "px-5 py-4",
  /** Título de sección en micro-mayúsculas (eyebrow). */
  title: "truncate text-[11px] font-black uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400",
  label: "text-[12px] font-medium text-secondary-500 dark:text-secondary-400",
  strong: "text-secondary-900 dark:text-secondary-50",
  /** Fila de lista: se ilumina al pasar, no lleva borde propio. */
  row: "flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left",
  divide: "divide-y divide-secondary-100 dark:divide-secondary-800",
  num: "tabular-nums tracking-tight",
  /** Tile de icono con tinte. */
  tile: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
} as const;
