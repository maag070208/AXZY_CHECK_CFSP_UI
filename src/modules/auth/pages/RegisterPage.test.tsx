import { render } from "@app/core/utils/test-utils";
import RegisterPage from "./RegisterPage";
import "@testing-library/jest-dom";

describe("RegisterPage", () => {
  it("renders without crashing", () => {
    render(<RegisterPage />);
    expect(document.body).toBeTruthy();
  });
});
