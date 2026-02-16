// React
import { useId } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { IBusiness } from "@shared/interfaces";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TBusinessViewExtraProps } from "@/components/admin/business/view/business-view";

// Components
import { BusinessDetailSidebar } from "@/components/admin/business/detail";
import { BusinessDetailTabs } from "./business-detail-tabs";

interface IBusinessDetailContentProps
  extends THandlerComponentProps<TSingleHandlerStore<IBusiness, TBusinessViewExtraProps>> {}

export function BusinessDetailContent({ storeKey, store }: IBusinessDetailContentProps) {
  const componentId = useId();

  if (!store) {
    return null;
  }

  const { response: business } = store(
    useShallow((state) => ({
      response: state.response,
    }))
  );

  if (!business) {
    return null;
  }

  return (
    <div data-component-id={componentId} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Sidebar - 30% */}
        <div className="lg:col-span-3">
          <BusinessDetailSidebar business={business} storeKey={storeKey} store={store} />
        </div>

        {/* Right Content - 70% */}
        <div className="lg:col-span-7">
          <BusinessDetailTabs business={business} storeKey={storeKey} />
        </div>
      </div>
    </div>
  );
}
