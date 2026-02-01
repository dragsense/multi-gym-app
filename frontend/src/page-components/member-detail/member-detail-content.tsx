// React
import { useId } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TMemberViewExtraProps } from "@/components/admin/members/view/member-view";

// Components
import { MemberDetailSidebar } from "@/components/admin/members/detail";
import { MemberDetailTabs } from "./member-detail-tabs";

interface IMemberDetailContentProps
  extends THandlerComponentProps<TSingleHandlerStore<IMember, TMemberViewExtraProps>> {}

export function MemberDetailContent({ storeKey, store }: IMemberDetailContentProps) {
  const componentId = useId();

  if (!store) {
    return null;
  }

  const { response: member } = store(
    useShallow((state) => ({
      response: state.response,
    }))
  );

  if (!member) {
    return null;
  }

  return (
    <div data-component-id={componentId} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Sidebar - 30% */}
        <div className="lg:col-span-3">
          <MemberDetailSidebar member={member} storeKey={storeKey} store={store} />
        </div>

        {/* Right Content - 70% */}
        <div className="lg:col-span-7">
          <MemberDetailTabs member={member} storeKey={storeKey} />
        </div>
      </div>
    </div>
  );
}

