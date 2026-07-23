import { demoDashboardSummary } from "@/features/dashboard/data/demo-dashboard";
import type { DashboardRepository } from "@/server/repositories/dashboard-repository";
import type { DashboardSummary, DateRange } from "@/types/dashboard";

export class DemoDashboardRepository implements DashboardRepository {
  async getSummary(workspaceId: string, dateRange: DateRange): Promise<DashboardSummary> {
    return {
      ...demoDashboardSummary,
      workspaceId,
      dateRange,
      isDemo: true,
    };
  }
}
