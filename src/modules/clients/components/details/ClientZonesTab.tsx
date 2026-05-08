import { useState, useCallback } from "react";
import {
  ITButton,
  ITInput,
  ITDataTable,
  ITDialog,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrash, FaEdit, FaSync } from "react-icons/fa";
import {
  getPaginatedZones,
  createZone,
  updateZone,
  deleteZone,
  Zone,
} from "../../../zones/services/ZonesService";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useDispatch } from "react-redux";

interface Props {
  clientId: string;
  clientName: string;
}

export const ClientZonesTab = ({ clientId, clientName }: Props) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [newZoneName, setNewZoneName] = useState("");
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

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
    try {
      await createZone({ clientId, name: newZoneName });
      setNewZoneName("");
      setRefreshKey((prev) => prev + 1);
      dispatch(showToast({ message: "Zona creada", type: "success" }));
    } catch (error) {
      dispatch(showToast({ message: "Error al crear", type: "error" }));
    }
  };

  const handleUpdate = async (zone: Zone, newName: string) => {
    if (!newName.trim()) return;
    try {
      await updateZone(zone.id, { name: newName });
      setEditingZone(null);
      setRefreshKey((prev) => prev + 1);
      dispatch(showToast({ message: "Zona actualizada", type: "success" }));
    } catch (error) {
      dispatch(showToast({ message: "Error al actualizar", type: "error" }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta zona?")) return;
    try {
      await deleteZone(id);
      setRefreshKey((prev) => prev + 1);
      dispatch(showToast({ message: "Zona eliminada", type: "success" }));
    } catch (error) {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  const columns = [
    {
      key: "name",
      label: "Nombre de la Zona",
      type: "string",
      render: (row: Zone) => (
        <span className="font-bold text-slate-700 tracking-tight">
          {row.name}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: Zone) => (
        <div className="flex gap-1">
          <ITButton
            size="small"
            variant="ghost"
            className="text-slate-400 p-2 hover:bg-slate-50"
            onClick={() => setEditingZone(row)}
          >
            <FaEdit />
          </ITButton>
          <ITButton
            size="small"
            variant="ghost"
            className="text-red-300 hover:text-red-500 p-2 hover:bg-red-50"
            onClick={() => handleDelete(row.id)}
          >
            <FaTrash />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Administración de Zonas / Recurrentes
        </h3>
        <ITButton
          onClick={() => setRefreshKey((prev) => prev + 1)}
          size="small"
          variant="outlined"
          className="h-9 w-9 p-0 flex justify-center items-center"
        >
          <FaSync className="text-slate-400" />
        </ITButton>
      </div>

      <div className="flex gap-2 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <ITInput
          placeholder="Ej: PLANTA BAJA, NIVEL 1..."
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          name="newZone"
          onBlur={() => {}}
          className="flex-1"
        />
        <ITButton
          onClick={handleCreate}
          className="bg-emerald-600 text-white px-6 font-bold flex items-center gap-2"
        >
          <div className="flex items-center gap-2">
            <FaPlus />
            <span>Agregar</span>
          </div>
        </ITButton>
      </div>

      <ITDataTable
        key={refreshKey}
        columns={columns as any}
        fetchData={memoizedFetch as any}
        defaultItemsPerPage={5}
      />

      <ITDialog
        isOpen={!!editingZone}
        onClose={() => setEditingZone(null)}
        title="Editar Zona"
      >
        {editingZone && (
          <div className="p-4">
            <ITInput
              label="Nombre de la Zona"
              value={editingZone.name}
              onChange={(e) =>
                setEditingZone({ ...editingZone, name: e.target.value })
              }
              name="editZoneName"
              onBlur={() => {}}
            />
            <div className="flex justify-end gap-2 mt-6">
              <ITButton variant="ghost" onClick={() => setEditingZone(null)}>
                Cancelar
              </ITButton>
              <ITButton
                variant="primary"
                onClick={() => handleUpdate(editingZone, editingZone.name)}
              >
                Guardar Cambios
              </ITButton>
            </div>
          </div>
        )}
      </ITDialog>
    </div>
  );
};
