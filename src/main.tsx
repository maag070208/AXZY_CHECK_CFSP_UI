import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import store from "@core/store/store";
import dayjs from "dayjs";
import "dayjs/locale/es";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import ToastProvider from "./providers/toast.provider.tsx";
import NotificationProvider from "./providers/notification.provider.tsx";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

if (!localStorage.getItem("it-theme-dark-mode")) {
  localStorage.setItem("it-theme-dark-mode", "light");
}

const customTheme = {
  primary: "#05537A",
  secondary: "#64748B",
  danger: "#DC2626",
  info: "#0284C7",
  success: "#16A34A",
  layout: {
    sidebarBg: "#FFFFFF",
    sidebarText: "#334155",
    navbarBg: "#FFFFFF",
    navbarText: "#0F172A",
  },
  table: {
    headerBg: "#F8FAFC",
    headerText: "#0F172A",
    rowBg: "#FFFFFF",
    rowText: "#1E293B",
  },
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ITThemeProvider theme={customTheme} showFab={false}>
        <ToastProvider>
          <NotificationProvider />
          <HashRouter>
            <App />
          </HashRouter>
        </ToastProvider>
      </ITThemeProvider>
    </Provider>
  </React.StrictMode>,
);
