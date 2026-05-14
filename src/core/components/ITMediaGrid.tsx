import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import { MediaCarousel } from "./MediaCarousel";

interface MediaItem {
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
  title?: string;
}

interface ITMediaGridProps {
  media: (MediaItem | string)[];
  title?: string;
  gridSize?: number; // Default 250
}

export const ITMediaGrid: React.FC<ITMediaGridProps> = ({
  media: rawMedia,
  title = "Galería de Evidencias",
  gridSize = 240,
}) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const media = React.useMemo(() => {
    if (!rawMedia) return [];
    return rawMedia.map((item) => {
      if (typeof item === "string") {
        const isVideo = item.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i);
        return { type: isVideo ? "VIDEO" : "IMAGE", url: item } as MediaItem;
      }
      return {
        ...item,
        type: item.type?.toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE",
      } as MediaItem;
    });
  }, [rawMedia]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { current } = scrollRef;
    const scrollAmount = gridSize + 20; // size + gap
    current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (media.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-6 group/carousel">
      {/* Header with Emerald Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em]">
            {title}
          </h4>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {media.length} Archivos
          </span>
        </div>

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 hover:shadow-md transition-all active:scale-95"
            >
              <FaChevronLeft size={12} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 hover:shadow-md transition-all active:scale-95"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {media.map((item, index) => (
          <div
            key={index}
            onClick={() => setSelectedMediaIndex(index)}
            className="relative group overflow-hidden rounded-[2.5rem] shadow-sm border border-slate-100 bg-white hover:shadow-2xl hover:shadow-emerald-900/10 hover:border-emerald-100 transition-all duration-500 snap-start shrink-0 cursor-pointer"
            style={{ width: gridSize, height: gridSize }}
          >
            {item.type === "VIDEO" ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                <video
                  src={`${item.url}#t=0.5`}
                  className="w-full h-full object-cover opacity-80"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors duration-500">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all duration-500 shadow-2xl">
                    <FaPlay size={20} className="translate-x-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.title || `Media ${index}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x400?text=Error+Carga";
                }}
              />
            )}

            {/* Badge Type - Glassmorphism */}
            <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-lg text-[9px] font-black text-white uppercase tracking-[0.2em] border border-white/10 pointer-events-none flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${item.type === "VIDEO" ? "bg-rose-400 animate-pulse" : "bg-emerald-400"}`}
              />
              {item.type}
            </div>

            {/* Premium Overlay Hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Fullscreen Carousel Overlay - Premium Experience (Ensima de todo excepto loader) */}
      {selectedMediaIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/95 backdrop-blur-2xl animate-in fade-in duration-500"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full flex flex-col animate-in zoom-in-95 duration-500">
              <MediaCarousel
                media={media}
                initialIndex={selectedMediaIndex}
                title={title}
                onClose={() => setSelectedMediaIndex(null)}
              />
            </div>
          </div>,
          document.body,
        )}

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
