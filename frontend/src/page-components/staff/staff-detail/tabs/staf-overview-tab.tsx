// React
import { useId } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Types
import type { ITrainer } from "@shared/interfaces/trainer.interface";
import type { ICheckin } from "@shared/interfaces/checkin.interface";
import type { TCheckinListData } from "@shared/types/checkin.type";
import type { TCheckinViewExtraProps } from "@/components/admin/checkins/view/checkin-view";
import type { ICheckinListExtraProps } from "@/components/admin/checkins/list/checkin-list";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { RecentOutstandingBillingSummaryCard, RecentSessionsCard } from "@/components/admin/staff/detail";
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
import type { IStaff } from "@shared/interfaces/staff.interface";

interface IStaffOverviewTabProps {
  staff: IStaff;
  storeKey: string;
}

export function StaffOverviewTab({ staff, storeKey }: IStaffOverviewTabProps) {
  const componentId = useId();
  const queryClient = useQueryClient();
  const CHECKINS_STORE_KEY = `${storeKey}-checkins`;

  return (
    <div data-component-id={componentId} className="space-y-6">
      {/* Two cards in columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {staff.user && <RecentOutstandingBillingSummaryCard user={staff.user} />}
        <RecentSessionsCard trainer={staff} />
      </div>

      {/* Checkins Section */}
   {/*    {staff.user && (
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
              user: staff.user,
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
              queryFn={(params) => fetchUserCheckins(staff.user?.id || "", params)}
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
      )} */}
    </div>
  );
}

