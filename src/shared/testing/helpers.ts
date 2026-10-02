/**
 * Utilidades genéricas para tests.
 *
 * Aquí sólo vive lo que no depende de ningún dominio. Las factorías de una
 * entidad concreta (`makeGuard`, `makeIncident`…) van junto a esa entidad, en
 * `entities/<entidad>/__fixtures__/`: `shared` no puede conocer dominios.
 */
import type { TResult } from "@shared/api";

let sequence = 0;

/** Id incremental y predecible dentro de un test. */
export const makeId = (prefix = "id"): string => `${prefix}-${++sequence}`;

/** Reinicia el contador de ids. Útil en `beforeEach`. */
export const resetFactoryIds = (): void => {
  sequence = 0;
};

/** Fecha ISO desplazada `minutes` hacia atrás. */
export const isoMinutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

/** `TResult` correcto. */
export const okResult = <T>(data: T, messages: string[] = ["Success"]): TResult<T> => ({
  success: true,
  data,
  messages,
});

/** `TResult` fallido, para simular errores de API sin lanzar. */
export const failResult = <T>(messages: string[] = ["Error de prueba"]): TResult<T> => ({
  success: false,
  data: null as T,
  messages,
});
