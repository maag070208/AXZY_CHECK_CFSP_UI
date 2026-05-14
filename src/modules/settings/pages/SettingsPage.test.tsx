import { render } from "@app/core/utils/test-utils";
import SettingsPage from "./SettingsPage";
import "@testing-library/jest-dom";

describe("SettingsPage", () => {
  it("renders without crashing", () => {
    render(<SettingsPage />);
    expect(document.body).toBeTruthy();
  });
});
