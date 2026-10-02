import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";

/** Mismos grupos de roles que `API/src/core/config/constants.ts`. */
const SUPERVISION_ROLES = ["ADMIN", "LIDER", "SHIFT"];
const PLANNING_ADMIN_ROLES = ["ADMIN", "LIDER"];

/**
 * Permisos para entregas de turno, uniformes y programación:
 * - canRegister: registrar entregas y revisiones (ADMIN, LIDER, SHIFT)
 * - canManage: configurar programación y eliminar registros (ADMIN, LIDER)
 * - isClient: usuario cliente (RESDN), solo lectura de su cliente
 */
export const useSupervisionPermissions = () => {
  const role = useSelector((state: AppState) => state.auth.role) ?? "";
  return {
    canRegister: SUPERVISION_ROLES.includes(role),
    canManage: PLANNING_ADMIN_ROLES.includes(role),
    isClient: role === "RESDN",
  };
};
