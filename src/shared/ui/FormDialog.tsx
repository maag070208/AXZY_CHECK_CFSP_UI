import { ITButton, ITDialog, ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { IconType } from "react-icons";
import { SURFACE } from "./tokens";

const SIZES = {
  sm: "w-full max-w-md",
  md: "w-full max-w-xl",
  lg: "w-full max-w-3xl",
  xl: "w-full max-w-5xl",
} as const;

export interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Obligatorio: los 34 diálogos del proyecto pasaban `title=""` y rearmaban
   *  el encabezado a mano, cada uno distinto. */
  title: string;
  icon?: IconType;
  size?: keyof typeof SIZES;
  /** Botones del pie. Si se omite, se usa `submitLabel`/`onSubmit`. */
  footer?: ReactNode;
  submitLabel?: string;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  children: ReactNode;
}

/**
 * Diálogo de formulario estándar: encabezado real, cuerpo y pie consistentes.
 *
 * Antes cada página montaba su propio header (`px-8 pt-8 pb-4 border-b`) y su
 * propio pie, con 30 variantes distintas. Esto lo fija en un solo sitio.
 */
export const FormDialog = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  size = "md",
  footer,
  submitLabel = "Guardar",
  onSubmit,
  cancelLabel = "Cancelar",
  submitting = false,
  submitDisabled = false,
  children,
}: FormDialogProps) => (
  <ITDialog isOpen={isOpen} onClose={onClose} title={title} useFormHeader className={SIZES[size]}>
    <div className="flex flex-col">
      {Icon && (
        <div className="mb-5 flex items-center gap-2.5">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${SURFACE.sectionLabel} bg-secondary-100 text-secondary-600`}>
            <Icon size={13} />
          </span>
        </div>
      )}

      <div className="space-y-5">{children}</div>

      <div className="mt-7 flex flex-none items-center justify-end gap-3 border-t border-secondary-100 pt-5">
        {footer ?? (
          <>
            <ITButton variant="text" color="secondary" onClick={onClose} disabled={submitting}>
              <ITText as="span" className="text-[11px] font-black uppercase tracking-wider">{cancelLabel}</ITText>
            </ITButton>
            <ITButton variant="filled" color="primary" onClick={onSubmit} disabled={submitting || submitDisabled}>
              <ITText as="span" className="text-[11px] font-black uppercase tracking-wider">
                {submitting ? "Procesando..." : submitLabel}
              </ITText>
            </ITButton>
          </>
        )}
      </div>
    </div>
  </ITDialog>
);


/** Etiqueta de campo estándar. */
export const FieldLabel = ({ children, required = false }: { children: ReactNode; required?: boolean }) => (
  <ITText as="label" className={`${SURFACE.microLabel} mb-1.5 block`}>
    {children}
    {required && <span className="ml-0.5 text-danger-500">*</span>}
  </ITText>
);
