import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import {
  FaBook,
  FaBuilding,
  FaChild,
  FaClock,
  FaCogs,
  FaExclamationTriangle,
  FaListAlt,
  FaMapMarkerAlt,
  FaRoute,
  FaThLarge,
  FaUserShield,
  FaWrench
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";
import { AnalyticsTab } from "../components/tabs/AnalyticsTab";
import { OperationalDetailTab } from "../components/tabs/OperationalDetailTab";
import { OperationsDashboardTab } from "../components/tabs/OperationsDashboardTab";

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);

  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "nav" | "dashboard" | "analytics" | "detail"
  >("dashboard");

  const canViewMetrics =
    user.role === "ADMIN" || user.role === "LIDER" || user.role === "RESDN";

  // Obtener hora actual para saludo
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Buenos días" : currentHour < 18 ? "Buenas tardes" : "Buenas noches";

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const allCards = [
      {
        title: "Ubicaciones",
        description: "Espacios de estacionamiento y locales",
        icon: <FaListAlt className="text-white" />,
        action: () => navigate("/locations"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Clientes",
        description: "Gestión de organizaciones y cuentas",
        icon: <FaBuilding className="text-white" />,
        action: () => navigate("/clients"),
        roles: ["ADMIN", "LIDER"],
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Recorridos",
        description: "Supervisión de rondas en tiempo real",
        icon: <FaClock className="text-white" />,
        action: () => navigate("/rounds"),
        roles: ["ADMIN", "LIDER", "SHIFT", "RESDN"],
        color: "from-green-500 to-green-600",
      },
      {
        title: "Configuración de rondas",
        description: "Configuración de rutas de vigilancia",
        icon: <FaRoute className="text-white" />,
        action: () => navigate("/routes"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
        color: "from-teal-500 to-teal-600",
      },
      {
        title: "Incidencias",
        description: "Reportes de novedades y emergencias",
        icon: <FaExclamationTriangle className="text-white" />,
        action: () => navigate("/incidents"),
        roles: ["ADMIN", "LIDER", "SHIFT", "RESDN"],
        color: "from-red-500 to-red-600",
      },
      {
        title: "Mantenimiento",
        description: "Gestión de reportes técnicos",
        icon: <FaWrench className="text-white" />,
        action: () => navigate("/maintenances"),
        roles: ["ADMIN", "LIDER", "SHIFT", "RESDN"],
        color: "from-yellow-500 to-yellow-600",
      },
      {
        title: "Kardex",
        description: "Historial de movimientos y bitácora",
        icon: <FaBook className="text-white" />,
        action: () => navigate("/kardex"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
        color: "from-indigo-500 to-indigo-600",
      },
      {
        title: "Guardias",
        description: "Gestión de personal operativo",
        icon: <FaUserShield className="text-white" />,
        action: () => navigate("/guards"),
        roles: ["ADMIN", "LIDER", "SHIFT", "RESDN"],
        color: "from-pink-500 to-pink-600",
      },
      {
        title: "Horarios",
        description: "Configuración de turnos y roles",
        icon: <FaListAlt className="text-white" />,
        action: () => navigate("/schedules"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
        color: "from-gray-600 to-gray-700",
      },
      {
        title: "Usuarios",
        description: "Administrar usuarios del sistema",
        icon: <FaChild className="text-white" />,
        action: () => navigate("/users"),
        roles: ["ADMIN", "LIDER"],
        color: "from-cyan-500 to-cyan-600",
      },
      {
        title: "Catálogos",
        description: "Ajustes de incidentes y tipos",
        icon: <FaCogs className="text-white" />,
        action: () => navigate("/settings"),
        roles: ["ADMIN", "LIDER"],
        color: "from-orange-500 to-orange-600",
      },
    ];

    const filteredCards = allCards.filter((card) =>
      card.roles.includes(user.role || "")
    );

    setHomeCardItem(filteredCards);
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header con saludo y perfil */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
              {greeting}, {user?.name || "Usuario"} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {/* <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <FaUserCircle className="text-3xl text-slate-700" />
            <span className="text-sm font-medium text-slate-700">
              {user?.role || "Rol"}
            </span>
          </div> */}
        </div>

        {/* Tabs mejorados con efecto pill y deslizador */}
        {canViewMetrics && (
          <div className="flex items-center justify-center md:justify-start overflow-x-auto scrollbar-hide">
            <div className="relative inline-flex p-1 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100/50">
              <TabButton
                active={activeTab === "dashboard"}
                onClick={() => setActiveTab("dashboard")}
                icon={<FaMapMarkerAlt />}
                label="Dashboard"
              />
              <TabButton
                active={activeTab === "nav"}
                onClick={() => setActiveTab("nav")}
                icon={<FaThLarge />}
                label="Navegación"
              />
              {/* <TabButton
                active={activeTab === "analytics"}
                onClick={() => setActiveTab("analytics")}
                icon={<FaChartBar />}
                label="Analytics"
              />
              <TabButton
                active={activeTab === "detail"}
                onClick={() => setActiveTab("detail")}
                icon={<FaTable />}
                label="Detalle"
              /> */}
              {/* Indicador deslizante */}
              <span
                className="absolute bottom-1 left-0 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl transition-all duration-300 -z-10"
                style={{
                  left: `calc(${["dashboard", "nav"].indexOf(activeTab) * 50}% + 4px)`,
                }}
              />
            </div>
          </div>
        )}

        {/* Contenido principal con animaciones */}
        <div className="relative">
          {canViewMetrics && activeTab === "dashboard" && (
            <div className="animate-fadeInUp">
              <OperationsDashboardTab />
            </div>
          )}

          {activeTab === "nav" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fadeInUp">
              {homeCardItem.map((item, index) => (
                <HomeCardItem
                  key={index}
                  item={item}
                  index={index}
                  style={{ animationDelay: `${index * 50}ms` }}
                />
              ))}
            </div>
          )}

          {canViewMetrics && activeTab === "analytics" && (
            <div className="animate-fadeInUp">
              <AnalyticsTab />
            </div>
          )}

          {canViewMetrics && activeTab === "detail" && (
            <div className="animate-fadeInUp">
              <OperationalDetailTab />
            </div>
          )}
        </div>
      </div>

      {/* Estilos adicionales para animaciones */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// TabButton mejorado con estilos refinados
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
      active
        ? "text-white"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
    }`}
  >
    <span className="text-base">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default HomePage;