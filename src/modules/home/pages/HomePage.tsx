import { ITPage } from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import {
  FaClock,
  FaExclamationTriangle,
  FaHome,
  FaWrench,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppState } from "@app/core/store/store";
import DashboardPage from "@modules/dashboard/pages/DashboardPage";
import { HomeCardItem } from "../components/HomeCardItem";

/** Roles que supervisan la operación: entran directo al monitoreo en vivo. */
const DASHBOARD_ROLES = ["ADMIN", "LIDER", "SHIFT", "RESDN"];

/**
 * Inicio. Supervisión y clientes ven el monitoreo en vivo; el resto de roles
 * ve accesos rápidos a los módulos que tiene permitidos.
 */
const HomePage = () => {
  const navigate = useNavigate();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";

  const cards = useMemo(
    () =>
      [
        { title: "Recorridos", description: "Supervisión de rondas", icon: <FaClock className="text-white" />, path: "/rounds", roles: ["GUARD", "MAINT"] },
        { title: "Incidencias", description: "Reportes de novedades y emergencias", icon: <FaExclamationTriangle className="text-white" />, path: "/incidents", roles: ["GUARD", "MAINT"] },
        { title: "Mantenimiento", description: "Gestión de reportes técnicos", icon: <FaWrench className="text-white" />, path: "/maintenances", roles: ["GUARD", "MAINT"] },
      ]
        .filter((c) => c.roles.includes(role))
        .map((c) => ({ ...c, action: () => navigate(c.path) })),
    [role, navigate],
  );

  if (DASHBOARD_ROLES.includes(role)) return <DashboardPage />;

  return (
    <ITPage noPadding title="Inicio" description="Accesos rápidos a tus módulos." icon={<FaHome size={20} />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((item, index) => (
          <HomeCardItem key={item.path} item={item} index={index} />
        ))}
      </div>
    </ITPage>
  );
};

export default HomePage;
