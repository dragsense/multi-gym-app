import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type IFacilityInfo } from "@shared/interfaces/facility-info.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { FacilityInfoList, FacilityInfoView } from "@/components/admin";

// Page Components
import { FacilityInfoForm, FacilityInfoDelete, FacilityInfoStatusUpdate, type TFacilityInfoExtraProps } from "@/page-components";

// API
import { deleteFacilityInfo, fetchFacilityInfo, fetchFacilityInfos } from "@/services/facility-info.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { FacilityInfoListDto } from "@shared/dtos";

export default function FacilityInfoPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  const STORE_KEY = "facility-info";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        <SingleHandler<IFacilityInfo, TFacilityInfoExtraProps>
          queryFn={fetchFacilityInfo}
          storeKey={STORE_KEY}
          SingleComponent={FacilityInfoView}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: FacilityInfoForm,
            },
            {
              action: "delete",
              comp: FacilityInfoDelete,
            },
            {
              action: "updateStatus",
              comp: FacilityInfoStatusUpdate,
            },
          ]}
        />

        <ListHandler<IFacilityInfo, any, any, IFacilityInfo, any>
          queryFn={fetchFacilityInfos}
          ListComponent={FacilityInfoList}
          deleteFn={deleteFacilityInfo}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
            });
          }}
          dto={FacilityInfoListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;

