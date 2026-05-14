import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCompress,
  FaExpand,
  FaPlay,
  FaTimes,
} from "react-icons/fa";

interface MediaItem {
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
  title?: string;
}

interface MediaCarouselProps {
  media: (MediaItem | string)[];
  initialIndex?: number;
  title?: string;
  onClose?: () => void;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  media: rawMedia,
  initialIndex = 0,
  title = "Galería de Medios",
  onClose,
}) => {
  const media = React.useMemo(() => {
    if (!rawMedia) return [];
    return rawMedia.map((item) => {
      if (typeof item === "string") {
        const isVideo = item.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i);
        return { type: isVideo ? "VIDEO" : "IMAGE", url: item } as MediaItem;
      }
      return item;
    });
  }, [rawMedia]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    if (media.length <= 1) return;
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  }, [media.length]);

  const prevSlide = useCallback(() => {
    if (media.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  }, [media.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [nextSlide, prevSlide, onClose]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!media || media.length === 0) return null;
  const currentItem = media[currentIndex];

  return (
    <div
      ref={containerRef}
      className={`
        flex flex-col w-full h-full mx-auto overflow-hidden bg-white transition-all duration-500
        pointer-events-auto
        fixed inset-0
        ${isFullscreen ? "fixed inset-0 z-[99999]" : "relative"}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Premium Glass Header */}
      <div
        className="absolute top-0 inset-x-0 z-20 p-10 flex justify-between items-start pointer-events-none bg-gradient-to-b from-white/90 via-white/40 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <h4 className="text-slate-800 text-xl font-black uppercase tracking-tight">
              {title}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Evidencia {currentIndex + 1} de {media.length}
            </span>
            {currentItem.type === "VIDEO" && (
              <span className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 animate-pulse">
                Video Operativo
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            title={isFullscreen ? "Contraer" : "Expandir"}
            className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 hover:text-white hover:shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all active:scale-90 shadow-sm"
          >
            {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Cerrar Galería"
              className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:border-rose-400 hover:text-white hover:shadow-[0_10px_20px_rgba(244,63,94,0.2)] transition-all active:scale-90 shadow-sm"
            >
              <FaTimes size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="flex-1 relative flex items-center justify-center p-10 lg:p-20 overflow-hidden bg-slate-50/50"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      >
        <div
          className="relative group/view w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {currentItem.type === "VIDEO" ||
          currentItem.url.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i) ? (
            <video
              key={currentItem.url}
              src={currentItem.url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-slate-200/50 animate-in fade-in zoom-in-95 duration-700 bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.title || `Media ${currentIndex}`}
              className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-slate-200/50 select-none animate-in fade-in zoom-in-95 duration-700"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Premium Nav Controls */}
          {media.length > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-10 pointer-events-none opacity-0 group-hover/view:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="pointer-events-auto w-16 h-16 rounded-[2rem] bg-white shadow-xl border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all group/btn"
              >
                <FaChevronLeft
                  size={20}
                  className="group-hover/btn:-translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="pointer-events-auto w-16 h-16 rounded-[2rem] bg-white shadow-xl border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-400 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all group/btn"
              >
                <FaChevronRight
                  size={20}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails Navigator */}
      <div className="h-28 bg-white border-t border-slate-100 px-8 flex items-center justify-center gap-4 shrink-0 overflow-x-auto no-scrollbar shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        {media.map((item, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`
              relative w-16 h-16 rounded-[1.25rem] overflow-hidden border-2 transition-all duration-500 shrink-0
              ${
                currentIndex === idx
                  ? "border-emerald-500 scale-110 shadow-[0_10px_20px_rgba(16,185,129,0.2)] ring-4 ring-emerald-500/5"
                  : "border-slate-100 opacity-50 hover:opacity-100 hover:border-slate-200 hover:scale-105"
              }
            `}
          >
            {item.type === "VIDEO" ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                <video
                  src={item.url}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaPlay size={12} className="text-white drop-shadow-md" />
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                className="w-full h-full object-cover"
                alt=""
              />
            )}

            {currentIndex === idx && (
              <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
            )}
          </button>
        ))}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `,
        }}
      />
    </div>
  );
};
