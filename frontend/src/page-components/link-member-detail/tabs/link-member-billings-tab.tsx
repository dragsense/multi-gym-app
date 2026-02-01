// React
import { useId } from "react";

// Types
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type { IMember } from "@shared/interfaces/member.interface";
import type { IBilling } from "@shared/interfaces/billing.interface";
import type { TBillingData, TBillingListData } from "@shared/types/billing.type";
import type { IBillingListExtraProps } from "@/components/admin/billings/list/billing-list";
import type { TBillingExtraProps } from "@/page-components/billing/billing-form";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Services
import { fetchUserBillings, fetchBilling } from "@/services/billing.api";


// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Receipt } from "lucide-react";
import { BillingList, BillingView } from "@/components/admin/billings";
import { BillingListDto } from "@shared/dtos";

// Page Components
import {
  BillingPayment,
  BillingNotes,
} from "@/page-components/billing";

interface ILinkMemberBillingsTabProps {
  linkMember: ILinkMember;
  member: IMember;
  storeKey: string;
}

export function LinkMemberBillingsTab({ linkMember, member, storeKey }: ILinkMemberBillingsTabProps) {
  const componentId = useId();

  const BILLINGS_STORE_KEY = `${storeKey}-billings`;

  return (
    <div data-component-id={componentId} className="space-y-6">

      {/* Billings Section */}
      {member.user && (
        <>
          <SingleHandler<IBilling, TBillingExtraProps>
            queryFn={fetchBilling}
            initialParams={{
              _relations: "recipientUser, lineItems",
              _select: "recipientUser.email, recipientUser.firstName, recipientUser.lastName",
            }}
            storeKey={BILLINGS_STORE_KEY}
            SingleComponent={BillingView}
            singleProps={{
              user: member.user,
            }}
            actionComponents={[
              {
                action: "pay",
                comp: BillingPayment,
              },
              {
                action: "notes",
                comp: BillingNotes,
              },
          
            ]}
          />

          {/* Billings List */}
          <AppCard
            header={
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                <h3 className="text-lg font-semibold">All Billings</h3>
              </div>
            }
          >
            <ListHandler<IBilling, TBillingListData, IBillingListExtraProps, IBilling>
              queryFn={(params) => fetchUserBillings(member.user?.id || "", {...params, linkedMemberId: linkMember.id})}
              initialParams={{
                _relations: "recipientUser",
                _select: "recipientUser.email, recipientUser.firstName, recipientUser.lastName",
                linkedMemberId: linkMember.id,
              }}
              ListComponent={BillingList}
              dto={BillingListDto}
              storeKey={BILLINGS_STORE_KEY}
              listProps={{}}
            />
          </AppCard>
        </>
      )}
    </div>
  );
}
