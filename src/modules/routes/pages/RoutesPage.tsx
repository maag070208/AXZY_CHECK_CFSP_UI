import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITSearchSelect,
  ITText,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import { post } from "@app/core/axios/axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaEdit, FaPrint, FaQrcode, FaRoute, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteRoute, getPaginatedRoutes } from "../services/RoutesService";

const RoutesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { colors } = useITTheme();
  const primary = colors.primary || "#10b981";
  const [refreshKey, setRefreshKey] = useState(0);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>("");

  const { data: clients } = useCatalog("client");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return {
      title: searchTerm,
      clientId: selectedClientId,
    };
  }, [searchTerm, selectedClientId]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedRoutes(params);
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleDelete = (id: number) => {
    setRouteToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!routeToDeleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteRoute(String(routeToDeleteId));
      setIsDeleting(false);
      setRouteToDeleteId(null);
      if (res.success) {
        dispatch(showToast({ message: "Ruta eliminada", type: "success" }));
        refreshTable();
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "Error al eliminar", type: "error" }));
      }
    } catch (err: any) {
      setIsDeleting(false);
      setRouteToDeleteId(null);
      dispatch(showToast({ message: err?.messages?.[0] || "Error al eliminar", type: "error" }));
    }
  };

  const handleEdit = (route: any) => {
    navigate(`/routes/edit/${route.id}`);
  };

  const handlePrintRouteQRs = async (row: any) => {
    const ids =
      row.recurringLocations
        ?.map((rl: any) => rl.locationId || rl.location?.id)
        .filter(Boolean) || [];

    if (ids.length === 0) {
      dispatch(
        showToast({
          message: "Esta ruta no tiene puntos de control para imprimir",
          type: "warning",
        }),
      );
      return;
    }

    dispatch(showLoader());
    try {
      const res = await post<any>(
        "/locations/print-qrs",
        { ids },
        { responseType: "blob" },
      );
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      dispatch(
        showToast({ message: "PDF generado con éxito", type: "success" }),
      );
    } catch (e) {
      dispatch(
        showToast({ message: "Error al generar el PDF de QRs", type: "error" }),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleCreate = () => {
    navigate("/routes/new");
  };

  const columns = [
    {
      key: "client",
      label: "Cliente / Entidad",
      type: "string",
      render: (row: any) => (
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => handleEdit(row)}
        >
          <div className="flex items-center gap-2 mb-1">
            <FaBuilding className="text-slate-400 text-[10px]" />
            <ITText className="font-black text-slate-700 uppercase text-[10px] tracking-widest hover:text-[--p] transition-colors">
              {row.recurringLocations?.[0]?.location?.client?.name ||
                "Sin Cliente"}
            </ITText>
          </div>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block">
            ID:{" "}
            {row.recurringLocations?.[0]?.location?.client?.id?.slice(-8) ||
              "N/A"}
          </ITText>
        </div>
      ),
    },
    {
      key: "title",
      label: "Ruta / Referencia",
      type: "string",
      render: (row: any) => (
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => handleEdit(row)}
        >
          <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block hover:text-[--p] transition-colors">
            {row.title}
          </ITText>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
              {row.client?.name || "SIN CLIENTE"}
            </ITText>
          </div>
        </div>
      ),
    },
    {
      key: "locations",
      label: "PUNTOS DE CONTROL",
      type: "string",
      render: (row: any) => (
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => handleEdit(row)}
        >
          <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
            {row.recurringLocations?.length || 0} Puntos QR
          </ITText>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
              Ubicación:{" "}
              {row.recurringLocations?.[0]?.location?.name || "Multiple"}
            </ITText>
          </div>
        </div>
      ),
    },
    {
      key: "active",
      label: "ESTADO",
      type: "string",
      render: (row: any) => (
        <ITBadget color={row.active ? "success" : "error"} size="small">
          {row.active ? "ACTIVO" : "INACTIVO"}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "CONTROL",
      type: "actions",
      render: (row: any) => (
        <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
          <ITButton
            onClick={() => handlePrintRouteQRs(row)}
            size="small"
            variant="outlined"
            color="success"
            title="Individual QR"
          >
            <FaQrcode size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleEdit(row)}
            variant="outlined"
            title="Editar Ruta"
            size="small"
            color="info"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleDelete(row.id)}
            variant="outlined"
            color="error"
            title="Eliminar Ruta"
            size="small"
          >
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ "--p": primary } as React.CSSProperties}>
      <ModuleHeader
        title="Gestión de Rutas"
        subtitle="Configuración de recorridos y puntos de control para rondines"
        icon={FaRoute}
        filter={
          <ITSearchSelect
            className="!z-20"
            placeholder="Filtrar por Cliente..."
            options={(clients || []).map((c: any) => ({
              label: c.name,
              value: c.id,
            }))}
            value={selectedClientId}
            onChange={(val) => {
              setSelectedClientId(val);
              setRefreshKey((prev) => prev + 1);
            }}
          />
        }
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR RUTA...",
          icon: FaRoute,
        }}
        showClearFilters={!!(searchTerm || selectedClientId)}
        onClearFilters={() => {
          setSearchTerm("");
          setSelectedClientId("");
          setRefreshKey((prev) => prev + 1);
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        onCreate={handleCreate}
        createLabel="Nueva Ruta"
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-x-auto">
        <div className="min-w-[650px]">
          <ITDataTable
            key={refreshKey}
            columns={columns as any}
            fetchData={memoizedFetch as any}
            externalFilters={externalFilters}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </div>

      {/* DELETE ROUTE DIALOG */}
      <ITDialog
        isOpen={!!routeToDeleteId}
        onClose={() => setRouteToDeleteId(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <FaTrash size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Eliminar Ruta</h3>
                <p className="text-xs text-slate-400 font-light">Ruta operativa</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará la ruta operativa y todos sus puntos de control asociados.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setRouteToDeleteId(null)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default RoutesPage;
