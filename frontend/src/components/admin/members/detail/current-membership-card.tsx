// React
import { useState, useCallback } from "react";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { IMembership } from "@shared/interfaces";
import { EPaymentPreference } from "@shared/enums";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useActiveMemberships } from "@/hooks/use-active-memberships";
import { useCurrentMembershipSummary } from "@/hooks/use-current-membership-summary";
import { useAdminMemberMembership } from "@/hooks/use-admin-member-membership";
import { buildSentence } from "@/locales/translations";

// Components
import { CurrentPlanSummaryCard, formatBillingFrequency, type IPlanSummaryDetail } from "@/components/shared-ui/current-plan-summary-card";
import { MembershipCard } from "@/components/shared-ui/membership-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, DollarSign, Clock, BadgeCheck, XCircle, Loader2, Plus, ChevronLeft, Banknote, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ICurrentMembershipCardProps {
  member: IMember;
}

export function CurrentMembershipCard({ member }: ICurrentMembershipCardProps) {
  const { t } = useI18n();

  // Fetch current membership summary
  const { data: summary, isLoading } = useCurrentMembershipSummary({
    memberId: member.id,
  });

  // Fetch available memberships for admin assignment
  const { data: membershipsData, isLoading: isLoadingMemberships } = useActiveMemberships();
  const memberships = membershipsData?.data || [];

  // Admin membership operations (cancel & assign) - mutations only
  const {
    cancelMembership,
    isCancelling,
    assignMembership,
    isAssigning,
  } = useAdminMemberMembership({
    memberId: member.id,
  });

  // Modal states
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStep, setAssignStep] = useState<'select' | 'confirm'>('select');
  const [selectedMembership, setSelectedMembership] = useState<IMembership | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to today's date
    return new Date().toISOString().split('T')[0];
  });
  const [paymentPreference, setPaymentPreference] = useState<EPaymentPreference>(EPaymentPreference.CASH);

  const hasActiveMembership = summary?.status === 'ACTIVE';

  const handleCancelMembership = useCallback(() => {
    cancelMembership();
    setShowCancelConfirmModal(false);
  }, [cancelMembership]);

  const handleSelectMembership = useCallback((membership: IMembership) => {
    setSelectedMembership(membership);
  }, []);

  const handleProceedToConfirm = useCallback(() => {
    if (selectedMembership) {
      setAssignStep('confirm');
    }
  }, [selectedMembership]);

  const handleBackToSelect = useCallback(() => {
    setAssignStep('select');
  }, []);

  const handleAssignMembership = useCallback(() => {
    if (selectedMembership && startDate) {
      assignMembership({
        membershipId: selectedMembership.id,
        startDate,
        paymentPreference,
      });
    }
  }, [selectedMembership, startDate, paymentPreference, assignMembership]);

  const handleCloseAssignModal = useCallback(() => {
    setShowAssignModal(false);
    setAssignStep('select');
    setSelectedMembership(null);
    setStartDate(new Date().toISOString().split('T')[0]);
    setPaymentPreference(EPaymentPreference.CASH);
  }, []);

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

  // Action buttons for admin
  const actionButtons = (
    <div className="flex gap-2">
      {hasActiveMembership ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowCancelConfirmModal(true)}
        >
          <XCircle className="mr-2 h-4 w-4" />
          {buildSentence(t, "cancel", "membership")}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAssignModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {buildSentence(t, "select", "membership")}
        </Button>
      )}
    </div>
  );

  // Render membership selection step
  const renderSelectStep = () => (
    <>
      {isLoadingMemberships ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {buildSentence(t, "no", "memberships", "available")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2">
          {memberships.map((membership) => (
            <MembershipCard
              key={membership.id}
              membership={membership}
              isSelected={selectedMembership?.id === membership.id}
              onClick={() => handleSelectMembership(membership)}
              showSelection
            />
          ))}
        </div>
      )}
    </>
  );

  // Render confirmation step
  const renderConfirmStep = () => (
    <div className="space-y-6">
      {/* Selected Membership Summary */}
      {selectedMembership && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-semibold mb-2">{selectedMembership.title}</h4>
          {selectedMembership.description && (
            <p className="text-sm text-muted-foreground mb-3">{selectedMembership.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${Number(selectedMembership.calculatedPrice || 0).toFixed(2)}
            </span>
            {selectedMembership.billingFrequency && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatBillingFrequency(selectedMembership.billingFrequency)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Start Date Input */}
      <div className="space-y-2">
        <Label htmlFor="start-date" className="text-sm font-medium">
          {buildSentence(t, "start", "date")}
        </Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          {buildSentence(t, "billing", "will", "be", "scheduled", "from", "this", "date")}
        </p>
      </div>

      {/* Payment Preference */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {buildSentence(t, "payment", "preference")}
        </Label>
        <RadioGroup
          value={paymentPreference}
          onValueChange={(value) => setPaymentPreference(value as EPaymentPreference)}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem
              value={EPaymentPreference.CASH}
              id="payment-cash"
              className="peer sr-only"
            />
            <Label
              htmlFor="payment-cash"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <Banknote className="mb-3 h-6 w-6" />
              <span className="text-sm font-medium">{t("cash")}</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem
              value={EPaymentPreference.ONLINE}
              id="payment-online"
              className="peer sr-only"
            />
            <Label
              htmlFor="payment-online"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <CreditCard className="mb-3 h-6 w-6" />
              <span className="text-sm font-medium">{t("online")}</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Member Info */}
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {buildSentence(t, "assigning", "to")}: <span className="font-semibold text-foreground">{member.user?.firstName} {member.user?.lastName}</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      <CurrentPlanSummaryCard
        title="Current Membership"
        planName={summary?.membershipName}
        description={summary?.membershipDescription}
        status={summary?.status}
        isActive={hasActiveMembership}
        color={summary?.color}
        details={details}
        emptyMessage="No active membership"
        isLoading={isLoading}
        headerIcon={BadgeCheck}
        actionContent={actionButtons}
      />

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelConfirmModal} onOpenChange={setShowCancelConfirmModal}>
        <DialogContent>
          <AppDialog
            title={buildSentence(t, "cancel", "membership")}
            description={buildSentence(t, "are", "you", "sure", "you", "want", "to", "cancel", "this", "membership")}
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
                    {buildSentence(t, "member")}: <span className="font-semibold">{member.user?.firstName} {member.user?.lastName}</span>
                    <br />
                    {buildSentence(t, "membership")}: <span className="font-semibold">{summary.membershipName}</span>
                  </>
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {buildSentence(t, "this", "action", "cannot", "be", "undone")}. {buildSentence(t, "the", "member", "will", "lose", "access", "to", "membership", "benefits")}.
              </p>
            </div>
          </AppDialog>
        </DialogContent>
      </Dialog>

      {/* Assign Membership Modal */}
      <Dialog open={showAssignModal} onOpenChange={handleCloseAssignModal}>
        <DialogContent className="max-w-4xl">
          <AppDialog
            title={assignStep === 'select' 
              ? buildSentence(t, "select", "membership") 
              : buildSentence(t, "confirm", "assignment")
            }
            description={assignStep === 'select'
              ? buildSentence(t, "choose", "a", "membership", "to", "assign")
              : buildSentence(t, "review", "and", "confirm", "the", "membership", "assignment")
            }
            footerContent={
              <div className="flex justify-between w-full">
                {assignStep === 'confirm' ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleBackToSelect}
                      disabled={isAssigning}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      {t("back")}
                    </Button>
                    <Button
                      onClick={handleAssignMembership}
                      disabled={isAssigning || !selectedMembership || !startDate}
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("assigning")}...
                        </>
                      ) : (
                        buildSentence(t, "assign", "membership")
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCloseAssignModal}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      onClick={handleProceedToConfirm}
                      disabled={!selectedMembership}
                    >
                      {t("next")}
                    </Button>
                  </>
                )}
              </div>
            }
          >
            {assignStep === 'select' ? renderSelectStep() : renderConfirmStep()}
          </AppDialog>
        </DialogContent>
      </Dialog>
    </>
  );
}
