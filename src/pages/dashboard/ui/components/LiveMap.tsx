import { AdvancedMarker, APIProvider, InfoWindow, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { ILiveMapPoint, LiveRoundState } from "@entities/supervision";
import { timeAgo } from "@app/core/utils/supervision.utils";

const PIN_COLORS: Record<LiveRoundState, { background: string; border: string }> = {
  ON_TRACK: { background: "#10b981", border: "#065f46" },
  STALLED: { background: "#f59e0b", border: "#92400e" },
  ABANDONED: { background: "#94a3b8", border: "#475569" },
};

/** Ajusta el encuadre para que se vean todos los puntos. */
const FitBounds = ({ points }: { points: ILiveMapPoint[] }) => {
  const map = useMap();
  const signature = points.map((p) => `${p.latitude},${p.longitude}`).join("|");
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter({ lat: points[0].latitude, lng: points[0].longitude });
      map.setZoom(16);
      return;
    }
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    map.fitBounds(
      { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
      48,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);
  return null;
};

/** Última ubicación conocida de cada guardia con ronda en curso. */
export const LiveMap = ({ points, height = 340 }: { points: ILiveMapPoint[]; height?: number }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [selected, setSelected] = useState<ILiveMapPoint | null>(null);

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-secondary-200 bg-secondary-50 text-sm text-secondary-400 dark:border-secondary-800 dark:bg-secondary-800/40 dark:text-secondary-500"
        style={{ height }}
      >
        Google Maps no está configurado
      </div>
    );
  }
  if (points.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-secondary-200 bg-secondary-50 px-6 text-center dark:border-secondary-800 dark:bg-secondary-800/40"
        style={{ height }}
      >
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-secondary-400 dark:bg-secondary-900 dark:text-secondary-500">
          <FaMapMarkerAlt aria-hidden="true" size={16} />
        </span>
        <ITText as="p" className="text-[13px] font-semibold text-secondary-700 dark:text-secondary-200">
          Sin ubicaciones en vivo
        </ITText>
        <ITText as="p" className="mx-auto mt-1 max-w-[280px] text-[11px] font-medium leading-relaxed text-secondary-500 dark:text-secondary-400">
          Aparecen cuando un guardia escanea un punto durante su ronda.
        </ITText>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-secondary-200 dark:border-secondary-800" style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: points[0].latitude, lng: points[0].longitude }}
          defaultZoom={15}
          gestureHandling="cooperative"
          mapId="bf3fcca21542f575"
          disableDefaultUI={false}
        >
          {points.map((p) => (
            <AdvancedMarker key={p.roundId} position={{ lat: p.latitude, lng: p.longitude }} onClick={() => setSelected(p)}>
              <Pin background={PIN_COLORS[p.state].background} borderColor={PIN_COLORS[p.state].border} glyphColor="#fff" />
            </AdvancedMarker>
          ))}
          {selected && (
            <InfoWindow position={{ lat: selected.latitude, lng: selected.longitude }} onCloseClick={() => setSelected(null)}>
              <div className="min-w-[160px]">
                <p className="text-sm font-bold text-secondary-800 dark:text-secondary-100">{selected.guardName}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">{selected.routeTitle ?? "Ronda sin ruta"}</p>
                {selected.clientName && <p className="text-xs text-secondary-500 dark:text-secondary-400">{selected.clientName}</p>}
                <p className="mt-1 text-[11px] text-secondary-400">Último escaneo {timeAgo(selected.timestamp)}</p>
              </div>
            </InfoWindow>
          )}
          <FitBounds points={points} />
        </Map>
      </APIProvider>
    </div>
  );
};
