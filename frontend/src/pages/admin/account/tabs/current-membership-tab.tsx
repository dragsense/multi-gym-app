// React
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Hooks
import { useMyMembershipSummary } from "@/hooks/use-my-membership-summary";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Components
import { CurrentPlanSummaryCard, formatBillingFrequency, type IPlanSummaryDetail } from "@/components/shared-ui/current-plan-summary-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Calendar, DollarSign, Clock, BadgeCheck, RefreshCw, XCircle, Loader2 } from "lucide-react";

// Page Components
import { SelectMembershipHandler } from "@/page-components/account";

// Services
import { cancelMyMembership } from "@/services/member-membership.api";

// Toast
import { toast } from "sonner";
import { EMembershipStatus } from "@shared/enums";

export default function CurrentMembershipTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { summary, isActive, isLoading } = useMyMembershipSummary();

  // Modal states
  const [showChangeMembershipModal, setShowChangeMembershipModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  // Cancel membership mutation
  const { mutate: cancelMembership, isPending: isCancelling } = useMutation({
    mutationFn: cancelMyMembership,
    onSuccess: () => {
      toast.success(buildSentence(t, "membership", "cancelled", "successfully"));
      queryClient.invalidateQueries({ queryKey: ["my-membership-summary"] });
      setShowCancelConfirmModal(false);
    },
    onError: (error: Error) => {
      toast.error(error?.message || buildSentence(t, "failed", "to", "cancel", "membership"));
    },
  });

  const handleCancelMembership = useCallback(() => {
    cancelMembership();
  }, [cancelMembership]);

  const handleMembershipChangeSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["my-membership-summary"] });
  }, [queryClient]);

  // Build details array
  const details: IPlanSummaryDetail[] = [];

  if (summary?.price !== null && summary?.price !== undefined) {
    details.push({
      icon: DollarSign,
      label: "Price",
      value: `$${summary.price.toFixed(2)}`,
      subValue: summary.billingFrequency ? `/ ${formatBillingFrequency(summary.billingFrequency)}` : undefined,
    });
  }

  if (summary?.billingFrequency) {
    details.push({
      icon: Clock,
      label: "Billing",
      value: formatBillingFrequency(summary.billingFrequency),
    });
  }

  if (summary?.startDate) {
    details.push({
      icon: Calendar,
      label: "Start Date",
      value: new Date(summary.startDate).toLocaleDateString(),
    });
  }

  if (summary?.endDate) {
    details.push({
      icon: Calendar,
      label: "End Date",
      value: new Date(summary.endDate).toLocaleDateString(),
    });
  }

  // Action buttons for the card
  const actionButtons = (
    <div className="flex gap-2">

      {isActive ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowCancelConfirmModal(true)}
        >
          <XCircle className="mr-2 h-4 w-4" />
          {buildSentence(t, "cancel", "membership")}
        </Button>
      ) : (<Button
        variant="outline"
        size="sm"
        onClick={() => setShowChangeMembershipModal(true)}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        {buildSentence(t, "select", "membership")}
      </Button>)}
    </div>
  );

  return (
    <>
      <CurrentPlanSummaryCard
        title="Current Membership"
        planName={summary?.membershipName}
        description={summary?.membershipDescription}
        status={summary?.status}
        isActive={isActive}
        color={summary?.color}
        details={details}
        emptyMessage="No active membership"
        isLoading={isLoading}
        headerIcon={BadgeCheck}
        actionContent={actionButtons}
      />

      {/* Select Membership Handler (Page Component) */}
      <SelectMembershipHandler
        open={showChangeMembershipModal}
        onOpenChange={setShowChangeMembershipModal}
        onSuccess={handleMembershipChangeSuccess}
      />

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelConfirmModal} onOpenChange={setShowCancelConfirmModal}>
        <DialogContent>
          <AppDialog
            title={buildSentence(t, "cancel", "membership")}
            description={buildSentence(t, "are", "you", "sure", "you", "want", "to", "cancel", "your", "membership")}
            footerContent={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirmModal(false)}
                  disabled={isCancelling}
                >
                  {t("no")}, {buildSentence(t, "keep", "it")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelMembership}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("cancelling")}...
                    </>
                  ) : (
                    <>
                      {t("yes")}, {buildSentence(t, "cancel", "membership")}
                    </>
                  )}
                </Button>
              </div>
            }
          >
            <div className="py-4">
              <p className="text-muted-foreground">
                {summary?.membershipName && (
                  <>
                    {buildSentence(t, "your", "current", "membership")}: <span className="font-semibold">{summary.membershipName}</span>
                  </>
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {buildSentence(t, "this", "action", "cannot", "be", "undone")}. {buildSentence(t, "you", "will", "lose", "access", "to", "membership", "benefits")}.
              </p>
            </div>
          </AppDialog>
        </DialogContent>
      </Dialog>
    </>
  );
}
