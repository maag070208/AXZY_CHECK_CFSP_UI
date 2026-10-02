import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
// Mismo locale que `main.tsx`: si no, los tests formatean fechas en inglés y
// asertar sobre formatos traducidos da falsos negativos.
dayjs.locale("es");

// Mock global de axios para que ningún test haga red por accidente.
//
// OJO: es un parche silencioso — devuelve un sobre "success" vacío, así que un
// test que OLVIDE mockear su servicio pasa en falso. Los tests nuevos deben
// mockear el servicio (o usar `renderWithProviders` con un view-model mockeado)
// y no depender de esto. Pendiente: hacerlo ruidoso (Fase 3).
const defaultResponse = { data: { success: true, payload: [], content: [], rows: [], items: [], messages: [] } };

const mockInstance = () => ({
  get: vi.fn().mockResolvedValue(defaultResponse),
  post: vi.fn().mockResolvedValue(defaultResponse),
  put: vi.fn().mockResolvedValue(defaultResponse),
  patch: vi.fn().mockResolvedValue(defaultResponse),
  delete: vi.fn().mockResolvedValue(defaultResponse),
  request: vi.fn().mockResolvedValue(defaultResponse),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
  },
});

vi.mock("axios", () => {
  const mock = {
    create: vi.fn(mockInstance),
    get: vi.fn().mockResolvedValue(defaultResponse),
    post: vi.fn().mockResolvedValue(defaultResponse),
    put: vi.fn().mockResolvedValue(defaultResponse),
    patch: vi.fn().mockResolvedValue(defaultResponse),
    delete: vi.fn().mockResolvedValue(defaultResponse),
    request: vi.fn().mockResolvedValue(defaultResponse),
    isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError),
  };
  return { ...mock, default: mock };
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock map component (Google Maps) to avoid API key errors in tests
vi.mock("@core/components/GoogleMapComponent", () => ({
  GoogleMapComponent: () => React.createElement("div", { "data-testid": "mock-google-map" })
}));
