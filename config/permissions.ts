import type { Permission, WorkspaceRole } from "@/types/domain";

const allPermissions: readonly Permission[] = [
  "workspace.manage", "members.manage", "billing.manage", "brand.read", "brand.write",
  "content.read", "content.create", "content.edit", "content.approve", "content.publish",
  "analytics.read", "ads.read", "ads.manage", "messages.read", "messages.reply",
  "automations.read", "automations.manage",
];

export const rolePermissions: Readonly<Record<WorkspaceRole, readonly Permission[]>> = {
  owner: allPermissions,
  admin: allPermissions.filter((permission) => permission !== "billing.manage"),
  marketing_manager: ["brand.read", "brand.write", "content.read", "content.create", "content.edit", "content.approve", "content.publish", "analytics.read", "ads.read", "ads.manage", "messages.read", "messages.reply", "automations.read"],
  designer: ["brand.read", "content.read", "content.create", "content.edit"],
  community_manager: ["brand.read", "content.read", "content.create", "content.edit", "content.publish", "analytics.read", "messages.read", "messages.reply"],
  analyst: ["brand.read", "content.read", "analytics.read", "ads.read"],
  sales: ["brand.read", "content.read", "messages.read", "messages.reply"],
  client: ["brand.read", "content.read", "content.approve", "analytics.read"],
  viewer: ["brand.read", "content.read", "analytics.read"],
};

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
