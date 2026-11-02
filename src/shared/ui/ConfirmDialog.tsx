import { ITConfirmDialog } from "@axzydev/axzy_ui_system";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Pregunta directa, p. ej. "¿Eliminar incidencia?". */
  title: string;
  /** Consecuencia de la acción. */
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para borrados, `warning` para cambios de estado. */
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

/**
 * Confirmación destructiva estándar.
 *
 * Existe para retirar los 5 `window.confirm()` que quedan en la app
 * (prohibidos por `FANSAL_RULES.txt` §3F) y para unificar los 3 sitios que ya
 * usaban `ITConfirmDialog` con otros que montaban su propio `ITDialog`.
 *
 * Se monta en un portal a `document.body` dentro de un contenedor con
 * `z-[100]`: `ITConfirmDialog` trae `z-[60]` fijo (igual que `ITDialog`), así
 * que sin esto la confirmación quedaba **debajo** del diálogo de detalle (p. ej.
 * resolver una incidencia desde su detalle). El portal lo saca del árbol de la
 * página y el `z-index` del contenedor garantiza que quede por encima de
 * cualquier `ITDialog`.
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="relative z-[100]">
      <ITConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
        loading={loading}
      />
    </div>,
    document.body,
  );
};
