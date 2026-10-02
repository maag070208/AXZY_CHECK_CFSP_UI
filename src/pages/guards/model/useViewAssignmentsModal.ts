/**
 * View-model del modal de tareas asignadas a un guardia.
 */
import { useEffect, useState } from "react";
import type { User } from "@entities/user";
import {
  deleteAssignment,
  getAllAssignmentsByGuard,
  updateAssignmentStatus,
  AssignmentStatus,
  type Assignment,
} from "@entities/assignment";


export interface ViewAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardId: string;
  guardName: string;
  guard: User;
  onReassignClient: () => void;
  onReassignSchedule: () => void;
  isClient?: boolean;
}

export const useViewAssignmentsModal = ({ isOpen, guardId }: ViewAssignmentsModalProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [assignmentToDeleteId, setAssignmentToDeleteId] = useState<string | null>(null);
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

  const handleApprove = async (id: string) => {
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


  return {
    assignments,
    loading,
    selectedAssignment,
    setSelectedAssignment,
    assignmentToDeleteId,
    setAssignmentToDeleteId,
    isDeleting,
    approvingId,
    fetchAssignments,
    handleApprove,
    confirmDeleteAssignment,
    getStatusColor,
  };
};

export type ViewAssignmentsModalViewModel = ReturnType<typeof useViewAssignmentsModal>;
