import { useId } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { useNavigate } from "react-router-dom";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateEmailTemplateDto } from "@shared/dtos";
import type { TCreateEmailTemplateData } from "@shared/types/cms.type";

// Components
import { EmailTemplateForm } from "@/components/admin";
import type { IEmailTemplateFormExtraProps } from "@/components/admin";

// Services
import { createEmailTemplate } from "@/services/cms.api";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { PageInnerLayout } from "@/layouts";
import { useAuthUser } from "@/hooks/use-auth-user";

function CreateEmailTemplateComponent() {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const STORE_KEY = "emailTemplate-create";

  const INITIAL_VALUES: TCreateEmailTemplateData = {
    name: "",
    identifier: "",
    subject: "",
    content: { content: [], root: { props: {} }, zones: {} },
    availableVariables: ["user.email", "user.firstName", "user.lastName"],
    description: "",
    isActive: true,
  };

  return (
      <div data-component-id={componentId}>
        <FormHandler<
          TCreateEmailTemplateData,
          IMessageResponse,
          IEmailTemplateFormExtraProps
        >
          mutationFn={createEmailTemplate}
          FormComponent={EmailTemplateForm}
          storeKey={STORE_KEY}
          initialValues={INITIAL_VALUES}
          dto={CreateEmailTemplateDto}
          validationMode={EVALIDATION_MODES.OnSubmit}
          isEditing={false}
          onSuccess={() => {
            if (!user) return;
            const segment = SEGMENTS[user.level];
            startTransition(() => {
              queryClient.invalidateQueries({
                queryKey: ["emailTemplate-list"],
              });
              navigate(`${segment}/${ADMIN_ROUTES.CMS.EMAIL_TEMPLATES}`);
            });
          }}
        />
      </div>
  );
}

const Header = () => null;

export default function CreateEmailTemplatePage() {
  return (
    <PageInnerLayout Header={<Header />}>
      <CreateEmailTemplateComponent />
    </PageInnerLayout>
  );
}