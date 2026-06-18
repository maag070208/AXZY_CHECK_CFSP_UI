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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400 font-light">
            {title}
          </p>
          <span className="text-[10px] text-slate-400 font-light">
            {media.length} archivos
          </span>
        </div>

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-100 transition-all active:scale-95"
            >
              <FaChevronLeft size={10} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-100 transition-all active:scale-95"
            >
              <FaChevronRight size={10} />
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
            className="relative group overflow-hidden rounded-2xl shadow-sm border border-slate-100 bg-white hover:shadow-lg hover:shadow-sky-900/5 hover:border-sky-100 transition-all duration-500 snap-start shrink-0 cursor-pointer"
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
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 group-hover:bg-sky-500 group-hover:border-sky-400 transition-all duration-500 shadow-2xl">
                    <FaPlay size={18} className="translate-x-0.5" />
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

            {/* Type Badge */}
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-lg text-[9px] font-light text-white border border-white/10 pointer-events-none flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${item.type === "VIDEO" ? "bg-rose-400 animate-pulse" : "bg-sky-400"}`}
              />
              {item.type}
            </div>

            {/* Overlay Hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Fullscreen Carousel Overlay - Premium Experience (Ensima de todo excepto loader) */}
      {selectedMediaIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-white animate-in fade-in duration-300"
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
