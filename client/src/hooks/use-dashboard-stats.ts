import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  totalParticipants: number;
  dailyHours: number;
  goalPercentage: number;
  alerts: number;
}

export interface HierarchyStats {
  tsar: { current: number; max: number };
  centurions: { current: number; max: number };
  decurions: { current: number; max: number };
  drivers: { current: number; max: number };
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["/api", "dashboard", "stats"],
    refetchInterval: 30000,
  });
}

export function useHierarchyStats(seasonId: number | undefined) {
  return useQuery<HierarchyStats>({
    queryKey: ["/api", "dashboard", "hierarchy-stats", String(seasonId)],
    enabled: !!seasonId && seasonId > 0,
  });
}

export function useWaitlistCount() {
  return useQuery<{ count: number }>({
    queryKey: ["/api", "dashboard", "waitlist-count"],
  });
}
