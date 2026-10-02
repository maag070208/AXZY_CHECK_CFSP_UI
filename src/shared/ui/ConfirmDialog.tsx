import { ITConfirmDialog } from "@axzydev/axzy_ui_system";

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
}: ConfirmDialogProps) => (
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
);
