// React
import { useId } from "react";
import { useParams } from "react-router-dom";

// Handlers
import { SingleHandler } from "@/handlers";

// Types
import type { IBusiness } from "@shared/interfaces";

// Services
import { fetchBusiness } from "@/services/business/business.api";

// Page Components
import { BusinessDetailContent } from "@/page-components/business-detail";
import { BusinessForm } from "@/page-components";
import type { TBusinessViewExtraProps } from "@/components/admin/business/view/business-view";

export default function BusinessDetailPage() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();

  const BUSINESS_DETAIL_STORE_KEY = `business-detail-${id}`;

  return (
    <div data-component-id={componentId}>
      <SingleHandler<IBusiness, TBusinessViewExtraProps>
        queryFn={(_, params) => fetchBusiness(id!, params)}
        initialParams={{
          _relations: "user",
        }}
        storeKey={BUSINESS_DETAIL_STORE_KEY}
        enabled={!!id}
        SingleComponent={BusinessDetailContent}
        actionComponents={[
          {
            action: 'createOrUpdate',
            comp: BusinessForm,
          },
        ]}
      />
    </div>
  );
}
