import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@/lib/types";

export function useTopCenturions(seasonId: number, limit: number = 5) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboards/centurions", seasonId, { limit }],
    enabled: !!seasonId,
  });
}

export function useTopDrivers(seasonId: number, limit: number = 5) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboards/drivers", seasonId, { limit }],
    enabled: !!seasonId,
  });
}
