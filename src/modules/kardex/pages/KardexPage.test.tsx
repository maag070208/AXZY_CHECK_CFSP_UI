import { render } from "@app/core/utils/test-utils";
import KardexPage from "./KardexPage";
import "@testing-library/jest-dom";

describe("KardexPage", () => {
  it("renders without crashing", () => {
    render(<KardexPage />);
    expect(document.body).toBeTruthy();
  });
});
