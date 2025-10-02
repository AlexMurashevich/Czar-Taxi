import { useQuery } from "@tanstack/react-query";
import type { FraudAlert } from "@/lib/types";

export function useFraudAlerts() {
  return useQuery<FraudAlert[]>({
    queryKey: ["/api/fraud/alerts"],
    refetchInterval: 60000, // Refresh every minute
  });
}
