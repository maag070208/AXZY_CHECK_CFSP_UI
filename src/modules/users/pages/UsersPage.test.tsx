import { render } from "@app/core/utils/test-utils";
import UsersPage from "./UsersPage";
import "@testing-library/jest-dom";

describe("UsersPage", () => {
  it("renders without crashing", () => {
    render(<UsersPage />);
    expect(document.body).toBeTruthy();
  });
});
