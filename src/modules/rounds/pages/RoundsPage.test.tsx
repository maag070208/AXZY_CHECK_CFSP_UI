import { render } from "@app/core/utils/test-utils";
import RoundsPage from "./RoundsPage";
import "@testing-library/jest-dom";

describe("RoundsPage", () => {
  it("renders without crashing", () => {
    render(<RoundsPage />);
    expect(document.body).toBeTruthy();
  });
});
