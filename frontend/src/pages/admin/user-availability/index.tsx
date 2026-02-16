import { useId } from "react";

// Types
import { type IUserAvailability } from "@shared/interfaces/user-availability.interface";

// Handlers
import { SingleHandler } from "@/handlers";

// Custom UI Components
import { UserAvailabilityView } from "@/components/admin";

// Page Components
import { UserAvailabilityForm, type TUserAvailabilityExtraProps } from "@/page-components";

// API
import { fetchUserAvailability } from "@/services/user-availability.api";

// Layouts
import { PageInnerLayout } from "@/layouts";

export default function UserAvailabilityPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();


  const STORE_KEY = "user-availability";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        <SingleHandler<IUserAvailability, TUserAvailabilityExtraProps>
          queryFn={fetchUserAvailability}
          storeKey={STORE_KEY}
          enabled={true}
          SingleComponent={UserAvailabilityView}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: UserAvailabilityForm,
            },
          ]}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;