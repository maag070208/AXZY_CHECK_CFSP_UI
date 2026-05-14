import { render } from "@app/core/utils/test-utils";
import "@testing-library/jest-dom";
import HomePage from "./HomePage";

describe("HomePage", () => {
  it("renders without crashing", () => {
    render(<HomePage />);
    expect(document.body).toBeTruthy();
  });
});
