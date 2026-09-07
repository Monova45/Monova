import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn() }));
import { getCurrentUser } from "@/lib/auth/session";
import { proxy } from "./proxy";

const currentUser = vi.mocked(getCurrentUser);
describe("public demo API isolation", () => {
  beforeEach(() => vi.resetAllMocks());
  it("rejects visitors without a session", async () => {
    currentUser.mockResolvedValue(null);
    expect((await proxy()).status).toBe(401);
  });
  it("fails closed when the session database is unavailable", async () => {
    currentUser.mockRejectedValue(new Error("Database unavailable"));
    expect((await proxy()).status).toBe(401);
  });
  it("preserves access for authenticated accounts", async () => {
    currentUser.mockResolvedValue({ id: "user", email: "user@example.com", fullName: "User", workspaceId: "workspace", workspaceName: "Workspace" });
    expect((await proxy()).headers.get("x-middleware-next")).toBe("1");
  });
});
