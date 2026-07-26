import { IActivityItem } from "../services/DashboardService";

/**
 * Mapea un item de actividad a la URL de su página de detalle.
 * La página destino detecta el `?id=` y abre el detail dialog
 * automáticamente (cuando aplica).
 *
 * Devuelve `null` si el tipo no tiene página de detalle asociada.
 */
export const activityItemToHref = (
  item: Pick<IActivityItem, "type" | "id" | "guardId">,
): string | null => {
  switch (item.type) {
    case "incident":
      return `/incidents?id=${encodeURIComponent(item.id)}`;
    case "maintenance":
      return `/maintenances?id=${encodeURIComponent(item.id)}`;
    case "discipline":
      return `/guard-discipline?id=${encodeURIComponent(item.id)}`;
    case "panic":
      return `/panic-alerts?id=${encodeURIComponent(item.id)}`;
    case "round":
      return `/rounds/${encodeURIComponent(item.id)}`;
    case "kardex":
      return item.guardId
        ? `/kardex?guardId=${encodeURIComponent(item.guardId)}`
        : `/kardex`;
    default:
      return null;
  }
};
