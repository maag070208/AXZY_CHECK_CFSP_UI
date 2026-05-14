import "@testing-library/jest-dom";
import * as React from "react";

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock map component (Google Maps) to avoid API key errors in tests
jest.mock("@core/components/GoogleMapComponent", () => ({
  GoogleMapComponent: () => React.createElement("div", { "data-testid": "mock-google-map" })
}));

