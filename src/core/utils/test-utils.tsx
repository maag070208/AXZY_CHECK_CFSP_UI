import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "../store/store";
import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import { theme } from "@app/theme/theme";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ITThemeProvider theme={theme}>
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    </ITThemeProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
