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
  onSelectZone?: (zone: Zone) => void;
}

export const ClientZonesTab = ({ clientId, onSelectZone }: Props) => {
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
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => onSelectZone?.(row)}
        >
          <span className="font-medium text-slate-700 text-sm hover:text-sky-600 transition-colors">
            {row.name}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[10px]">
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-medium text-slate-800">
            Administración de Zonas
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Defina los sectores o áreas recurrentes para el cliente
          </p>
        </div>
        <ITButton
          onClick={() => setRefreshKey((prev) => prev + 1)}
          size="small"
          variant="ghost"
          className="w-9 h-9 p-0 flex items-center justify-center bg-slate-50 rounded-lg hover:bg-slate-100"
        >
          <FaSync className="text-slate-400" size={12} />
        </ITButton>
      </div>

      <div className="flex items-end gap-3 mb-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div
          className="flex-1"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && newZoneName.trim()) {
              handleCreate();
            }
          }}
        >
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
          color={newZoneName.trim() ? "success" : "primary"}
          className="px-5 whitespace-nowrap shadow shadow-slate-100"
        >
          <div className="flex items-center gap-1">
            <FaPlus size={14} />
            <span>{creating ? "Registrando..." : "Registrar"}</span>
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
        title=""
        className="!max-w-md !w-full"
      >
        {editingZone && (
          <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
            <div className="px-8 pt-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                  <FaEdit size={18} />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-800">Editar Zona</h3>
                  <p className="text-xs text-slate-400 font-light">{editingZone.name}</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-6">
              <ITInput
                label="Nombre de la Zona"
                value={editingZone.name}
                onChange={(e) =>
                  setEditingZone({ ...editingZone, name: e.target.value })
                }
                name="editZoneName"
                onBlur={() => {}}
                placeholder="Ej: Area de Embarques"
              />
            </div>
            <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
              <ITButton
                variant="ghost"
                onClick={() => setEditingZone(null)}
                size="small"
                className="px-5 whitespace-nowrap shadow shadow-slate-100"
              >
                Cancelar
              </ITButton>
              <ITButton
                onClick={handleUpdate}
                disabled={updating}
                color="primary"
                size="small"
                className="px-5 whitespace-nowrap shadow shadow-sky-100"
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
