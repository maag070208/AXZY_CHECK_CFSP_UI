import { render } from "@app/core/utils/test-utils";
import ClientDetailsPage from "./ClientDetailsPage";
import "@testing-library/jest-dom";

describe("ClientDetailsPage", () => {
  it("renders without crashing", () => {
    render(<ClientDetailsPage />);
    expect(document.body).toBeTruthy();
  });
});
