import { describe, expect, it } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/errors";
import { requireWorkspaceAccess, type WorkspaceAccessGateway } from "@/server/permissions/require-workspace-access";

function gateway(userId: string | null, role: "owner" | "viewer" = "viewer"): WorkspaceAccessGateway {
  return {
    async getAuthenticatedUserId() { return userId; },
    async getMembership(workspaceId, authenticatedUserId) {
      return { workspaceId, userId: authenticatedUserId, role, active: true };
    },
  };
}

describe("requireWorkspaceAccess", () => {
  it("rechaza sesiones ausentes", async () => {
    await expect(requireWorkspaceAccess("workspace", undefined, gateway(null))).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("rechaza permisos no concedidos", async () => {
    await expect(requireWorkspaceAccess("workspace", "content.publish", gateway("user", "viewer"))).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("retorna contexto seguro al owner", async () => {
    const context = await requireWorkspaceAccess("workspace", "billing.manage", gateway("user", "owner"));
    expect(context.workspaceId).toBe("workspace");
    expect(context.permission).toBe("billing.manage");
  });
});
