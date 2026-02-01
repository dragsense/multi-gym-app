// React
import { useId, useMemo } from "react";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { IMemberMembershipHistory } from "@shared/interfaces/member-membership.interface";

// Hooks
import { useMemberMemberships } from "@/hooks/use-member-memberships";
import { useMemberMembershipHistory } from "@/hooks/use-member-membership-history";
import { useQueryClient } from "@tanstack/react-query";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { MembershipCard } from "@/components/shared-ui/membership-card";
import { MembershipHistoryList } from "@/components/admin/members/detail/membership-history-list";
import { ListHandler } from "@/handlers";
import { fetchMemberMembershipHistoryByMemberId } from "@/services/member-membership.api";
import { MemberMembershipHistoryListDto } from "@shared/dtos";

interface IMemberMembershipTabProps {
  member: IMember;
  storeKey: string;
}

export function MemberMembershipTab({ member, storeKey }: IMemberMembershipTabProps) {
  const componentId = useId();
  const queryClient = useQueryClient();
  const MEMBERSHIP_HISTORY_STORE_KEY = `${storeKey}-membership-history`;

  // Fetch member memberships using hook
  const { data: memberMembershipsData, isLoading } = useMemberMemberships({
    memberId: member.id,
    params: {
      _relations: "membership",
    },
  });

  const memberMemberships = memberMembershipsData || [];

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
    <div data-component-id={componentId} className="space-y-6">
      {/* Membership Cards */}
      {memberMemberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberMemberships.map((memberMembership: any) => (
            <MembershipCardWithStatus
              key={memberMembership.id}
              memberMembership={memberMembership}
            />
          ))}
        </div>
      ) : (
        <AppCard>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No memberships found</p>
          </div>
        </AppCard>
      )}

      {/* Membership History List with Backend Pagination */}
      <ListHandler<IMemberMembershipHistory, any, any>
        queryFn={(params) => fetchMemberMembershipHistoryByMemberId(member.id, params)}
        initialParams={{
          sortBy: "createdAt",
          sortOrder: "DESC",
        }}
        ListComponent={MembershipHistoryList}
        dto={MemberMembershipHistoryListDto}
        storeKey={MEMBERSHIP_HISTORY_STORE_KEY}
        listProps={{}}
      />
    </div>
  );
}

// Component to fetch and display membership with status
function MembershipCardWithStatus({ memberMembership }: { memberMembership: any }) {
  const { data: historyData } = useMemberMembershipHistory({
    memberMembershipId: memberMembership.id,
  });

  const history = historyData || [];
  const isActive = useMemo(() => {
    if (!history || history.length === 0) return false;
    const latestHistory = history[history.length - 1];
    return latestHistory?.status === 'ACTIVE';
  }, [history]);

  return (
    <MembershipCard
      membership={memberMembership.membership}
      isActive={isActive}
      showSelection={false}
    />
  );
}

