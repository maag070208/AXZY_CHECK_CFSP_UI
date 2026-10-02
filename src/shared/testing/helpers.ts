/**
 * Utilidades genéricas para tests.
 *
 * Aquí sólo vive lo que no depende de ningún dominio. Las factorías de una
 * entidad concreta (`makeGuard`, `makeIncident`…) van junto a esa entidad, en
 * `entities/<entidad>/__fixtures__/`: `shared` no puede conocer dominios.
 */
let sequence = 0;

/** Id incremental y predecible dentro de un test. */
export const makeId = (prefix = "id"): string => `${prefix}-${++sequence}`;


/** Fecha ISO desplazada `minutes` hacia atrás. */
export const isoMinutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();


