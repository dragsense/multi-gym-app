// React
import { useId } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { ICheckin } from "@shared/interfaces/checkin.interface";
import type { TCheckinListData } from "@shared/types/checkin.type";
import type { TCheckinViewExtraProps } from "@/components/admin/checkins/view/checkin-view";
import type { ICheckinListExtraProps } from "@/components/admin/checkins/list/checkin-list";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { CurrentMembershipCard, RecentOutstandingBillingSummaryCard, RecentSessionsCard } from "@/components/admin/members/detail";
import { CheckinList, CheckinView } from "@/components/admin/checkins";
import { AppCard } from "@/components/layout-ui/app-card";
import { LogIn } from "lucide-react";

// Services
import { fetchUserCheckins, fetchCheckin, deleteCheckin } from "@/services/checkin.api";

// Page Components
import { CheckinForm, CheckinDelete } from "@/page-components/checkin";
import CheckinCheckout from "@/page-components/checkin/checkin-checkout";

// DTOs
import { CheckinListDto } from "@shared/dtos";

interface IMemberOverviewTabProps {
  member: IMember;
  storeKey: string;
}

export function MemberOverviewTab({ member, storeKey }: IMemberOverviewTabProps) {
  const componentId = useId();
  const queryClient = useQueryClient();
  const CHECKINS_STORE_KEY = `${storeKey}-checkins`;

  return (
    <div data-component-id={componentId} className="space-y-6">
      {/* Three cards in columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CurrentMembershipCard member={member} />
        {member.user && <RecentOutstandingBillingSummaryCard user={member.user} />}
        <RecentSessionsCard member={member} />
      </div>

      {/* Checkins Section */}
      {member.user && (
        <>
          <SingleHandler<ICheckin>
            queryFn={fetchCheckin}
            initialParams={{
              _relations: 'user',
              _select: 'user.email, user.firstName, user.lastName',
            }}
            storeKey={CHECKINS_STORE_KEY}
            SingleComponent={CheckinView}
            singleProps={{
              user: member.user,
            }}
            actionComponents={[
              {
                action: 'createOrUpdate',
                comp: CheckinForm
              },
              {
                action: 'checkout',
                comp: CheckinCheckout
              },
              {
                action: 'delete',
                comp: CheckinDelete
              },
            ]}
          />

          <AppCard
            header={
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Checkins</h3>
              </div>
            }
          >
            <ListHandler<ICheckin, TCheckinListData, ICheckinListExtraProps, ICheckin, TCheckinViewExtraProps>
              queryFn={(params) => fetchUserCheckins(member.user?.id || "", params)}
              initialParams={{
                _relations: 'user',
                _select: 'user.email, user.firstName, user.lastName',
                sortBy: 'checkInTime',
                sortOrder: 'DESC',
              }}
              ListComponent={CheckinList}
              deleteFn={deleteCheckin}
              onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [CHECKINS_STORE_KEY + "-list"] })}
              dto={CheckinListDto}
              storeKey={CHECKINS_STORE_KEY}
              listProps={{}}
            />
          </AppCard>
        </>
      )}
    </div>
  );
}

