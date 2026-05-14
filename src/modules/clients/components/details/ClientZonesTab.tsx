import { showToast } from "@app/core/store/toast/toast.slice";
import { TResult } from "@app/core/types/TResult";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
} from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import { FaEdit, FaPlus, FaSync, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  createZone,
  deleteZone,
  getPaginatedZones,
  updateZone,
  Zone,
} from "../../../zones/services/ZonesService";

interface Props {
  clientId: string;
}

export const ClientZonesTab = ({ clientId }: Props) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [newZoneName, setNewZoneName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [updating, setUpdating] = useState(false);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedZones({
        ...params,
        filters: { ...params.filters, clientId },
      });
    },
    [clientId],
  );

  const handleCreate = async () => {
    if (!newZoneName.trim()) return;
    setCreating(true);
    try {
      const res = await createZone({ clientId, name: newZoneName });
      if (res.success) {
        setNewZoneName("");
        setRefreshKey((prev) => prev + 1);
        dispatch(
          showToast({ message: "Zona registrada con éxito", type: "success" }),
        );
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo crear la zona",
            type: "error",
          }),
        );
      }
    } catch (error) {
      const err = error as TResult<any>;
      dispatch(
        showToast({
          message: err.messages?.[0] || "Error de conexión",
          type: "error",
        }),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingZone || !editingZone.name.trim()) return;
    setUpdating(true);
    try {
      const res = await updateZone(editingZone.id, { name: editingZone.name });
      if (res.success) {
        setEditingZone(null);
        setRefreshKey((prev) => prev + 1);
        dispatch(showToast({ message: "Zona actualizada", type: "success" }));
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al actualizar",
            type: "error",
          }),
        );
      }
    } catch (error) {
      const err = error as TResult<any>;
      dispatch(
        showToast({
          message: err.messages?.[0] || "Error de conexión",
          type: "error",
        }),
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de eliminar esta zona? Esto podría afectar a las ubicaciones asociadas.",
      )
    )
      return;
    try {
      const res = await deleteZone(id);
      if (res.success) {
        setRefreshKey((prev) => prev + 1);
        dispatch(showToast({ message: "Zona eliminada", type: "success" }));
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se puede eliminar",
            type: "error",
          }),
        );
      }
    } catch (error) {
      const err = error as TResult<any>;
      dispatch(
        showToast({
          message: err.messages?.[0] || "Error de conexión",
          type: "error",
        }),
      );
    }
  };

  const columns = [
    {
      key: "name",
      label: "ZONA / RECURRENTE",
      type: "string",
      render: (row: Zone) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
            {row.name}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
              ÁREA DE CONTROL
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "CONTROL",
      type: "actions",
      actions: (row: Zone) => (
        <div className="flex items-center gap-2">
          <ITButton
            size="small"
            variant="outlined"
            onClick={() => setEditingZone(row)}
            title="Editar"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDelete(row.id)}
            title="Eliminar"
          >
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.1em]">
            Administración de Zonas
          </h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
            Defina los sectores o áreas recurrentes para el cliente
          </p>
        </div>
        <ITButton
          onClick={() => setRefreshKey((prev) => prev + 1)}
          size="small"
          variant="ghost"
          className="h-10 w-10 p-0 flex justify-center items-center bg-slate-50 rounded-xl hover:bg-slate-100"
        >
          <FaSync className="text-slate-400" />
        </ITButton>
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-4 mb-12 bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm">
        <div className="flex-1">
          <ITInput
            label="Registrar Nueva Zona / Recurrente"
            placeholder="Ej: PLANTA BAJA, NIVEL 1, SÓTANO..."
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            name="newZone"
            onBlur={() => {}}
          />
        </div>
        <ITButton
          onClick={handleCreate}
          disabled={creating || !newZoneName.trim()}
          className="mb-0.5"
          color={newZoneName.trim() ? "success" : "primary"}
        >
          <div className="flex items-center gap-3">
            <FaPlus size={12} />
            <span className="text-xs uppercase tracking-widest font-black">
              {creating ? "Registrando..." : "Registrar Zona"}
            </span>
          </div>
        </ITButton>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={5}
        />
      </div>

      <ITDialog
        isOpen={!!editingZone}
        onClose={() => setEditingZone(null)}
        title="Editar Identificador de Zona"
      >
        {editingZone && (
          <div className="p-6 space-y-6">
            <ITInput
              label="Nombre de la Zona / Recurrente"
              value={editingZone.name}
              onChange={(e) =>
                setEditingZone({ ...editingZone, name: e.target.value })
              }
              name="editZoneName"
              onBlur={() => {}}
              placeholder="Ej: Area de Embarques"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <ITButton
                variant="ghost"
                onClick={() => setEditingZone(null)}
                className="font-bold text-slate-400"
              >
                Cancelar
              </ITButton>
              <ITButton
                onClick={handleUpdate}
                disabled={updating}
                className="bg-emerald-600 text-white px-8 rounded-2xl font-black shadow-lg shadow-emerald-500/10"
              >
                {updating ? "Guardando..." : "Guardar Cambios"}
              </ITButton>
            </div>
          </div>
        )}
      </ITDialog>
    </div>
  );
};
