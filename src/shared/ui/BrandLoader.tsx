import { useEffect, useState } from "react";
import { ITText } from "@axzydev/axzy_ui_system";
import { BRAND_MARK } from "@assets/brand";
import animationData from "@assets/brand/checkapp-loader.json";

type LottieModule = typeof import("lottie-react");

export interface BrandLoaderProps {
  /** Tamaño en px del icono animado. */
  size?: number;
  /** Texto bajo el icono. Se omite si es `null`. */
  label?: string | null;
  className?: string;
  /** `true` para ocupar toda la pantalla con fondo atenuado. */
  fullScreen?: boolean;
}

/**
 * Loader de marca: el icono de CheckApp animado con Lottie.
 *
 * El reproductor (`lottie-web`, ~250 KB) se importa **dinámicamente** por dos
 * razones: no entra en el bundle inicial de la app, y no se evalúa en jsdom
 * (donde revienta por no tener canvas). Mientras carga se muestra el símbolo
 * estático, así nunca hay un hueco vacío.
 */
export const BrandLoader = ({
  size = 96,
  label = "Cargando…",
  className = "",
  fullScreen = false,
}: BrandLoaderProps) => {
  const [lottie, setLottie] = useState<LottieModule | null>(null);

  useEffect(() => {
    let alive = true;
    void import("lottie-react").then((module) => {
      if (alive) setLottie(module);
    });
    return () => {
      alive = false;
    };
  }, []);

  const content = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }} aria-hidden="true">
        {lottie ? (
          <lottie.Lottie src={animationData} autoplay loop style={{ width: size, height: size }} />
        ) : (
          <img src={BRAND_MARK} alt="" width={size} height={size} className="opacity-30" />
        )}
      </div>
      {label && (
        <ITText className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary-400">
          {label}
        </ITText>
      )}
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[2px] dark:bg-secondary-950/80"
    >
      {content}
    </div>
  );
};
