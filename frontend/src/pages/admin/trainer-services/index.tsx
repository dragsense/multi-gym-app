import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type ITrainerService } from "@shared/interfaces/trainer-service.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { TrainerServiceList, TrainerServiceView } from "@/components/admin";

// Page Components
import { TrainerServiceForm, TrainerServiceDelete, type TTrainerServiceExtraProps } from "@/page-components";

// API
import { deleteTrainerService, fetchTrainerService, fetchTrainerServices } from "@/services/trainer-service.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { TrainerServiceListDto } from "@shared/dtos";

export default function TrainerServicesPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  const STORE_KEY = "trainer-service";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        <SingleHandler<ITrainerService, TTrainerServiceExtraProps>
          queryFn={fetchTrainerService}
          storeKey={STORE_KEY}
      
          SingleComponent={TrainerServiceView}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: TrainerServiceForm,
            },
            {
              action: "delete",
              comp: TrainerServiceDelete,
            },
          ]}
        />

        <ListHandler<ITrainerService, any, any, ITrainerService, any>
          queryFn={fetchTrainerServices}
        
          ListComponent={TrainerServiceList}
          deleteFn={deleteTrainerService}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
            });
          }}
          dto={TrainerServiceListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;

