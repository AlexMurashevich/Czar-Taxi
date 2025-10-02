import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Waitlist } from "@/lib/types";

export function useParticipants() {
  return useQuery<User[]>({
    queryKey: ["/api/participants"],
  });
}

export function useWaitlist() {
  return useQuery<Waitlist[]>({
    queryKey: ["/api/waitlist"],
  });
}

export function useApproveWaitlistEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("POST", `/api/waitlist/${entryId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
    },
  });
}

export function useRejectWaitlistEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("POST", `/api/waitlist/${entryId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/participants/${userId}/block`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
    },
  });
}
