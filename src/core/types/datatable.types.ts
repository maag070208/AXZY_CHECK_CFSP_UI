/**
 * Re-export de compatibilidad. Los contratos viven en `@shared/api`.
 *
 * Se corrigió el error histórico: este archivo declaraba
 * `ITDataTableResponse<T> = { rows, total }`, pero `ITDataTable` espera
 * `{ data, total }`. Ese desajuste obligaba a `fetchData={fn as any}` en una
 * decena de páginas. La forma paginada del backend ahora se llama `Paginated`.
 *
 * @deprecated Importa desde `@shared/api`.
 */
export type {
  ITDataTableFetchParams,
  ITDataTableResponse,
  Paginated,
} from "@shared/api";
