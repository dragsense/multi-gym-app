import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import type { IFaq } from "@shared/interfaces/cms.interface";
import type { TFaqViewExtraProps } from "@/components/admin/cms/faqs/view/faq-view";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { FaqList, FaqView } from "@/components/admin/cms/faqs";

// API
import { deleteFaq, fetchFaqs, fetchFaq } from "@/services/cms.api";

// Page Components
import FaqForm from "@/page-components/cms/faq-form";
import FaqToggleEnabled from "@/page-components/cms/faq-toggle-enabled";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { FaqListDto } from "@shared/dtos";

export default function FaqsPage() {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const STORE_KEY = "faq";

  return (
    <PageInnerLayout Header={<Header />}>
      <SingleHandler<IFaq, TFaqViewExtraProps>
        queryFn={fetchFaq}
        initialParams={{}}
        storeKey={STORE_KEY}
        SingleComponent={FaqView}
        actionComponents={[
          {
            action: "createOrUpdate",
            comp: FaqForm,
          },
          {
            action: "toggleEnabled",
            comp: FaqToggleEnabled,
          },
        ]}
      />

      <div data-component-id={componentId}>
        <ListHandler<IFaq, any, any, IFaq, TFaqViewExtraProps>
          queryFn={fetchFaqs}
          deleteFn={deleteFaq}
          initialParams={{}}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({
                queryKey: [STORE_KEY + "-list"],
              });
            });
          }}
          ListComponent={FaqList}
          dto={FaqListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;
