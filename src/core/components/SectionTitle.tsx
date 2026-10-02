import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";

/** Encabezado de sección de formulario: barra de color del tema + título en versalitas. */
export const SectionTitle = ({ children, aside }: { children: ReactNode; aside?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-4 rounded-full bg-[var(--color-primary)]" />
      <ITText className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{children}</ITText>
    </div>
    {aside}
  </div>
);
