// React
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Services
import { 
  cancelMemberMembership, 
  adminAssignMembership,
} from "@/services/member-membership.api";

// Types

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Toast
import { toast } from "sonner";
import type { TAdminAssignMembershipData } from "@shared/types/membership.type";

interface IUseAdminMemberMembershipOptions {
  memberId: string;
  onCancelSuccess?: () => void;
  onAssignSuccess?: () => void;
}

/**
 * Hook for admin to manage member memberships (cancel and assign)
 * Handles API calls, cache invalidation, and toast notifications
 */
export function useAdminMemberMembership({
  memberId,
  onCancelSuccess,
  onAssignSuccess,
}: IUseAdminMemberMembershipOptions) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Cancel membership mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelMemberMembership(memberId),
    onSuccess: () => {
      toast.success(buildSentence(t, "membership", "cancelled", "successfully"));
      queryClient.invalidateQueries({ queryKey: ["current-membership-summary", memberId] });
      queryClient.invalidateQueries({ queryKey: ["member-memberships"] });
      onCancelSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error?.message || buildSentence(t, "failed", "to", "cancel", "membership"));
    },
  });

  // Assign membership mutation
  const assignMutation = useMutation({
    mutationFn: (data: Omit<TAdminAssignMembershipData, 'memberId'>) => 
      adminAssignMembership({
        memberId,
        membershipId: data.membershipId,
        startDate: data.startDate,
        paymentPreference: data.paymentPreference,
      }),
    onSuccess: () => {
      toast.success(buildSentence(t, "membership", "assigned", "successfully"));
      queryClient.invalidateQueries({ queryKey: ["current-membership-summary", memberId] });
      queryClient.invalidateQueries({ queryKey: ["member-memberships"] });
      onAssignSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error?.message || buildSentence(t, "failed", "to", "assign", "membership"));
    },
  });

  return {
    // Cancel
    cancelMembership: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    
    // Assign
    assignMembership: assignMutation.mutate,
    isAssigning: assignMutation.isPending,
  };
}
