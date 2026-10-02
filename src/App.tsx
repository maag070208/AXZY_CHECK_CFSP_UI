import LoginPage from "@app/modules/auth/pages/LoginPage";
import RegisterPage from "@app/modules/auth/pages/RegisterPage";
import { BrandLoader } from "@shared/ui";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { setAuth } from "./core/store/auth/auth.slice";
import HomePage from "./modules/home/pages/HomePage";

import LocationsPage from "./modules/locations/pages/LocationsPage";
import ClientsPage from "./modules/clients/pages/ClientsPage";
import ClientDetailsPage from "./modules/clients/pages/ClientDetailsPage";

import { UsersPage } from "@pages/users";
import { IncidentsPage } from "@pages/incidents";
import { MaintenancesPage } from "@pages/maintenances";
import { KardexPage } from "@pages/kardex";
import RoundsPage from "./modules/rounds/pages/RoundsPage";
import RoundDetailPage from "./modules/rounds/pages/RoundDetailPage";
import SchedulesPage from "./modules/schedules/pages/SchedulesPage";
import GuardsPage from "./modules/guards/pages/GuardsPage";
import RoutesPage from "./modules/routes/pages/RoutesPage";
import CreateRoutePage from "./modules/routes/pages/CreateRoutePage";
import SettingsPage from "@app/modules/settings/pages/SettingsPage";
import ReportsPage from "./modules/reports/pages/ReportsPage";
import GuardDisciplinePage from "./modules/guard-discipline/pages/GuardDisciplinePage";
import { GuardLogsPage } from "@pages/guard-logs";
import { NotificationsPage } from "@pages/notifications";
import { PanicAlertsPage } from "@pages/panic-alerts";
import ShiftPlanningPage from "./modules/shift-plans/pages/ShiftPlanningPage";
import ShiftHandoversPage from "./modules/shift-handovers/pages/ShiftHandoversPage";
import NewShiftHandoverPage from "./modules/shift-handovers/pages/NewShiftHandoverPage";
import UniformChecksPage from "./modules/uniform-checks/pages/UniformChecksPage";


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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoutes />}>
          <Route path="/home" element={<HomePage />} />
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
