import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type IServiceOffer } from "@shared/interfaces/service-offer.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { ServiceOfferList, ServiceOfferView } from "@/components/admin";

// Page Components
import { ServiceOfferForm, ServiceOfferStatusUpdate, type TServiceOfferExtraProps } from "@/page-components";

// API
import { deleteServiceOffer, fetchServiceOffer, fetchServiceOffers } from "@/services/service-offer.api";
import { getCurrentUserStaff } from "@/services/staff.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { ServiceOfferListDto } from "@shared/dtos";
import type { IStaff } from "@shared/interfaces/staff.interface";

export default function ServiceOffersPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  const STORE_KEY = "service-offer";

  // Fetch current user's trainer information
  const { data: currentUserStaff } = useQuery<IStaff | null>({
    queryKey: ["currentUserStaff"],
    queryFn: getCurrentUserStaff,
  });

  const myTrainer = currentUserStaff?.isTrainer ? currentUserStaff : undefined;

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        <SingleHandler<IServiceOffer, TServiceOfferExtraProps>
          queryFn={fetchServiceOffer}
          storeKey={STORE_KEY}
          initialParams={{
            _relations: "trainer.user,trainerService",
          }}
          SingleComponent={ServiceOfferView}
          singleProps={{
            trainer: myTrainer,
          }}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: ServiceOfferForm,
            },
            {
              action: "updateStatus",
              comp: ServiceOfferStatusUpdate,
            },
          ]}
        />

        <ListHandler<IServiceOffer, any, any, IServiceOffer, any>
          queryFn={fetchServiceOffers}
          initialParams={{
            _relations: "trainer.user,trainerService",
          }}
          ListComponent={ServiceOfferList}
          deleteFn={deleteServiceOffer}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
            });
          }}
          dto={ServiceOfferListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;

