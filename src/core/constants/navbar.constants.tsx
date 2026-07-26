import { AppState } from "@app/core/store/store";
import LOGO from "@assets/logo.png";
import {
  FaBook,
  FaBuilding,
  FaClipboardList,
  FaCogs,
  FaHome,
  FaUserShield,
  FaBell,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const ROLES = {
  ADMIN: ["ADMIN"],
  ADMIN_LIDER: ["ADMIN", "LIDER"],
  ADMIN_SHIFT: ["ADMIN", "SHIFT"],
  ADMIN_SHIFT_LIDER: ["ADMIN", "SHIFT", "LIDER"],
  ADMIN_SHIFT_RESDN: ["ADMIN", "SHIFT", "RESDN", "LIDER"],
  ALL: undefined,
};

const hasRole = (userRole: string | null, roles?: string[]) => {
  if (!roles || roles.length === 0) return true;
  return roles.includes(userRole ?? "");
};

export const useNavigationItems = (): any[] => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: AppState) => state.auth);

  const isRouteActive = (path: string, subroutes?: string[]) => {
    if (subroutes?.length) {
      return subroutes.some((subroute) =>
        location.pathname.startsWith(subroute)
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const items: any[] = [
    {
      id: "home",
      label: "Inicio",
      action: () => navigate("/home"),
      isActive: isRouteActive("/home"),
      icon: <FaHome />,
    },
    {
      id: "residencial",
      label: "Residencial",
      icon: <FaBuilding />,
      isActive:
        isRouteActive("/clients") || isRouteActive("/locations"),
      subitems: [
        {
          id: "clients",
          label: "Clientes",
          action: () => navigate("/clients"),
          isActive: isRouteActive("/clients"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
        {
          id: "locations",
          label: "Ubicaciones",
          action: () => navigate("/locations"),
          isActive: isRouteActive("/locations"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
      ],
    },
    {
      id: "seguridad",
      label: "Seguridad",
      icon: <FaUserShield />,
      isActive:
        isRouteActive("/guards") ||
        isRouteActive("/guard-logs") ||
        isRouteActive("/guard-discipline") ||
        isRouteActive("/schedules") ||
        isRouteActive("/panic-alerts"),
      subitems: [
        {
          id: "guards",
          label: "Guardias",
          action: () => navigate("/guards"),
          isActive: isRouteActive("/guards"),
          roles: ROLES.ADMIN_SHIFT_RESDN,
        },
        {
          id: "schedule",
          label: "Horarios",
          action: () => navigate("/schedules"),
          isActive: isRouteActive("/schedules"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
        {
          id: "guard-logs",
          label: "Prenómina",
          action: () => navigate("/guard-logs"),
          isActive: isRouteActive("/guard-logs"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
        {
          id: "guard-discipline",
          label: "Incidencias a Guardias",
          action: () => navigate("/guard-discipline"),
          isActive: isRouteActive("/guard-discipline"),
          roles: ROLES.ADMIN_SHIFT_RESDN,
        },
        {
          id: "panic-alerts",
          label: "Alertas de Pánico",
          action: () => navigate("/panic-alerts"),
          isActive: isRouteActive("/panic-alerts"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
          icon: <FaBell />,
        },
        {
          id: "notifications",
          label: "Notificaciones",
          action: () => navigate("/notifications"),
          isActive: isRouteActive("/notifications"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
      ],
    },
    {
      id: "operaciones",
      label: "Operaciones",
      icon: <FaClipboardList />,
      isActive:
        isRouteActive("/incidents") ||
        isRouteActive("/maintenances") ||
        isRouteActive("/routes") ||
        isRouteActive("/rounds"),
      subitems: [
        {
          id: "incidents",
          label: "Incidencias",
          action: () => navigate("/incidents"),
          isActive: isRouteActive("/incidents"),
          roles: ROLES.ADMIN_SHIFT_RESDN,
        },
        {
          id: "maintenances",
          label: "Mantenimientos",
          action: () => navigate("/maintenances"),
          isActive: isRouteActive("/maintenances"),
          roles: ROLES.ADMIN_SHIFT_RESDN,
        },
        {
          id: "routes",
          label: "Configuración de Rondas",
          action: () => navigate("/routes"),
          isActive: isRouteActive("/routes"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
        {
          id: "rounds",
          label: "Historial de recorridos",
          action: () => navigate("/rounds"),
          isActive: isRouteActive("/rounds"),
          roles: ROLES.ADMIN_SHIFT_RESDN,
        },
      ],
    },
    {
      id: "gestion",
      label: "Gestión",
      icon: <FaBook />,
      isActive:
        isRouteActive("/kardex") ||
        isRouteActive("/reports"),
      subitems: [
        {
          id: "kardex",
          label: "Kardex",
          action: () => navigate("/kardex"),
          isActive: isRouteActive("/kardex"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
        {
          id: "reports",
          label: "Reportes",
          action: () => navigate("/reports"),
          isActive: isRouteActive("/reports"),
          roles: ROLES.ADMIN_SHIFT_LIDER,
        },
      ],
    },
    {
      id: "sistema",
      label: "Sistema",
      icon: <FaCogs />,
      isActive:
        isRouteActive("/users") ||
        isRouteActive("/settings"),
      subitems: [
        {
          id: "users",
          label: "Usuarios",
          action: () => navigate("/users"),
          isActive: isRouteActive("/users"),
          roles: ROLES.ADMIN_LIDER,
        },
        {
          id: "settings",
          label: "Catálogos",
          action: () => navigate("/settings"),
          isActive: isRouteActive("/settings"),
          roles: ROLES.ADMIN_LIDER,
        },
      ],
    },
  ];

  return items
    .map((item) => {
      if (item.subitems) {
        const visibleSubitems = item.subitems.filter((sub: any) =>
          hasRole(user?.role ?? null, sub.roles)
        );
        if (visibleSubitems.length === 0) return null;
        return { ...item, subitems: visibleSubitems };
      }
      if (!hasRole(user?.role ?? null, item.roles)) return null;
      return item;
    })
    .filter(Boolean);
};

// ------------- NAVBAR (legacy) -----------------
export const Navbar = () => {
  const navigationItems = useNavigationItems();

  return (
    <div className="flex flex-row space-x-4">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={item.action}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            item.isActive
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export const NAVBAR_LOGO = () => (
  <img src={LOGO} className="h-[40px] hidden md:flex" />
);

export const SIDEBAR_LOGO = () => (
  <img src={LOGO} className="mt-5 h-[40px] flex md:hidden" />
);
