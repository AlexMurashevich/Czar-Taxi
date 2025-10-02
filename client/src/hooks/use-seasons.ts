import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Season } from "@/lib/types";

export function useSeasons() {
  return useQuery<Season[]>({
    queryKey: ["/api/seasons"],
  });
}

export function useActiveSeason() {
  return useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (seasonData: Omit<Season, 'id'>) => {
      const response = await apiRequest("POST", "/api/seasons", seasonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
    },
  });
}

export function useActivateSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (seasonId: number) => {
      const response = await apiRequest("POST", `/api/seasons/${seasonId}/activate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons/active"] });
    },
  });
}

export function useCloseSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (seasonId: number) => {
      const response = await apiRequest("POST", `/api/seasons/${seasonId}/close`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons/active"] });
    },
  });
}
