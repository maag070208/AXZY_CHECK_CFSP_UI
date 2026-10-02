import { AdvancedMarker, APIProvider, InfoWindow, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { ILiveMapPoint, LiveRoundState } from "@app/core/types/supervision.types";
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
      <div className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-400" style={{ height }}>
        Google Maps no está configurado
      </div>
    );
  }
  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center px-6" style={{ height }}>
        <ITText className="text-sm font-bold text-slate-500">Sin ubicaciones en vivo</ITText>
        <ITText className="text-xs text-slate-400 mt-1">Aparecen cuando un guardia escanea un punto durante su ronda.</ITText>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height }}>
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
                <p className="text-sm font-bold text-slate-800">{selected.guardName}</p>
                <p className="text-xs text-slate-500">{selected.routeTitle ?? "Ronda sin ruta"}</p>
                {selected.clientName && <p className="text-xs text-slate-500">{selected.clientName}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Último escaneo {timeAgo(selected.timestamp)}</p>
              </div>
            </InfoWindow>
          )}
          <FitBounds points={points} />
        </Map>
      </APIProvider>
    </div>
  );
};
