import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type IAdvertisement } from "@shared/interfaces/advertisement.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { AdvertisementList, AdvertisementView } from "@/components/admin";

// Page Components
import { AdvertisementForm, AdvertisementDelete, AdvertisementStatusUpdate, type TAdvertisementExtraProps } from "@/page-components";

// API
import { deleteAdvertisement, fetchAdvertisement, fetchAdvertisements } from "@/services/advertisement.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { AdvertisementListDto } from "@shared/dtos";

export default function AdvertisementsPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  const STORE_KEY = "advertisement";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        <SingleHandler<IAdvertisement, TAdvertisementExtraProps>
          queryFn={fetchAdvertisement}
          storeKey={STORE_KEY}
          initialParams={{
            _relations: "bannerImage.image",
          }}
          SingleComponent={AdvertisementView}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: AdvertisementForm,
            },
            {
              action: "delete",
              comp: AdvertisementDelete,
            },
            {
              action: "updateStatus",
              comp: AdvertisementStatusUpdate,
            },
          ]}
        />

        <ListHandler<IAdvertisement, any, any, IAdvertisement, any>
          queryFn={fetchAdvertisements}
          initialParams={{
            _relations: "bannerImage.image",
          }}
          ListComponent={AdvertisementList}
          deleteFn={deleteAdvertisement}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
            });
          }}
          dto={AdvertisementListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;

