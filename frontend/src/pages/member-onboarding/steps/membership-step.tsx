// React
import { useTransition, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
import type { IMembership } from "@shared/interfaces";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { StepNavigationButtons } from "@/components/member-onboarding";
import { MembershipCard } from "@/components/shared-ui/membership-card";

// Hooks
import { useActiveMemberships } from "@/hooks/use-active-memberships";

// Hooks
import { useI18n } from "@/hooks/use-i18n";

interface IMembershipStepProps {
  onComplete: (membership: IMembership) => void;
  onBack?: () => void;
  selectedMembership?: IMembership | null;
}

export function MembershipStep({ onComplete, onBack, selectedMembership }: IMembershipStepProps) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const [selected, setSelected] = useState<IMembership | null>(selectedMembership || null);

  // Fetch active memberships
  const { data: membershipsData, isLoading } = useActiveMemberships();

  const memberships = membershipsData?.data || [];

  const handleContinue = () => {
    if (selected) {
      startTransition(() => {
        onComplete(selected);
      });
    }
  };

  if (isLoading) {
    return (
      <AppCard loading={true}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading memberships...</p>
        </div>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <AppCard footer={
        <StepNavigationButtons
          onBack={onBack}
          onContinue={handleContinue}
          continueDisabled={!selected}
          showBack={!!onBack}
        />
      }>
        <p className="text-sm text-muted-foreground mb-5">
          Choose the membership plan that best fits your needs
        </p>


        {memberships.length === 0 ? (
          <AppCard>
            <div className="text-center py-12">
              <p className="text-muted-foreground">No memberships available at this time.</p>
            </div>
          </AppCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map((membership) => (
              <MembershipCard
                key={membership.id}
                membership={membership}
                isSelected={selected?.id === membership.id}
                onClick={() => setSelected(membership)}
              />
            ))}
          </div>
        )}


        <div className="text-sm text-muted-foreground mt-5">
          {selected
            ? `${t('selected')}: ${t('plan')}: ${selected.title}`
            : `${t('please_select_a_membership_plan_to_continue')}`}
        </div>
      </AppCard>
    </div>
  );
}

