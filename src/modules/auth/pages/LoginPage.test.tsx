import { render } from "@app/core/utils/test-utils";
import LoginPage from "./LoginPage";
import "@testing-library/jest-dom";

describe("LoginPage", () => {
  it("renders without crashing", () => {
    render(<LoginPage />);
    expect(document.body).toBeTruthy();
  });
});
