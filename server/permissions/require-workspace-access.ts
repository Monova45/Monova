import { hasPermission } from "@/config/permissions";
import { AuthenticationError, AuthorizationError, ValidationError } from "@/lib/errors";
import type { Permission, WorkspaceRole } from "@/types/domain";

export interface WorkspaceMembership {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  active: boolean;
}

export interface WorkspaceAccessGateway {
  getAuthenticatedUserId(): Promise<string | null>;
  getMembership(workspaceId: string, userId: string): Promise<WorkspaceMembership | null>;
}

export interface WorkspaceContext extends WorkspaceMembership {
  permission?: Permission;
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  permission: Permission | undefined,
  gateway: WorkspaceAccessGateway,
): Promise<WorkspaceContext> {
  if (!workspaceId.trim()) throw new ValidationError("workspaceId es obligatorio.");

  const userId = await gateway.getAuthenticatedUserId();
  if (!userId) throw new AuthenticationError();

  const membership = await gateway.getMembership(workspaceId, userId);
  if (!membership?.active) throw new AuthorizationError("No perteneces a este workspace activo.");
  if (permission && !hasPermission(membership.role, permission)) throw new AuthorizationError();

  return { ...membership, permission };
}
