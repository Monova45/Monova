import { DemoDashboardRepository } from "@/server/repositories/demo-dashboard-repository";
import type { DashboardRepository } from "@/server/repositories/dashboard-repository";
import type { DashboardSummary, DateRange } from "@/types/dashboard";

const demoRepository = new DemoDashboardRepository();

export async function getDashboardSummary(
  workspaceId: string,
  dateRange: DateRange,
  repository: DashboardRepository = demoRepository,
): Promise<DashboardSummary> {
  if (!workspaceId.trim()) {
    throw new Error("workspaceId es obligatorio");
  }

  return repository.getSummary(workspaceId, dateRange);
}
