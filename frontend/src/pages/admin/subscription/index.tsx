import { useQueryClient } from "@tanstack/react-query";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { SubscriptionList, SubscriptionView } from "@/components/admin";

// Services
import {
  fetchSubscriptions,
  fetchSubscription,
  deleteSubscription,
} from "@/services/subscription.api";

// Page Components
import { SubscriptionForm } from "@/page-components";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TSubscriptionListData } from "@shared/types";
import type { ISubscriptionListExtraProps } from "@/components/admin/subscriptions/list/subscription-list";
import type { TSubscriptionViewExtraProps } from "@/components/admin/subscriptions/view/subscription-view";
import { SubscriptionListDto } from "@shared/dtos";
import type { ISubscription } from "@shared/interfaces";

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();

  const SUBSCRIPTIONS_STORE_KEY = "subscription";

  return (
    <PageInnerLayout Header={<Header />}>
      <SingleHandler<ISubscription>
        name="Subscription"
        queryFn={fetchSubscription}
        storeKey={SUBSCRIPTIONS_STORE_KEY}
        SingleComponent={SubscriptionView}
        actionComponents={[
          {
            action: "createOrUpdate",
            comp: SubscriptionForm,
          },
        ]}
      />

      <ListHandler<
        ISubscription,
        TSubscriptionListData,
        ISubscriptionListExtraProps,
        ISubscription,
        TSubscriptionViewExtraProps
      >
        queryFn={fetchSubscriptions}
        deleteFn={deleteSubscription}
        onDeleteSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: [SUBSCRIPTIONS_STORE_KEY + "-list"],
          })
        }
        initialParams={{
          _select: "id,title,status,price,discountPercentage,frequency,features,autoRenewal,trialPeriod",
        }}
        ListComponent={SubscriptionList}
        dto={SubscriptionListDto}
        storeKey={SUBSCRIPTIONS_STORE_KEY}
      />
    </PageInnerLayout>
  );
}

const Header = () => null;
