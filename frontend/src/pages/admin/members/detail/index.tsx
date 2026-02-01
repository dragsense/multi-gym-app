// React
import { useId } from "react";
import { useParams } from "react-router-dom";

// Handlers
import { SingleHandler } from "@/handlers";

// Types
import type { IMember } from "@shared/interfaces/member.interface";

// Services
import { fetchMember } from "@/services/member.api";

// Page Components
import { MemberDetailContent } from "@/page-components/member-detail";
import { MemberForm } from "@/page-components/member";
import type { TMemberViewExtraProps } from "@/components/admin/member/view/member-view";

export default function MemberDetailPage() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();

  const MEMBER_DETAIL_STORE_KEY = `member-detail-${id}`;

  return (
    <div data-component-id={componentId}>
      <SingleHandler<IMember, TMemberViewExtraProps>
        queryFn={(_, params) => fetchMember(id!, params)}
        initialParams={{
          _relations: "user",
        }}
        storeKey={MEMBER_DETAIL_STORE_KEY}
        enabled={!!id}
        SingleComponent={MemberDetailContent}
        actionComponents={[
          {
            action: 'createOrUpdate',
            comp: MemberForm,
          },
        ]}
      />
    </div>
  );
}
