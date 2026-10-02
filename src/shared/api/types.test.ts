import { describe, expect, it } from "vitest";
import { toTableResponse, type Paginated, type TResult } from "./types";

/**
 * El backend NO es consistente en la forma paginada: `/kardex/datatable`
 * responde `{ data, total }` y el resto `{ rows, total }`. Estos casos fijan
 * esa tolerancia, porque asumir una sola forma vacía la tabla en silencio.
 */
const wrap = <T>(data: Paginated<T>): TResult<Paginated<T>> => ({ success: true, data, messages: [] });

describe("toTableResponse", () => {
  it("acepta la forma `rows` (incidents, maintenance, guard-logs)", () => {
    const res = wrap({ rows: [{ id: "1" }, { id: "2" }], total: 7 });

    expect(toTableResponse(res)).toEqual({ data: [{ id: "1" }, { id: "2" }], total: 7 });
  });

  it("acepta la forma `data` (kardex)", () => {
    const res = wrap({ data: [{ id: "1" }], total: 1 });

    expect(toTableResponse(res)).toEqual({ data: [{ id: "1" }], total: 1 });
  });

  it("si falla la petición devuelve vacío en lugar de lanzar", () => {
    const res: TResult<Paginated<{ id: string }>> = {
      success: false,
      data: { rows: [{ id: "1" }], total: 1 },
      messages: ["boom"],
    };

    expect(toTableResponse(res)).toEqual({ data: [], total: 0 });
  });

  it("tolera respuestas sin filas y sin total", () => {
    expect(toTableResponse(wrap({}))).toEqual({ data: [], total: 0 });
    expect(toTableResponse(null)).toEqual({ data: [], total: 0 });
    expect(toTableResponse(undefined)).toEqual({ data: [], total: 0 });
  });

  it("tolera que las filas no sean un array", () => {
    const res = wrap({ rows: undefined, total: 3 } as Paginated<{ id: string }>);

    expect(toTableResponse(res)).toEqual({ data: [], total: 3 });
  });
});
