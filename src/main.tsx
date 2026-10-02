import { ITThemePalette, ITThemeProvider } from "@axzydev/axzy_ui_system";
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

const customTheme: ITThemePalette = {
  // ─────────────────────────────────────────────
  // Brand
  // ─────────────────────────────────────────────
  primary: "#009F73",
  secondary: "#00B27F",
  ternary: "#F2F7F5",

  // ─────────────────────────────────────────────
  // Semantic
  // ─────────────────────────────────────────────
  alert: "#F4B942",
  warning: "#F4B942",
  danger: "#D32F2F",
  info: "#536DFE",
  success: "#00A878",

  // ─────────────────────────────────────────────
  // Layout
  // ─────────────────────────────────────────────
  layout: {
    sidebarBg: "#FFFFFF",
    sidebarText: "#46545A",

    navbarBg: "#FFFFFF",
    navbarText: "#11182C",
  },

  // ─────────────────────────────────────────────
  // Tables
  // ─────────────────────────────────────────────
  table: {
    headerBg: "#E4F3EE",
    headerText: "#007A59",

    rowBg: "#FFFFFF",
    rowText: "#11182C",

    rowHover: "#EAF7F3",
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
