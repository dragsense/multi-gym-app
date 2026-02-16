// React
import { useId } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { IBilling } from "@shared/interfaces/billing.interface";
import type { TBillingData, TBillingListData } from "@shared/types/billing.type";
import type { IBillingListExtraProps } from "@/components/admin/billings/list/billing-list";
import type { TBillingExtraProps } from "@/page-components/billing/billing-form";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Services
import { fetchUserBillings, fetchBilling, deleteBilling } from "@/services/billing.api";

// Hooks
import { useDefaultCard } from "@/hooks/use-payment-cards";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Receipt } from "lucide-react";
import { BillingList, BillingView } from "@/components/admin/billings";
import { BillingListDto } from "@shared/dtos";
import { DefaultCardDisplay } from "@/components/shared-ui/default-card-display";

// Page Components
import {
  BillingForm,
  BillingPayment,
  BillingNotes,
  BillingDelete,
  BillingInvoice,
  BillingCashPayment,
} from "@/page-components/billing";

interface IMemberBillingsTabProps {
  member: IMember;
  storeKey: string;
}

export function MemberBillingsTab({ member, storeKey }: IMemberBillingsTabProps) {
  const componentId = useId();
  const queryClient = useQueryClient();

  const { defaultPaymentMethod, isLoading: isLoadingDefaultPaymentMethod } = useDefaultCard(member.user?.id || "");
  
  const BILLINGS_STORE_KEY = `${storeKey}-billings`;

  return (
    <div data-component-id={componentId} className="space-y-6">
      {/* Default Payment Method Section */}
      <DefaultCardDisplay
        card={defaultPaymentMethod}
        isLoading={isLoadingDefaultPaymentMethod}
        title="Default Payment Method"
        emptyMessage="No default payment method"
      />

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
                action: "createOrUpdate",
                comp: BillingForm,
              },
              {
                action: "pay",
                comp: BillingPayment,
              },
              {
                action: "notes",
                comp: BillingNotes,
              },
              {
                action: "delete",
                comp: BillingDelete,
              },
              {
                action: "invoice",
                comp: BillingInvoice,
              },
              {
                action: "cashPayment",
                comp: BillingCashPayment,
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
              queryFn={(params) => fetchUserBillings(member.user?.id || "", params)}
              initialParams={{
                _relations: "recipientUser",
                _select: "recipientUser.email, recipientUser.firstName, recipientUser.lastName",
              }}
              ListComponent={BillingList}
              deleteFn={deleteBilling}
              onDeleteSuccess={() =>
                queryClient.invalidateQueries({
                  queryKey: [BILLINGS_STORE_KEY + "-list"],
                })
              }
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

