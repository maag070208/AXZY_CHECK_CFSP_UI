import LoginPage from "@pages/auth/ui/LoginPage";
import RegisterPage from "@pages/auth/ui/RegisterPage";
import { BrandLoader } from "@shared/ui";
import { Suspense, lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { setAuth } from "./core/store/auth/auth.slice";




/** Rutas diferidas: cada página entra en su propio chunk. */
const HomeRoute = lazy(() => import("./app/routing/HomeRoute").then((m) => ({ default: m.HomeRoute })));
const LocationsPage = lazy(() => import("@pages/locations/ui/LocationsPage"));
const ClientsPage = lazy(() => import("@pages/clients/ui/ClientsPage"));
const ClientDetailsPage = lazy(() => import("@pages/clients/ui/ClientDetailsPage"));
const UsersPage = lazy(() => import("@pages/users").then((m) => ({ default: m.UsersPage })));
const IncidentsPage = lazy(() => import("@pages/incidents").then((m) => ({ default: m.IncidentsPage })));
const MaintenancesPage = lazy(() => import("@pages/maintenances").then((m) => ({ default: m.MaintenancesPage })));
const KardexPage = lazy(() => import("@pages/kardex").then((m) => ({ default: m.KardexPage })));
const RoundsPage = lazy(() => import("@pages/rounds/ui/RoundsPage"));
const RoundDetailPage = lazy(() => import("@pages/rounds/ui/RoundDetailPage"));
const SchedulesPage = lazy(() => import("@pages/schedules/ui/SchedulesPage"));
const GuardsPage = lazy(() => import("@pages/guards").then((m) => ({ default: m.GuardsPage })));
const RoutesPage = lazy(() => import("@pages/routes/ui/RoutesPage"));
const CreateRoutePage = lazy(() => import("@pages/routes/ui/CreateRoutePage"));
const SettingsPage = lazy(() => import("@pages/settings/ui/SettingsPage"));
const ReportsPage = lazy(() => import("@pages/reports"));
const GuardDisciplinePage = lazy(() => import("@pages/guard-discipline"));
const GuardLogsPage = lazy(() => import("@pages/guard-logs").then((m) => ({ default: m.GuardLogsPage })));
const NotificationsPage = lazy(() => import("@pages/notifications").then((m) => ({ default: m.NotificationsPage })));
const PanicAlertsPage = lazy(() => import("@pages/panic-alerts").then((m) => ({ default: m.PanicAlertsPage })));
const ShiftPlanningPage = lazy(() => import("@pages/shift-plans"));
const ShiftHandoversPage = lazy(() => import("@pages/shift-handovers"));
const NewShiftHandoverPage = lazy(() => import("@pages/shift-handovers/ui/NewShiftHandoverPage"));
const UniformChecksPage = lazy(() => import("@pages/uniform-checks"));

function App() {
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch();

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeunload", () => {});
    window.addEventListener("unload", handleTabClosing);
    return () => {
      window.removeEventListener("beforeunload", () => {});
      window.removeEventListener("unload", handleTabClosing);
    };
  });

  const handleTabClosing = () => {
    localStorage.setItem("token", token);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && storedToken !== "null") {
      dispatch(setAuth(storedToken));
    }
    setIsAppReady(true);
  }, [dispatch]);

  const loading = useSelector((state: any) => state.loader.loading);

  if (!isAppReady) {
    return <BrandLoader fullScreen size={120} label={null} />;
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <Suspense fallback={<BrandLoader fullScreen size={120} label={null} />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoutes />}>
          <Route path="/home" element={<HomeRoute />} />
          <Route path="/guards" element={<GuardsPage />} />
          
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailsPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/routes/new" element={<CreateRoutePage />} />
          <Route path="/routes/edit/:id" element={<CreateRoutePage />} />

          <Route path="/users" element={<UsersPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/maintenances" element={<MaintenancesPage />} />
          <Route path="/kardex" element={<KardexPage />} />
          <Route path="/schedules" element={<SchedulesPage />} />
          
          <Route path="/rounds" element={<RoundsPage />} />
          <Route path="/rounds/:id" element={<RoundDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/guard-logs" element={<GuardLogsPage />} />
          <Route path="/guard-discipline" element={<GuardDisciplinePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/panic-alerts" element={<PanicAlertsPage />} />
          <Route path="/shift-planning" element={<ShiftPlanningPage />} />
          <Route path="/shift-handovers" element={<ShiftHandoversPage />} />
          <Route path="/shift-handovers/new" element={<NewShiftHandoverPage />} />
          <Route path="/uniforms" element={<UniformChecksPage />} />

        </Route>
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      </Suspense>

      {/* GLOBAL MODAL ACTION LOADER */}
      {loading && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-secondary-900/20 backdrop-blur-[2px] transition-all">
          <div className="flex flex-col items-center gap-5 rounded-[32px] border border-secondary-100 bg-white p-10 shadow-2xl dark:border-secondary-800 dark:bg-secondary-900">
            <BrandLoader size={80} label="Procesando" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary-400">
              Por favor espere…
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
