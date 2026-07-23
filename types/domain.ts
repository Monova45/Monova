export type JobStatus = "pending" | "queued" | "processing" | "completed" | "failed" | "cancelled";
export type ContentStatus = "draft" | "in_review" | "approved" | "scheduled" | "publishing" | "published" | "failed" | "archived";
export type ConnectionStatus = "not_connected" | "pending" | "connected" | "expired" | "error";
export type WorkspaceRole = "owner" | "admin" | "marketing_manager" | "designer" | "community_manager" | "analyst" | "sales" | "client" | "viewer";
export type Permission =
  | "workspace.manage" | "members.manage" | "billing.manage"
  | "brand.read" | "brand.write"
  | "content.read" | "content.create" | "content.edit" | "content.approve" | "content.publish"
  | "analytics.read" | "ads.read" | "ads.manage"
  | "messages.read" | "messages.reply"
  | "automations.read" | "automations.manage";
