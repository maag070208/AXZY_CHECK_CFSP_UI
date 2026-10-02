/**
 * View-model del detalle de una ronda.
 *
 * Se extraen la lógica y el estado. `statusBadge`, `title` y `pageProps` se
 * quedan en la vista: son JSX.
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useParams } from "react-router-dom";
import { useITTheme } from "@axzydev/axzy_ui_system";
import { getRoundById, type RoundDetail, type RoundEvent } from "@entities/round";
import { listRoutes } from "@entities/route";

export const useRoundDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { colors } = useITTheme();
  const primary = colors.primary || "#10b981";
  const primaryLight = primary + "15";

  const user = useSelector((state: any) => state.auth);
  const isResident = user?.role === "RESDN";

  const [data, setData] = useState<RoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeTitle, setRouteTitle] = useState("");

  const metrics = useMemo(() => {
    if (!data) return null;

    const start = new Date(data.round.startTime);
    const end = data.round.endTime
      ? new Date(data.round.endTime)
      : data.round.status === "COMPLETED"
        ? new Date()
        : null;
    const effectiveEnd = end || new Date();

    const durationMs = effectiveEnd.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);

    const scans = data.timeline
      .filter((e: RoundEvent) => e.type === "SCAN")
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const visitedLocations = new Set<string>();
    const coveredLocations = new Set<string>();

    const mapNodes: any[] = [];
    let previousTime = start;

    mapNodes.push({
      type: "START",
      label: "Inicio",
      status: "START",
      timeDiff: null,
    });

    scans.forEach((scan) => {
      const current = new Date(scan.timestamp);
      const diff = current.getTime() - previousTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      const locId = String(scan.data?.location?.id);
      const isDuplicate = visitedLocations.has(locId);
      visitedLocations.add(locId);

      const hasEvidence =
        scan.data?.media &&
        Array.isArray(scan.data.media) &&
        scan.data.media.length > 0;

      let status = hasEvidence ? "SUCCESS" : "INCOMPLETE";

      if (isDuplicate && hasEvidence) {
        const alreadyHadSuccess = mapNodes.some(
          (n) =>
            n.label === scan.data?.location?.name && n.status === "SUCCESS",
        );
        if (alreadyHadSuccess) status = "DUPLICATE";
      }

      if (status === "SUCCESS") {
        coveredLocations.add(locId);
      }

      mapNodes.push({
        type: "POINT",
        label: scan.data?.location?.name || "Punto",
        status,
        timeDiff: `${mins}m ${secs}s`,
        diffMs: diff,
      });
      previousTime = current;
    });

    const validScansCount = coveredLocations.size;

    const expectedLocs =
      data.round.recurringConfiguration?.recurringLocations ||
      data.round.client?.locations?.map((l: any) => ({ location: l })) ||
      [];
    const missingLocs = expectedLocs.filter(
      (l: any) => !visitedLocations.has(String(l.location.id)),
    );

    missingLocs.forEach((loc: any) => {
      mapNodes.push({
        type: "POINT",
        label: loc.location.name,
        status: data.round.status === "COMPLETED" ? "MISSING" : "PENDING",
        timeDiff: "--",
        diffMs: 0,
      });
    });

    if (data.round.endTime) {
      const current = new Date(data.round.endTime);
      const diff = current.getTime() - previousTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      mapNodes.push({
        type: "END",
        label: "Fin",
        status: "END",
        timeDiff: `${mins}m ${secs}s`,
      });
    }

    const avgTime =
      scans.length > 0
        ? durationMs / (scans.length + (data.round.endTime ? 1 : 0))
        : 0;
    const avgMins = Math.floor(avgTime / 60000);
    const avgSecs = Math.floor((avgTime % 60000) / 1000);

    return {
      duration: `${durationMinutes}m ${durationSeconds}s`,
      totalScans: validScansCount,
      totalRawScans: scans.length,
      expectedScans: expectedLocs.length,
      mapNodes,
      avgTime: `${avgMins}m ${avgSecs}s`,
    };
  }, [data]);

  useEffect(() => {
    if (id) getData(id);
  }, [id]);

  const getData = async (roundId: string) => {
    setLoading(true);
    const res = await getRoundById(roundId);
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.round.recurringConfiguration) {
        setRouteTitle(res.data.round.recurringConfiguration.title);
      } else if (res.data.round.recurringConfigurationId) {
        listRoutes().then((routesRes: { success: boolean; data?: { title: string }[] }) => {
          if (routesRes.success && routesRes.data) {
            const match = routesRes.data.find(
              (r: any) => r.id === res.data.round.recurringConfigurationId,
            );
            if (match) setRouteTitle(match.title);
          }
        });
      }
    }
    setLoading(false);
  };

  const handleOpenRouteMap = () => {
    if (!data) return;
    const scansWithCoords = data.timeline
      .filter((e: RoundEvent) => e.type === "SCAN" && e.data?.latitude && e.data?.longitude)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    if (scansWithCoords.length === 0) {
      dispatch(
        showToast({
          message: "No hay puntos con coordenadas GPS para trazar una ruta.",
          type: "warning",
        }),
      );
      return;
    }

    if (scansWithCoords.length === 1) {
      const url = `https://www.google.com/maps/search/?api=1&query=${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
      window.open(url, "_blank");
      return;
    }

    const origin = `${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
    const destination = `${scansWithCoords[scansWithCoords.length - 1].data.latitude},${scansWithCoords[scansWithCoords.length - 1].data.longitude}`;
    const waypoints = scansWithCoords
      .slice(1, -1)
      .map((s) => `${s.data.latitude},${s.data.longitude}`)
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, "_blank");
  };

  return {
    data,
    loading,
    metrics,
    routeTitle,
    handleOpenRouteMap,
    primary,
    primaryLight,
    isResident,
    id,
  };
};

export type RoundDetailPageViewModel = ReturnType<typeof useRoundDetailPage>;
