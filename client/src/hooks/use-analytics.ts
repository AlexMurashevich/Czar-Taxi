import { useQuery } from "@tanstack/react-query";

export interface DailyTrendData {
  date: string;
  personal: number;
  total: number;
}

export interface TeamComparisonData {
  teamName: string;
  total: number;
  target: number;
}

export interface GoalProgressData {
  date: string;
  cumulative: number;
  targetCumulative: number;
}

export interface PerformanceDistributionData {
  range: string;
  count: number;
}

export interface AnalyticsData {
  avgDailyGrowth: number;
  activeTodayCount: number;
  achievedGoalCount: number;
  daysRemaining: number;
  dailyTrend: DailyTrendData[];
  teamComparison: TeamComparisonData[];
  goalProgress: GoalProgressData[];
  performanceDistribution: PerformanceDistributionData[];
}

export function useAnalyticsData(seasonId: number | undefined) {
  return useQuery<AnalyticsData>({
    queryKey: ["/api", "analytics", String(seasonId)],
    enabled: !!seasonId && seasonId > 0,
  });
}
