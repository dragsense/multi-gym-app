import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import type { IPage } from "@shared/interfaces/cms.interface";
import type { TPageViewExtraProps } from "@/components/admin/cms/pages/view/page-view";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { PageList, PageView } from "@/components/admin";

// API
import { deletePage, fetchPages, fetchPage } from "@/services/cms.api";

// Page Components
import { PagePublish } from "@/page-components/cms";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { PageListDto } from "@shared/dtos";

export default function PagesPage() {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const STORE_KEY = "page";

  return (
    <PageInnerLayout Header={<Header />}>
      <SingleHandler<IPage, TPageViewExtraProps>
        queryFn={fetchPage}
        initialParams={{_select: "id,title,slug,description,isPublished,isSystem,publishedAt,createdAt,updatedAt"}}
        storeKey={STORE_KEY}
        SingleComponent={PageView}
        actionComponents={[
          {
            action: "publish",
            comp: PagePublish,
          },
          {
            action: "draft",
            comp: PagePublish,
          },
        ]}
      />
      <div data-component-id={componentId}>
        <ListHandler<IPage, any, any, IPage, TPageViewExtraProps>
          queryFn={fetchPages}
          deleteFn={deletePage}
          initialParams={{_select: "id,title,slug,description,isPublished,isSystem,publishedAt,createdAt,updatedAt"}}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({
                queryKey: [STORE_KEY + "-list"],
              });
            });
          }}
          ListComponent={PageList}
          dto={PageListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;
