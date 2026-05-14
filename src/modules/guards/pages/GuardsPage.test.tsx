import { render } from "@app/core/utils/test-utils";
import GuardsPage from "./GuardsPage";
import "@testing-library/jest-dom";

describe("GuardsPage", () => {
  it("renders without crashing", () => {
    render(<GuardsPage />);
    expect(document.body).toBeTruthy();
  });
});
