import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { checkMemberSessionPayment } from "@/services/session-billing.api";

export interface UseSessionPaymentStatusParams {
  sessionId: string;
  memberId: string;
}

export interface SessionPaymentStatusResponse {
  hasPaid: boolean;
  paidAt?: Date | null;
}

/**
 * Hook to check if a member has paid for a specific session
 */
export function useSessionPaymentStatus(
  params: UseSessionPaymentStatusParams,
  options?: Omit<
    UseQueryOptions<SessionPaymentStatusResponse, Error>,
    "queryKey" | "queryFn"
  >
) {
  const { sessionId, memberId } = params;

  // React 19: Memoized query key for better performance
  const queryKey = useMemo(
    () => ["session-payment-status", sessionId, memberId],
    [sessionId, memberId]
  );

  // React 19: Memoized query function for better performance
  const queryFn = useMemo(
    () => async () => {
      if (!sessionId || !memberId) {
        return null;
      }

      return await checkMemberSessionPayment(sessionId, memberId);
    },
    [sessionId, memberId]
  );

  return useQuery<SessionPaymentStatusResponse | null, Error>({
    queryKey,
    queryFn,
    ...options,
  });
}
