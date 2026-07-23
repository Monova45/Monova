import { describe, expect, it } from "vitest";
import { getDashboardSummary } from "@/server/services/dashboard";

describe("getDashboardSummary", () => {
  it("retorna un resumen demo tipado y aislado por workspace", async () => {
    const result = await getDashboardSummary("workspace-test", {
      from: "2026-07-01",
      to: "2026-07-31",
      label: "Julio",
    });

    expect(result.workspaceId).toBe("workspace-test");
    expect(result.isDemo).toBe(true);
    expect(result.metrics).toHaveLength(5);
  });

  it("rechaza un workspace vacío", async () => {
    await expect(getDashboardSummary(" ", {
      from: "2026-07-01",
      to: "2026-07-31",
      label: "Julio",
    })).rejects.toThrow("workspaceId es obligatorio");
  });
});
