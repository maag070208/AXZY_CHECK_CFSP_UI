import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { markAlertsRead } from "@app/core/store/panic/panic.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaCheck,
  FaEye,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { PanicAlertDetailDialog } from "../components/PanicAlertDetailDialog";
import {
  getPanicAlertById,
  getPaginatedPanicAlerts,
  IPanicAlert,
  resolvePanicAlert,
} from "../services/PanicAlertsService";

const PanicAlertsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const liveAlerts = useSelector((state: AppState) => state.panic.liveAlerts);
  const isClient = auth.role === "RESDN";
  const [searchParams, setSearchParams] = useSearchParams();

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewing, setViewing] = useState<IPanicAlert | null>(null);
  const [toResolve, setToResolve] = useState<IPanicAlert | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolving, setResolving] = useState(false);

  // Al entrar a la pantalla, marcar todas las live alerts como leídas
  useEffect(() => {
    if (liveAlerts.length > 0) {
      dispatch(markAlertsRead());
    }
  }, [dispatch, liveAlerts.length]);

  // Si la URL trae ?id=... abrir automáticamente el detail dialog
  // (usado cuando el usuario hace click en una fila del dashboard).
  const queryId = searchParams.get("id");
  useEffect(() => {
    if (!queryId) return;
    let cancelled = false;
    (async () => {
      const res = await getPanicAlertById(queryId);
      if (cancelled) return;
      if (res.success && res.data) {
        setViewing(res.data);
        // Limpiar el query param para que un refresh no reabra
        const next = new URLSearchParams(searchParams);
        next.delete("id");
        setSearchParams(next, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (searchTerm.trim()) f.search = searchTerm.trim();
    if (statusFilter !== "ALL") f.status = statusFilter;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: Record<string, unknown>) => {
      return getPaginatedPanicAlerts({
        page: (params.page as number) ?? 1,
        limit: (params.limit as number) ?? 10,
        search: (params.search as string) ?? (externalFilters.search as string | undefined),
        status: (params.status as string) ?? (externalFilters.status as string | undefined),
        sort: params.sort as { key: string; direction: "asc" | "desc" } | undefined,
      });
    },
    [externalFilters],
  );

  const confirmResolve = async () => {
    if (!toResolve) return;
    setResolving(true);
    try {
      const res = await resolvePanicAlert(
        toResolve.id,
        resolutionComment.trim() || undefined,
      );
      setResolving(false);
      setToResolve(null);
      setResolutionComment("");
      if (res.success) {
        setRefreshKey((p) => p + 1);
        if (viewing?.id === toResolve.id) setViewing(null);
        dispatch(
          showToast({
            message: "Alerta de pánico resuelta",
            type: "success",
          }),
        );
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al resolver",
            type: "error",
          }),
        );
      }
    } catch (err: any) {
      setResolving(false);
      setToResolve(null);
      setResolutionComment("");
      dispatch(
        showToast({
          message: err?.messages?.[0] || "Error al resolver",
          type: "error",
        }),
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        label: "Alerta",
        render: (row: IPanicAlert) => {
          const isLive = liveAlerts.some((a) => a.id === row.id);
          return (
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => setViewing(row)}
            >
              <div
                className={`mt-1 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  isLive
                    ? "bg-rose-100 text-rose-700 border-rose-300"
                    : "bg-rose-50 text-rose-600 border-rose-200"
                }`}
              >
                <FaBell size={14} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1 hover:text-rose-600 transition-colors">
                    {row.message ?? "Alerta de pánico"}
                  </p>
                  {isLive && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 line-clamp-1">
                  {row.source} · {row.resolutionComment ?? "sin comentario"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: "createdAt",
        label: "CUÁNDO",
        render: (row: IPanicAlert) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-700 uppercase">
              {dayjs(row.createdAt).format("DD MMM YYYY")}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              {dayjs(row.createdAt).format("HH:mm")} HRS
            </span>
          </div>
        ),
      },
      {
        key: "guard",
        label: "GUARDIA",
        render: (row: IPanicAlert) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight">
              {row.guard
                ? `${row.guard.name} ${row.guard.lastName ?? ""}`.trim()
                : "—"}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {row.client?.name ?? "—"}
            </span>
          </div>
        ),
      },
      {
        key: "location",
        label: "UBICACIÓN",
        render: (row: IPanicAlert) => {
          if (row.triggerLatitude == null || row.triggerLongitude == null) {
            return (
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                Sin coordenadas
              </span>
            );
          }
          return (
            <a
              href={`https://www.google.com/maps?q=${row.triggerLatitude},${row.triggerLongitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-700 hover:text-rose-900 px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <FaMapMarkerAlt size={10} />
              Ver mapa
            </a>
          );
        },
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: IPanicAlert) => {
          const map: Record<
            string,
            { color: "success" | "danger" | "warning" | "secondary"; label: string }
          > = {
            PENDING: { color: "danger", label: "PENDIENTE" },
            IN_PROGRESS: { color: "warning", label: "EN PROGRESO" },
            RESOLVED: { color: "success", label: "ATENDIDA" },
            DISMISSED: { color: "secondary", label: "DESCARTADA" },
          };
          const m = map[row.status] ?? { color: "danger", label: row.status };
          return (
            <ITBadget color={m.color} size="small">
              {m.label}
            </ITBadget>
          );
        },
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: IPanicAlert) => (
          <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
            <ITButton
              onClick={() => setViewing(row)}
              variant="outlined"
              size="small"
              color="secondary"
              title="Ver detalle"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && !isClient && (
              <ITButton
                onClick={() => setToResolve(row)}
                variant="outlined"
                size="small"
                color="success"
                title="Marcar como atendida"
                disabled={resolving && toResolve?.id === row.id}
              >
                {resolving && toResolve?.id === row.id ? (
                  <ITLoader size="sm" />
                ) : (
                  <FaCheck size={14} />
                )}
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [liveAlerts, resolving, toResolve, isClient],
  );

  return (
    <div className="p-4 md:p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Alertas de Pánico"
        subtitle="Emergencias reportadas por guardias en campo"
        icon={FaBell}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR ALERTA, GUARDIA O CLIENTE...",
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "TODAS", value: "ALL" },
              { label: "PENDIENTES", value: "PENDING" },
              { label: "ATENDIDAS", value: "RESOLVED" },
              { label: "EN PROGRESO", value: "IN_PROGRESS" },
              { label: "DESCARTADAS", value: "DISMISSED" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-x-auto">
        <div className="min-w-[800px]">
          <ITDataTable<IPanicAlert & Record<string, unknown>>
            key={refreshKey}
            fetchData={memoizedFetch as any}
            columns={columns as any}
            externalFilters={externalFilters as any}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </div>

      <PanicAlertDetailDialog
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        alert={viewing}
        onResolve={setToResolve}
      />

      <ITDialog
        isOpen={!!toResolve}
        onClose={() => {
          if (!resolving) {
            setToResolve(null);
            setResolutionComment("");
          }
        }}
        title="¿Marcar como atendida?"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700">
            Vas a marcar la alerta de pánico de{" "}
            <span className="font-bold">
              {toResolve?.guard
                ? `${toResolve.guard.name} ${toResolve.guard.lastName ?? ""}`.trim()
                : "el guardia"}
            </span>{" "}
            como
            atendida. Esta acción no se puede deshacer.
          </p>
          <ITInput
            name="resolutionComment"
            label="Comentario de cierre (opcional)"
            placeholder="Describe brevemente cómo se atendió la emergencia..."
            value={resolutionComment}
            onChange={(e: any) =>
              setResolutionComment(e?.target?.value ?? "")
            }
            type="textarea"
            disabled={resolving}
            className="w-full"
          />
          <div className="flex justify-end gap-2">
            <ITButton
              onClick={() => {
                setToResolve(null);
                setResolutionComment("");
              }}
              disabled={resolving}
              variant="outlined"
              color="secondary"
            >
              Cancelar
            </ITButton>
            <ITButton
              onClick={confirmResolve}
              disabled={resolving}
              color="success"
            >
              {resolving ? <ITLoader size="sm" /> : "Confirmar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default PanicAlertsPage;
