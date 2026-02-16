// React
import { useId } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { IStaff } from "@shared/interfaces/staff.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TStaffViewExtraProps } from "@/components/admin/staff/view/staff-view";

// Components
import { StaffDetailSidebar } from "@/components/admin/staff/detail";
import { StaffDetailTabs } from "./staff-detail-tabs";

interface IStaffDetailContentProps
  extends THandlerComponentProps<TSingleHandlerStore<IStaff, TStaffViewExtraProps>> {}

export function StaffDetailContent({ storeKey, store }: IStaffDetailContentProps) {
  const componentId = useId();

  if (!store) {
    return null;
  }

  const { response: staff } = store(
    useShallow((state) => ({
      response: state.response,
    }))
  );

  if (!staff) {
    return null;
  }

  return (
    <div data-component-id={componentId} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Sidebar - 30% */}
        <div className="lg:col-span-3">
          <StaffDetailSidebar staff={staff} storeKey={storeKey} store={store} />
        </div>

        {/* Right Content - 70% */}
        <div className="lg:col-span-7">
          <StaffDetailTabs staff={staff} storeKey={storeKey} />
        </div>
      </div>
    </div>
  );
}

