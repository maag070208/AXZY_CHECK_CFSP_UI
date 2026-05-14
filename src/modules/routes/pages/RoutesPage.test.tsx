import { render } from "@app/core/utils/test-utils";
import RoutesPage from "./RoutesPage";
import "@testing-library/jest-dom";

describe("RoutesPage", () => {
  it("renders without crashing", () => {
    render(<RoutesPage />);
    expect(document.body).toBeTruthy();
  });
});
