import { render } from "@app/core/utils/test-utils";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import CreateRoutePage from "./CreateRoutePage";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: () => ({
      state: { locations: [{ locationName: "Test Location", tasks: [] }] },
      pathname: "/routes/create",
    }),
    useParams: () => ({ id: "123" }),
  };
});

describe("CreateRoutePage", () => {
  it("renders without crashing", () => {
    render(<CreateRoutePage />);
    expect(document.body).toBeTruthy();
  });
});
