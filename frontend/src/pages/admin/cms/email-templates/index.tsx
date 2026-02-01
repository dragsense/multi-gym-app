import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import type { IEmailTemplate } from "@shared/interfaces/cms.interface";
import type { TEmailTemplateViewExtraProps } from "@/components/admin/cms/email-templates/view/email-template-view";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { EmailTemplateList, EmailTemplateView } from "@/components/admin";

// API
import {
  deleteEmailTemplate,
  fetchEmailTemplates,
  fetchEmailTemplate,
} from "@/services/cms.api";

// Page Components
import { EmailTemplateActivate } from "@/page-components/cms";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { EmailTemplateListDto } from "@shared/dtos";

export default function EmailTemplatesPage() {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const STORE_KEY = "emailTemplate";

  return (
    <PageInnerLayout Header={<Header />}>
      <SingleHandler<IEmailTemplate, TEmailTemplateViewExtraProps>
        queryFn={fetchEmailTemplate}
        initialParams={{_select: "id,name,identifier,subject,description,isActive,createdAt,updatedAt"}}
        storeKey={STORE_KEY}
        SingleComponent={EmailTemplateView}
        actionComponents={[
          {
            action: "activate",
            comp: EmailTemplateActivate,
          },
          {
            action: "deactivate",
            comp: EmailTemplateActivate,
          },
        ]}
      />
      <div data-component-id={componentId}>
        <ListHandler<IEmailTemplate, any, any, IEmailTemplate, TEmailTemplateViewExtraProps>
          queryFn={fetchEmailTemplates}
          initialParams={{_select: "id,name,identifier,subject,description,isActive,createdAt,updatedAt"}}
          ListComponent={EmailTemplateList}
          deleteFn={deleteEmailTemplate}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({
                queryKey: [STORE_KEY + "-list"],
              });
            });
          }}
          dto={EmailTemplateListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;
