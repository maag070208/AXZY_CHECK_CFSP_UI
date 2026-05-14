import { render } from "@app/core/utils/test-utils";
import IncidentsPage from "./IncidentsPage";
import "@testing-library/jest-dom";

describe("IncidentsPage", () => {
  it("renders without crashing", () => {
    render(<IncidentsPage />);
    expect(document.body).toBeTruthy();
  });
});
