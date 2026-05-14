import { render } from "@app/core/utils/test-utils";
import RoundDetailPage from "./RoundDetailPage";
import "@testing-library/jest-dom";

describe("RoundDetailPage", () => {
  it("renders without crashing", () => {
    render(<RoundDetailPage />);
    expect(document.body).toBeTruthy();
  });
});
