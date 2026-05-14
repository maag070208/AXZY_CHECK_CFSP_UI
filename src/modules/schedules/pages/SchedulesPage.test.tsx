import { render } from "@app/core/utils/test-utils";
import SchedulesPage from "./SchedulesPage";
import "@testing-library/jest-dom";

describe("SchedulesPage", () => {
  it("renders without crashing", () => {
    render(<SchedulesPage />);
    expect(document.body).toBeTruthy();
  });
});
