import type { ContentStatus } from "@/types/domain";

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  formattedValue: string;
  changePercent: number;
  trend: "positive" | "negative" | "neutral";
}

export interface ChannelPerformance {
  id: string;
  name: string;
  contributionPercent: number;
  color: string;
}

export interface AssistantInsight {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export interface CalendarItem {
  id: string;
  date: string;
  title: string;
  channel: string;
  status: ContentStatus;
  isDemo: boolean;
}

export interface ActivityItem {
  id: string;
  label: string;
  occurredAt: string;
  actorName: string;
}

export interface DashboardSummary {
  workspaceId: string;
  isDemo: boolean;
  dateRange: DateRange;
  metrics: DashboardMetric[];
  channelPerformance: ChannelPerformance[];
  assistantInsights: AssistantInsight[];
  calendarItems: CalendarItem[];
  recentActivity: ActivityItem[];
}
