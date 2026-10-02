/**
 * Modelo de disciplina de guardias (categorías, tipos y registros).
 *
 * Endpoints verificados contra
 * `API/src/modules/guard-discipline/discipline.routes.ts`.
 */
export interface IDisciplineCategory {
  id: string;
  name: string;
  value: string;
  color?: string;
  icon?: string;
}

export interface IDisciplineType {
  id: string;
  categoryId: string;
  name: string;
  value: string;
  category?: IDisciplineCategory;
}

export interface IGuardDiscipline {
  id: string;
  guardId: string;
  title: string;
  description?: string | null;
  media?: { url: string; type: "photo" | "video" }[] | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  updatedAt: string;
  guard: { id: string; name: string; lastName: string | null; username: string };
  createdBy: { id: string; name: string; lastName: string | null; username: string };
  category?: { id: string; name: string; color?: string } | null;
  type?: { id: string; name: string } | null;
  client?: { id: string; name: string } | null;
}
