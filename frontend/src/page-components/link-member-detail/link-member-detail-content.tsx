// React
import { useId } from "react";
import { useShallow } from "zustand/shallow";

// Types
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TLinkMemberViewExtraProps } from "@/components/admin/link-members/view/link-member-view";

// Components
import { LinkMemberDetailSidebar } from "@/components/admin/link-members/detail/link-member-detail-sidebar";
import { LinkMemberDetailTabs } from "./link-member-detail-tabs";

interface ILinkMemberDetailContentProps
  extends THandlerComponentProps<TSingleHandlerStore<ILinkMember, TLinkMemberViewExtraProps>> {}

export function LinkMemberDetailContent({ storeKey, store }: ILinkMemberDetailContentProps) {
  const componentId = useId();

  if (!store) {
    return null;
  }

  const { response: linkMember } = store(
    useShallow((state) => ({
      response: state.response,
    }))
  );

  if (!linkMember) {
    return null;
  }

  // Determine which member to show (the linked member, not the primary)
  const member = linkMember.linkedMember;

  if (!member) {
    return null;
  }

  return (
    <div data-component-id={componentId} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Sidebar - 30% */}
        <div className="lg:col-span-3">
          <LinkMemberDetailSidebar linkMember={linkMember} member={member} storeKey={storeKey} store={store} />
        </div>

        {/* Right Content - 70% */}
        <div className="lg:col-span-7">
          <LinkMemberDetailTabs linkMember={linkMember} member={member} storeKey={storeKey} />
        </div>
      </div>
    </div>
  );
}
