import { render } from "@app/core/utils/test-utils";
import MaintenancesPage from "./MaintenancesPage";
import "@testing-library/jest-dom";

describe("MaintenancesPage", () => {
  it("renders without crashing", () => {
    render(<MaintenancesPage />);
    expect(document.body).toBeTruthy();
  });
});
