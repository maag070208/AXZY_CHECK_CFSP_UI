import { showToast } from "@app/core/store/toast/toast.slice";
import { addLiveAlert } from "@app/core/store/panic/panic.slice";
import { addActivityEvent } from "@app/core/store/activity/activity.slice";
import * as Ably from "ably";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";

const ABLY_KEY =
  import.meta.env.VITE_ABLY_API_KEY ||
  "_iYGPA.fJVkAw:ix6oVHub7TpqllbX6JMdmfJgDoqKKEIoZ5wJNRo6Zlc";

interface IPanicAblyPayload {
  alertId?: string;
  incidentId?: string;
  guardId: string;
  guardName: string;
  clientId?: string | null;
  clientName?: string | null;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  source?: string;
  timestamp: string;
  title?: string;
  message?: string;
}

const buildPanicAlertFromPayload = (
  p: IPanicAblyPayload,
  fallbackId: string,
) => ({
  id: p.alertId ?? p.incidentId ?? fallbackId,
  title: p.title ?? "[EMERGENCIA] Alerta de pánico",
  message: p.message ?? `${p.guardName} requiere apoyo inmediato.`,
  guardId: p.guardId ?? "",
  guardName: p.guardName ?? "Guardia",
  clientId: p.clientId ?? null,
  clientName: p.clientName ?? null,
  latitude: typeof p.latitude === "number" ? p.latitude : null,
  longitude: typeof p.longitude === "number" ? p.longitude : null,
  receivedAt: p.timestamp ? Date.parse(p.timestamp) || Date.now() : Date.now(),
});

const NotificationProvider = () => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state: AppState) => !!state.auth.token);
  const clientId = useSelector((state: AppState) => state.auth.clientId);

  useEffect(() => {
    if (!isAuth) return;

    const ably = new Ably.Realtime({ key: ABLY_KEY });

    ably.connection.on("connected", () => {
      console.log("[Ably] Conectado a notificaciones");
    });

    // ============================================================================
    // Canal 1: 'global' — notificaciones toast + alertas de pánico
    // ============================================================================
    const globalChannel = ably.channels.get("global");

    globalChannel.subscribe("notification", (msg: any) => {
      const data = msg.data ?? {};
      const { title, message, type } = data;

      if (data.panic === true) {
        dispatch(
          addLiveAlert(
            buildPanicAlertFromPayload(
              {
                alertId: data.alertId ?? data.incidentId,
                guardId: data.guardId,
                guardName: data.guardName,
                clientId: data.clientId,
                clientName: data.clientName,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp ?? new Date().toISOString(),
                title,
                message,
              },
              `global-panic-${Date.now()}`,
            ),
          ),
        );
      }

      dispatch(
        showToast({
          message: `${title ? title + ": " : ""}${message}`,
          type: type || "info",
          duration: data.panic ? 0 : type === "error" ? 8000 : 5000,
        } as any),
      );
    });

    // ============================================================================
    // Canal 2: 'global' — eventos de actividad genéricos
    // (incidents, maintenances, disciplines, panic created/resolved, guard login/logout)
    // ============================================================================
    globalChannel.subscribe("activity", (msg: any) => {
      const data = msg.data ?? {};
      const eventId = `${data.type ?? "unknown"}-${data.action ?? "unknown"}-${
        data.id ?? data.alertId ?? data.guardId ?? Date.now()
      }-${data.timestamp ?? Date.now()}`;

      dispatch(
        addActivityEvent({
          id: eventId,
          type: data.type,
          action: data.action,
          timestamp: data.timestamp ?? new Date().toISOString(),
          data: { ...data },
        }),
      );

      // Si es un panic, también alimentar el store de liveAlerts
      if (data.type === "panic" && data.action === "created") {
        dispatch(
          addLiveAlert(
            buildPanicAlertFromPayload(
              {
                alertId: data.alertId ?? data.id,
                guardId: data.guardId,
                guardName: data.guardName,
                clientId: data.clientId,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp ?? new Date().toISOString(),
                message: data.message,
                title: "[EMERGENCIA] Alerta de pánico",
              },
              `activity-panic-${Date.now()}`,
            ),
          ),
        );
      }
    });

    // ============================================================================
    // Canal 3: 'panic.{clientId}' — canal dedicado del cliente
    // ============================================================================
    const panicChannelName = clientId
      ? `panic.${clientId}`
      : "panic.global";
    const panicChannel = ably.channels.get(panicChannelName);

    panicChannel.subscribe("panic", (msg: any) => {
      const data: IPanicAblyPayload = msg.data ?? {};
      const fallbackId = `panic-channel-${Date.now()}`;
      dispatch(addLiveAlert(buildPanicAlertFromPayload(data, fallbackId)));
    });

    return () => {
      globalChannel.unsubscribe();
      panicChannel.unsubscribe();
      ably.close();
    };
  }, [isAuth, clientId, dispatch]);

  return null;
};

export default NotificationProvider;
