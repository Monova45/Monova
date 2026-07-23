import type { DashboardSummary, DateRange } from "@/types/dashboard";

export interface DashboardRepository {
  getSummary(workspaceId: string, dateRange: DateRange): Promise<DashboardSummary>;
}
