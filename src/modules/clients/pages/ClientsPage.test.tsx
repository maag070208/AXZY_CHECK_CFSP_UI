import { render } from "@app/core/utils/test-utils";
import ClientsPage from "./ClientsPage";
import "@testing-library/jest-dom";

describe("ClientsPage", () => {
  it("renders without crashing", () => {
    render(<ClientsPage />);
    expect(document.body).toBeTruthy();
  });
});
