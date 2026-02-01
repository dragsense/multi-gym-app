import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IBilling } from "@shared/interfaces/billing.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { BillingList, BillingView } from "@/components/admin";

// Services
import {
  fetchBillings,
  fetchBilling,
  deleteBilling,
} from "@/services/billing.api";

// Page Components
import {
  BillingForm,
  BillingPayment,
  BillingSendEmail,
  BillingNotes,
  BillingDelete,
  BillingInvoice,
  BillingCashPayment,
} from "@/page-components/billing";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { IBillingListExtraProps } from "@/components/admin/billings/list/billing-list";
import type {
  TBillingData,
  TBillingListData,
} from "@shared/types/billing.type";
import { BillingListDto } from "@shared/dtos/billing-dtos/billing.dto";

export default function BillingsPage() {
  const queryClient = useQueryClient();

  const BILLINGS_STORE_KEY = "billing";

  return (
    <PageInnerLayout Header={<Header />}>
      <SingleHandler<IBilling, TBillingData>
        queryFn={fetchBilling}
        initialParams={{
          _relations: "recipientUser, lineItems",
          _select:
            "recipientUser.email, recipientUser.firstName, recipientUser.lastName",
        }}
        storeKey={BILLINGS_STORE_KEY}
        SingleComponent={BillingView}
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

      <ListHandler<IBilling, TBillingListData, IBillingListExtraProps, IBilling>
        queryFn={fetchBillings}
        deleteFn={deleteBilling}
        initialParams={{
          _relations: "recipientUser",
          _select:
            "recipientUser.email, recipientUser.firstName, recipientUser.lastName",
        }}
        ListComponent={BillingList}
        dto={BillingListDto}
        onDeleteSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: [BILLINGS_STORE_KEY + "-list"],
          })
        }
        storeKey={BILLINGS_STORE_KEY}
        listProps={{}}
        actionComponents={[
          {
            action: "sendEmail",
            comp: BillingSendEmail,
          },
        ]}
      />
    </PageInnerLayout>
  );
}

const Header = () => null;
