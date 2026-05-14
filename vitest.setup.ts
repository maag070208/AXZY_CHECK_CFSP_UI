import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Global Axios mock to prevent network errors in tests
const defaultResponse = { data: { success: true, payload: [], content: [], rows: [], items: [], messages: [] } };

vi.mock("axios", () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn().mockResolvedValue(defaultResponse),
        post: vi.fn().mockResolvedValue(defaultResponse),
        put: vi.fn().mockResolvedValue(defaultResponse),
        delete: vi.fn().mockResolvedValue(defaultResponse),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      })),
      get: vi.fn().mockResolvedValue(defaultResponse),
      post: vi.fn().mockResolvedValue(defaultResponse),
      put: vi.fn().mockResolvedValue(defaultResponse),
      delete: vi.fn().mockResolvedValue(defaultResponse),
    },
  };
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
