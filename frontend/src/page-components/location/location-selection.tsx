// React & Hooks
import { useId } from "react";

// Types
import { type ILocation } from "@shared/interfaces/location.interface";

// Handlers
import { ListHandler } from "@/handlers";

// Components
import { LocationSelectionModal } from "@/components/admin/locations/location-selection-modal";

// API
import { fetchLocations } from "@/services/location.api";

// DTOs
import { LocationListDto } from "@shared/dtos";

// Store key for global location store
export const LOCATION_SELECTION_STORE_KEY = "location-selection";

export default function LocationSelection() {
  const componentId = useId();

  return (
    <div data-component-id={componentId}>
      <ListHandler<ILocation, any, any>
        queryFn={fetchLocations}
        initialParams={{
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "DESC",
          _relations: "image",
        }}
        ListComponent={() => null}
        storeKey={LOCATION_SELECTION_STORE_KEY}
        dto={LocationListDto}
        listProps={{}}
        actionComponents={[
          {
            action: "selectLocation",
            comp: LocationSelectionModal,
          },
        ]}
      />
    </div>
  );
}
