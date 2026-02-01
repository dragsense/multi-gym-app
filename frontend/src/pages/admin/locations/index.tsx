import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type ILocation } from "@shared/interfaces/location.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { LocationList, LocationView } from "@/components/admin";

// Page Components
import { LocationForm, LocationDelete, type TLocationExtraProps } from "@/page-components";
import { DoorsModal } from "@/page-components/location/doors";

// API
import { deleteLocation, fetchLocation, fetchLocations } from "@/services/location.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { LocationListDto } from "@shared/dtos";

export default function LocationsPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  const STORE_KEY = "location";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        <SingleHandler<ILocation, TLocationExtraProps>
          queryFn={fetchLocation}
          initialParams={{
            _relations: "doors, image",
          }}
          storeKey={STORE_KEY}
          SingleComponent={LocationView}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: LocationForm,
            },
            {
              action: "delete",
              comp: LocationDelete,
            },
          ]}
        />

        <ListHandler<ILocation, any, any, ILocation, any>
          queryFn={fetchLocations}
          ListComponent={LocationList}
       
          deleteFn={deleteLocation}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
            });
          }}
          dto={LocationListDto}
          storeKey={STORE_KEY}
          actionComponents={[
            {
              action: 'manageDoors',
              comp: DoorsModal
            },
          ]}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;

