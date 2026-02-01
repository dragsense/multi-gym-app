// React
import { useId } from "react";
import { useParams } from "react-router-dom";

// Handlers
import { SingleHandler } from "@/handlers";

// Types
import type { ILinkMember } from "@shared/interfaces/link-member.interface";

// Services
import { fetchLinkMember } from "@/services/link-member.api";

// Page Components
import { LinkMemberDetailContent } from "@/page-components/link-member-detail";
import { LinkMemberForm } from "@/components/admin/link-members/form/link-member-form";
import type { TLinkMemberViewExtraProps } from "@/components/admin/link-members/view/link-member-view";

export default function LinkMemberDetailPage() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();

  const LINK_MEMBER_DETAIL_STORE_KEY = `link-member-detail-${id}`;

  return (
    <div data-component-id={componentId}>
      <SingleHandler<ILinkMember, TLinkMemberViewExtraProps>
        queryFn={(_, params) => fetchLinkMember(id!, params)}
        initialParams={{
          _relations: "primaryMember.user, linkedMember.user",
        }}
        storeKey={LINK_MEMBER_DETAIL_STORE_KEY}
        enabled={!!id}
        SingleComponent={LinkMemberDetailContent}
        actionComponents={[
          {
            action: 'createOrUpdate',
            comp: LinkMemberForm,
          },
        ]}
      />
    </div>
  );
}
