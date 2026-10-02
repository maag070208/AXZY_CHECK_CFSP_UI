/**
 * Contratos de datos compartidos por toda la app.
 *
 * Única fuente de verdad para la forma de las respuestas HTTP y para los tipos
 * que consume `ITDataTable`. Antes existían tres declaraciones distintas de
 * `DatatableResponse` (una de ellas con `rows` en lugar de `data`), lo que
 * obligaba a castear `fetchData as any` en una decena de páginas.
 */
import type {
  ColumnFilters,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";

/**
 * Envoltura estándar de la API. `data` siempre existe; en error llega `null`
 * y el detalle en `messages`.
 */
export interface TResult<T> {
  success: boolean;
  data: T;
  messages: string[];
  stack?: string;
}

/**
 * Forma paginada que devuelven los endpoints de datatable
 * (`POST /recurso/datatable`).
 *
 * ⚠️ El backend **NO es consistente**: verificado contra la API local,
 * `/kardex/datatable` responde `{ data, total }` mientras que
 * `/incidents`, `/maintenance` y `/guard-logs` responden `{ rows, total }`.
 * Por eso ambos campos son opcionales y `toTableResponse` acepta los dos:
 * asumir uno solo vaciaba la tabla en silencio.
 *
 * Lo correcto a medio plazo es normalizar el backend; hasta entonces la
 * tolerancia vive en un único sitio (aquí).
 */
export type Paginated<T> = {
  rows?: T[];
  data?: T[];
  total?: number;
};

/** Parámetros que `ITDataTable` entrega a `fetchData`. */
export type { ColumnFilters, ITDataTableFetchParams, ITDataTableResponse };

/** Filtros que viajan al backend junto con la paginación. */
export type TableFilters = Record<string, string | number | boolean | Date | [Date | null, Date | null] | null>;

/**
 * Adapta una respuesta paginada del backend a lo que espera `ITDataTable`,
 * aceptando tanto `rows` como `data`. Evita repetir el mapeo en cada página.
 */
export const toTableResponse = <T>(
  res: TResult<Paginated<T>> | null | undefined,
): ITDataTableResponse<T> => {
  const payload = res?.success ? res.data : null;
  const rows = payload?.rows ?? payload?.data ?? [];
  const total = payload?.total ?? 0;

  return {
    data: Array.isArray(rows) ? rows : [],
    total: typeof total === "number" ? total : 0,
  };
};

/** Respuesta correcta. */
export const ok = <T>(data: T, messages: string[] = ["Success"]): TResult<T> => ({
  success: true,
  data,
  messages,
});

/** Respuesta fallida. `data` se fuerza a `null` para que el consumidor no lea basura. */
export const fail = <T>(messages: string[], stack?: string): TResult<T> => ({
  success: false,
  data: null as T,
  messages: messages.length ? messages : ["Error inesperado"],
  ...(stack ? { stack } : {}),
});
