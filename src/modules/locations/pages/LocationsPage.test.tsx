import { render } from "@app/core/utils/test-utils";
import LocationsPage from "./LocationsPage";
import "@testing-library/jest-dom";

describe("LocationsPage", () => {
  it("renders without crashing", () => {
    render(<LocationsPage />);
    expect(document.body).toBeTruthy();
  });
});
