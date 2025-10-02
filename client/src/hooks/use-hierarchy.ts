import { useQuery } from "@tanstack/react-query";
import type { HierarchyNode } from "@/lib/types";

export function useHierarchy(seasonId: number) {
  return useQuery<{ tsar: HierarchyNode }>({
    queryKey: ["/api/hierarchy", seasonId],
    enabled: !!seasonId,
  });
}
