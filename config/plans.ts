export type PlanId = "starter" | "pro" | "business" | "agency" | "enterprise";

export const plans = {
  starter: { members: 2, brands: 1, textGenerations: 200, imageGenerations: 30, videoMinutes: 0, storageGb: 5 },
  pro: { members: 5, brands: 3, textGenerations: 1_000, imageGenerations: 150, videoMinutes: 10, storageGb: 50 },
  business: { members: 15, brands: 10, textGenerations: 5_000, imageGenerations: 600, videoMinutes: 60, storageGb: 250 },
  agency: { members: 40, brands: 50, textGenerations: 20_000, imageGenerations: 2_000, videoMinutes: 240, storageGb: 1_000 },
  enterprise: { members: -1, brands: -1, textGenerations: -1, imageGenerations: -1, videoMinutes: -1, storageGb: -1 },
} as const satisfies Record<PlanId, Record<string, number>>;
