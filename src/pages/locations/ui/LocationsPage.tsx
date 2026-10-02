import { ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { FaEdit, FaFilter, FaMapMarkedAlt, FaPrint, FaQrcode, FaSearchLocation, FaTrash } from "react-icons/fa";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import type { Column } from "@axzydev/axzy_ui_system";
import type { Location } from "@entities/location";
import { ZonesModal } from "@features/manage-zones";
import { PageShell, SURFACE, TONES } from "@shared/ui";
import { ITButton, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useLocationsDeps } from "../model/deps";
import { useLocationsPage } from "../model/useLocationsPage";
import { LocationForm } from "@features/manage-location";
import { BulkPrintModal } from "@features/print-location-qrs";

/** Ubicaciones. Sólo pinta: estado y casos de uso vienen de `useLocationsPage`. */
const LocationsPage = () => {
  const vm = useLocationsPage(useLocationsDeps());
  const {
    refreshKey,
    refresh,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    isModalOpen,
    setIsModalOpen,
    isZonesModalOpen,
    setIsZonesModalOpen,
    isBulkPrintModalOpen,
    setIsBulkPrintModalOpen,
    editingLocation,
    setEditingLocation,
    locationToDelete,
    setLocationToDelete,
    externalFilters,
    memoizedFetch,
    handleCreate,
    handleEdit,
    confirmDelete,
    handlePrintBulk,
  } = vm;
  const { data: clients } = useCatalog("client");

  const columns = useMemo<Column<Location>[]>(
    () => [
      {
        key: "name",
        type: "string",
        label: "Ubicación / Identificación",
        sortable: true,
        truncate: true,
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {row.name}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.neutral.dot}`} />
              <span className={SURFACE.microLabel}>
                Cliente: {row.client?.name || row.clientName || "Sin asignar"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "zone",
        type: "string",
        label: "Zona / Recurrente",
        truncate: true,
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {row.zone?.name || "Sin zona"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
              <span className={SURFACE.microLabel}>Punto de control</span>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        type: "actions",
        label: "Acciones",
        width: 160,
        render: (row) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => vm.handlePrintQR(row)}
              size="sm"
              variant="outlined"
              color="success"
              title="Individual QR"
            >
              <FaQrcode size={14} />
            </ITButton>
            {vm.canManage && (
              <>
                <ITButton
                  onClick={() => {
                    vm.setEditingLocation(row);
                    vm.setIsModalOpen(true);
                  }}
                  size="sm"
                  variant="outlined"
                  color="secondary"
                  title="Editar"
                >
                  <FaEdit size={14} />
                </ITButton>
                <ITButton
                  onClick={() => vm.setLocationToDelete(row)}
                  size="sm"
                  variant="outlined"
                  color="error"
                  title="Eliminar"
                >
                  <FaTrash size={14} />
                </ITButton>
              </>
            )}
          </div>
        ),
      },
    ],
    [vm],
  );


  return (
    <PageShell
      title="Directorio de Ubicaciones"
      subtitle="Gestión y control de puntos QR para rondines y asistencia"
      icon={FaSearchLocation}
      filter={
        <ITSearchSelect
          className="z-20!"
          placeholder="Filtrar por Cliente..."
          options={(clients || []).map((c: any) => ({
            label: c.name,
            value: c.id,
          }))}
          value={selectedClientId}
          onChange={(val: any) => setSelectedClientId(val)}
        />
      }
      search={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: "BUSCAR UBICACIÓN...",
        icon: FaSearchLocation,
      }}
      onRefresh={refresh}
      refreshKey={refreshKey}
      onCreate={
        vm.canManage ? () => setIsModalOpen(true) : undefined
      }
      createLabel="Nueva Ubicación"
      actions={
        <div className="flex items-center gap-3">
          {selectedClientId && (
            <ITButton
              onClick={() => setIsZonesModalOpen(true)}
              variant="filled"
              color="secondary"
            >
              <div className="flex items-center gap-2">
                <FaMapMarkedAlt size={12} />
                <span className="hidden lg:inline">Zonas del Cliente</span>
              </div>
            </ITButton>
          )}

          <ITButton
            onClick={() => setIsBulkPrintModalOpen(true)}
            variant="filled"
            color="secondary"
          >
            <div className="flex items-center gap-2">
              <FaPrint size={12} />
              <span className="hidden lg:inline">Imprimir</span>
            </div>
          </ITButton>

          {(searchTerm || selectedClientId) && (
            <ITButton
              onClick={() => {
                setSearchTerm("");
                setSelectedClientId("");
              }}
              variant="filled"
              color="error"
              size="sm"
              title="Limpiar Filtros"
            >
              <FaFilter size={12} />
            </ITButton>
          )}
        </div>
      }
    >

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      <BulkPrintModal
        isOpen={isBulkPrintModalOpen}
        onClose={() => setIsBulkPrintModalOpen(false)}
        onConfirm={handlePrintBulk}
        initialClientId={selectedClientId as string}
      />

      <ZonesModal
        isOpen={isZonesModalOpen}
        onClose={() => setIsZonesModalOpen(false)}
        clientId={selectedClientId as string}
        clientName={
          clients?.find((c: any) => String(c.id) === String(selectedClientId))
            ?.name || "Cliente"
        }
      />

      <ITDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title=""
        className="!max-w-lg w-full!"
      >
        {isModalOpen && (
          <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
            <div className="px-8 pt-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                  <FaSearchLocation size={18} />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-800">Registro de Ubicación</h3>
                  <p className="text-xs text-slate-400 font-light">Nuevo punto de control</p>
                </div>
              </div>
            </div>
            <LocationForm
              initialData={
                selectedClientId
                  ? {
                      clientId: selectedClientId as string,
                      aisle: "",
                      spot: "",
                      number: "",
                      name: "",
                    }
                  : undefined
              }
              onSubmit={handleCreate}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title=""
        className="!max-w-lg w-full!"
      >
        {editingLocation && (
          <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
            <div className="px-8 pt-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <FaEdit size={18} />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-800">Actualizar Ubicación</h3>
                  <p className="text-xs text-slate-400 font-light">{editingLocation?.name || "Ubicación"}</p>
                </div>
              </div>
            </div>
            <LocationForm
              initialData={editingLocation}
              onSubmit={handleEdit}
              onCancel={() => setEditingLocation(null)}
            />
          </div>
        )}
      </ITDialog>

      {/* DELETE LOCATION DIALOG */}
      <ITDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title=""
        className="!max-w-md w-full!"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <FaTrash size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Eliminar Ubicación</h3>
                <p className="text-xs text-slate-400 font-light">{locationToDelete?.name || "Ubicación"}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará la ubicación y todos sus registros asociados de forma permanente.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setLocationToDelete(null)}
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={confirmDelete}
            >
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </PageShell>
  );
};

export default LocationsPage;
