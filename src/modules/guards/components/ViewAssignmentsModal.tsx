import {
  ITBadget,
  ITButton,
  ITDialog,
  ITLoader,
  ITTable,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaCheckDouble,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaSync,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import {
  getAllAssignmentsByGuard,
  updateAssignmentStatus,
  deleteAssignment,
} from "../service/guards.service";
import { Assignment, AssignmentStatus } from "../types/guards.types";
import dayjs from "dayjs";
import { ITMediaGrid } from "@app/core/components/ITMediaGrid";
import { User } from "../../users/services/UserService";

// Fallback for API Base URL if constant is missing
const API_BASE_URL = "http://localhost:4444";

interface MediaItem {
  id: string | number;
  url: string;
  type?: "IMAGE" | "VIDEO";
  [key: string]: unknown;
}

interface KardexEntry {
  id: string | number;
  media?: MediaItem[];
  [key: string]: unknown;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: string | number;
  guardName: string;
  guard: User;
  onReassignClient: () => void;
  onReassignSchedule: () => void;
  isClient?: boolean;
}

const statusTranslations: Record<AssignmentStatus, string> = {
  [AssignmentStatus.PENDING]: "PENDIENTE",
  [AssignmentStatus.CHECKING]: "EN PROCESO",
  [AssignmentStatus.UNDER_REVIEW]: "BAJO REVISIÓN",
  [AssignmentStatus.REVIEWED]: "REVISADO",
  [AssignmentStatus.ANOMALY]: "ANOMALÍA",
  [AssignmentStatus.COMPLETED]: "COMPLETADO",
  [AssignmentStatus.CANCELLED]: "CANCELADO",
  [AssignmentStatus.ACTIVE]: "ACTIVO",
};

export const ViewAssignmentsModal = ({
  isOpen,
  onClose,
  guardId,
  guardName,
  guard,
  onReassignClient,
  onReassignSchedule,
  isClient,
}: Props) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [assignmentToDeleteId, setAssignmentToDeleteId] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    const res = await getAllAssignmentsByGuard(guardId);
    if (res.success && res.data) {
      setAssignments(res.data);
      if (selectedAssignment) {
        const updated = res.data.find((a) => a.id === selectedAssignment.id);
        if (updated) setSelectedAssignment(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssignments();
    } else {
      setSelectedAssignment(null);
    }
  }, [isOpen, guardId]);

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDeleteId || isDeleting) return;
    setIsDeleting(true);
    const res = await deleteAssignment(assignmentToDeleteId);
    setIsDeleting(false);
    setAssignmentToDeleteId(null);
    if (res.success) {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentToDeleteId));
      if (selectedAssignment?.id === assignmentToDeleteId) setSelectedAssignment(null);
    }
  };

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    const res = await updateAssignmentStatus(id, AssignmentStatus.REVIEWED);
    if (res.success) {
      await fetchAssignments();
    }
    setApprovingId(null);
  };

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.REVIEWED:
        return "success";
      case AssignmentStatus.PENDING:
        return "warning";
      case AssignmentStatus.ANOMALY:
        return "danger";
      case AssignmentStatus.CHECKING:
        return "primary";
      case AssignmentStatus.UNDER_REVIEW:
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="!max-w-6xl !w-full"
    >
      <div className="flex flex-col h-[85vh]">
        {/* Profile Header */}
        <div className="flex-none px-8 pt-8 pb-6 bg-white border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaUserShield size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">
                  {guardName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {guard?.client?.name || "Sin Cliente"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-sky-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    {guard?.schedule?.name || "Sin Turno"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isClient && (
                <>
                  <ITButton
                    onClick={onReassignSchedule}
                    variant="ghost"
                    size="small"
                    className="px-5 whitespace-nowrap shadow shadow-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      <FaClock size={14} />
                      <span className="text-[10px]">Turno</span>
                    </div>
                  </ITButton>
                  <ITButton
                    onClick={onReassignClient}
                    variant="ghost"
                    size="small"
                    className="px-5 whitespace-nowrap shadow shadow-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      <FaUserShield size={14} />
                      <span className="text-[10px]">Cliente</span>
                    </div>
                  </ITButton>
                </>
              )}
              <ITButton
                onClick={fetchAssignments}
                variant="ghost"
                className="!w-9 !h-9 !rounded-lg !text-slate-400"
              >
                <FaSync size={14} className={loading ? "animate-spin" : ""} />
              </ITButton>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && !selectedAssignment && !assignments.length ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <ITLoader />
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Cargando expediente...
              </p>
            </div>
          ) : selectedAssignment ? (
            /* DETAIL VIEW - 8/4 Layout */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <ITButton
                  onClick={() => setSelectedAssignment(null)}
                  variant="ghost"
                  className="!w-9 !h-9 !rounded-lg !text-slate-400"
                >
                  <FaArrowLeft size={14} />
                </ITButton>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-slate-800">
                      Reporte de Ubicación
                    </h4>
                    <ITBadget
                    size="small"
                      color={getStatusColor(selectedAssignment.status)}
                      variant="outlined"
                      className="text-[9px] font-medium px-2.5 tracking-widest"
                    >
                      {statusTranslations[selectedAssignment.status]}
                    </ITBadget>
                  </div>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    ID #{selectedAssignment.id} •{" "}
                    {selectedAssignment.location?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (8): Evidence and Checklist */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Evidence Card */}
                  <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
                    <h5 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      Evidencia Multimedia
                    </h5>

                    {selectedAssignment.kardex?.flatMap(
                      (k: KardexEntry) => k.media || [],
                    ).length ? (
                      <ITMediaGrid
                        media={(selectedAssignment.kardex as KardexEntry[])
                          .flatMap((k) => k.media || [])
                          .map((m) => ({
                            type: m.type || "IMAGE",
                            url: m.url?.startsWith("http")
                              ? m.url
                              : `${API_BASE_URL}${m.url?.replace("/api/v1", "")}`,
                          }))}
                        gridSize={280}
                      />
                    ) : (
                      <div className="py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <FaFileAlt className="text-slate-200 text-3xl mb-3" />
                        <p className="text-xs text-slate-400 font-light">
                          Sin registros visuales
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Checklist Card */}
                  <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
                    <h5 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Consignas Operativas
                    </h5>

                    <ITTable
                      columns={[
                        {
                          key: "description",
                          label: "Tarea",
                          type: "string",
                          sortable: true,
                          render: (row: any) => (
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] shadow-sm transition-all ${row.completed ? "bg-emerald-500 text-white" : "bg-white text-slate-200 border border-slate-100"}`}>
                                <FaCheckCircle size={10} />
                              </div>
                              <span className={`text-[11px] font-medium ${row.completed ? "text-emerald-700" : "text-slate-600"}`}>
                                {row.description}
                              </span>
                            </div>
                          ),
                        },
                        {
                          key: "completedAt",
                          label: "Estado",
                          type: "date",
                          sortable: true,
                          render: (row: any) =>
                            row.completed && row.completedAt ? (
                              <div className="text-right">
                                <p className="text-[9px] font-medium text-emerald-500 uppercase tracking-widest">
                                  Completada
                                </p>
                                <p className="text-[9px] text-slate-400 font-light">
                                  {dayjs(row.completedAt).format("HH:mm")} hrs
                                </p>
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-300">Pendiente</span>
                            ),
                        },
                      ]}
                      data={selectedAssignment.tasks as any}
                      size="sm"
                      defaultItemsPerPage={10}
                      itemsPerPageOptions={[5, 10, 20]}
                      className="!border-0 !shadow-none"
                      containerClassName="!space-y-0"
                    />

                    {selectedAssignment.notes && (
                      <div className="mt-6 pt-6 border-t border-slate-50">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">
                          Observaciones del Guardia
                        </p>
                        <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50">
                          <p className="text-xs text-slate-600 font-light italic leading-relaxed">
                            "{selectedAssignment.notes}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (4): Info and Status */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm sticky top-8">
                    <h5 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-6">
                      Información General
                    </h5>

                    <div className="space-y-8">
                      <DetailItem
                        icon={<FaMapMarkerAlt className="text-emerald-500" />}
                        label="Ubicación"
                        value={selectedAssignment.location?.name}
                        subValue={`Zona ${selectedAssignment.location?.aisle || "N/A"}`}
                      />
                      <DetailItem
                        icon={<FaCalendarAlt className="text-sky-500" />}
                        label="Fecha de Inicio"
                        value={dayjs(selectedAssignment.createdAt).format(
                          "DD/MM/YYYY",
                        )}
                        subValue={dayjs(selectedAssignment.createdAt).format(
                          "HH:mm [hrs]",
                        )}
                      />
                      <DetailItem
                        icon={<FaLayerGroup className="text-amber-500" />}
                        label="Prioridad"
                        value="Especial"
                        subValue="Asignación Directa"
                      />
                    </div>

                    {selectedAssignment.status ===
                      AssignmentStatus.UNDER_REVIEW &&
                      !isClient && (
                        <div className="mt-8">
                          <ITButton
                            onClick={() => handleApprove(selectedAssignment.id)}
                            disabled={approvingId === selectedAssignment.id}
                            variant="filled"
                            color="primary"
                            size="small"
                            className="w-full px-5 whitespace-nowrap shadow shadow-sky-100"
                          >
                            {approvingId === selectedAssignment.id ? (
                              <ITLoader size="sm" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <FaCheckDouble size={14} />
                                <span className="text-[10px]">Aprobar Reporte</span>
                              </div>
                            )}
                          </ITButton>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ) : assignments.length > 0 ? (
            <ITTable
              columns={[
                {
                  key: "location.name",
                  label: "Ubicación",
                  type: "string",
                  sortable: true,
                  filter: true,
                  render: (row: any) => (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedAssignment(row)}>
                      <FaMapMarkerAlt size={12} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-800 hover:text-sky-600 transition-colors">
                        {row.location?.name || "Sin Ubicación"}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "createdAt",
                  label: "Fecha",
                  type: "date",
                  sortable: true,
                  render: (row: any) => (
                    <span className="text-xs text-slate-400 font-light">
                      {dayjs(row.createdAt).format("DD/MM/YYYY HH:mm")}
                    </span>
                  ),
                },
                {
                  key: "status",
                  label: "Estado",
                  type: "string",
                  sortable: true,
                  filter: true,
                  render: (row: any) => (
                    <ITBadget
                      color={getStatusColor(row.status)}
                      variant="outlined"
                      size="small"
                      className="text-[9px] font-medium px-2.5 tracking-widest"
                    >
                      {statusTranslations[row.status as AssignmentStatus]}
                    </ITBadget>
                  ),
                },
                {
                  key: "tasks",
                  label: "Tareas",
                  type: "number",
                  sortable: true,
                  render: (row: any) => (
                    <span className="text-xs font-medium text-slate-400">
                      {row.tasks.length} tareas
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "",
                  type: "actions",
                  sortable: false,
                  filter: false,
                  actions: (row: any) => (
                    <>
                      <ITButton
                        onClick={() => setSelectedAssignment(row)}
                        variant="ghost"
                        className="!w-7 !h-7 !rounded-lg !text-sky-500"
                      >
                        <FaChevronRight size={10} />
                      </ITButton>
                      <ITButton
                        onClick={() => setAssignmentToDeleteId(row.id)}
                        variant="ghost"
                        className="!w-7 !h-7 !rounded-lg !text-rose-400 hover:!text-rose-600"
                      >
                        <FaTrash size={10} />
                      </ITButton>
                    </>
                  ),
                },
              ]}
              data={assignments as any}
              defaultItemsPerPage={10}
              itemsPerPageOptions={[5, 10, 20]}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <FaExclamationTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h5 className="text-base font-medium text-slate-800">
                  Sin Historial
                </h5>
                <p className="text-xs text-slate-400 font-light max-w-xs">
                  No se han registrado asignaciones operativas para este guardia.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <ITDialog
        isOpen={!!assignmentToDeleteId}
        onClose={() => setAssignmentToDeleteId(null)}
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
                <h3 className="text-base font-medium text-slate-800">Eliminar Asignación</h3>
                <p className="text-xs text-slate-400 font-light">Esta acción es permanente</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará la asignación y su historial asociado de forma permanente.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setAssignmentToDeleteId(null)}
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
              onClick={confirmDeleteAssignment}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </ITDialog>
  );
};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  subValue?: string | number | null;
}

const DetailItem = ({ icon, label, value, subValue }: DetailItemProps) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-xs font-medium text-slate-700">
        {value}
      </p>
      {subValue && (
        <p className="text-[9px] text-slate-400 font-light mt-0.5">{subValue}</p>
      )}
    </div>
  </div>
);
