// React
import { useId } from "react";
import { useParams } from "react-router-dom";

// Handlers
import { SingleHandler } from "@/handlers";

// Types
import type { IStaff } from "@shared/interfaces/staff.interface";

// Services
import { fetchStaff } from "@/services/staff.api";

// Page Components
import { StaffDetailContent } from "@/page-components/staff-detail";
import { StaffForm } from "@/page-components/staff";
import type { TStaffViewExtraProps } from "@/components/admin/staff/view/staff-view";

export default function StaffDetailPage() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();

  const STAFF_DETAIL_STORE_KEY = `staff-detail-${id}`;

  return (
    <div data-component-id={componentId}>
      <SingleHandler<IStaff, TStaffViewExtraProps>
        queryFn={(_, params) => fetchStaff(id!, params)}
        initialParams={{
          _relations: "user",
        }}
        storeKey={STAFF_DETAIL_STORE_KEY}
        enabled={!!id}
        SingleComponent={StaffDetailContent}
        actionComponents={[
          {
            action: 'createOrUpdate',
            comp: StaffForm,
          },
        ]}
      />
    </div>
  );
}
