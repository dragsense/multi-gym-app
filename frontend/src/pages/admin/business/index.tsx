import { useQueryClient } from "@tanstack/react-query";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { BusinessList, BusinessView } from "@/components/admin";

// Services
import {
  fetchBusinesses,
  fetchBusiness,
  deleteBusiness,
} from "@/services/business/business.api";

// Page Components
import { BusinessForm } from "@/page-components";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TBusinessListData } from "@shared/types";
import type { IBusinessListExtraProps } from "@/components/admin/business/list/business-list";
import type { TBusinessViewExtraProps } from "@/components/admin/business/view/business-view";
import { BusinessListDto } from "@shared/dtos";
import type { IBusiness } from "@shared/interfaces";

export default function BusinessPage() {
  const queryClient = useQueryClient();

  const BUSINESS_STORE_KEY = "business";

  return (
    <PageInnerLayout Header={<Header />}>
      <SingleHandler<IBusiness>
        name="Business"
        queryFn={fetchBusiness}
        initialParams={{
          _relations: "user",
        }}
        storeKey={BUSINESS_STORE_KEY}
        SingleComponent={BusinessView}
        actionComponents={[
          {
            action: "createOrUpdate",
            comp: BusinessForm,
          },
        ]}
      />

      <ListHandler<
        IBusiness,
        TBusinessListData,
        IBusinessListExtraProps,
        IBusiness,
        TBusinessViewExtraProps
      >
        queryFn={fetchBusinesses}
        deleteFn={deleteBusiness}
        onDeleteSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: [BUSINESS_STORE_KEY + "-list"],
          })
        }
        initialParams={{
          _select: "id,name,subdomain,tenantId,createdAt",
          _relations: "user",
        }}
        ListComponent={BusinessList}
        dto={BusinessListDto}
        storeKey={BUSINESS_STORE_KEY}
      />
    </PageInnerLayout>
  );
}

const Header = () => null;
