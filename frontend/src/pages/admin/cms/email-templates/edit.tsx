import { useId, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from "@shared/dtos";
import type { TCreateEmailTemplateData } from "@shared/types/cms.type";
import type { IEmailTemplate } from "@shared/interfaces/cms.interface";

// Components
import { EmailTemplateForm } from "@/components/admin";
import type { IEmailTemplateFormExtraProps } from "@/components/admin";

// Services
import { updateEmailTemplate, fetchEmailTemplate } from "@/services/cms.api";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { strictDeepMerge } from "@/utils";
import { PageInnerLayout } from "@/layouts";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuthUser } from "@/hooks/use-auth-user";

const INITIAL_VALUES: TCreateEmailTemplateData = {
  name: "",
  identifier: "",
  subject: "",
  content: { content: [], root: { props: {} }, zones: {} },
  availableVariables: ["user.email", "user.firstName", "user.lastName"],
  description: "",
  isActive: true,
};

function EditEmailTemplateComponent() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const STORE_KEY = `emailTemplate-edit-${id}`;

  if (!id) {
    return (
      <div>Invalid ID</div>
    );
  }

  // Direct API call using useApiQuery
  const { data: emailTemplate, isLoading } = useApiQuery<IEmailTemplate>(
    [`emailTemplate-${id}`, id],
    (params) => fetchEmailTemplate(id, params),
    {},
    {
      enabled: !!id,
    }
  );

  const initialValues = useMemo(() => {
    if (!emailTemplate) return INITIAL_VALUES;

    const { content, ...rest } = emailTemplate ?? {};

    const merged = strictDeepMerge<TCreateEmailTemplateData>(
      INITIAL_VALUES,
      rest ?? {}
    );
    merged.content = content;
    return merged;
  }, [emailTemplate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<
        TCreateEmailTemplateData,
        IMessageResponse,
        IEmailTemplateFormExtraProps
      >
        mutationFn={updateEmailTemplate(id)}
        FormComponent={EmailTemplateForm}
        storeKey={STORE_KEY}
        initialValues={initialValues}
        dto={UpdateEmailTemplateDto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={true}
        onSuccess={() => {
          if (!user) return;
          const segment = SEGMENTS[user.level];
          startTransition(() => {
            queryClient.invalidateQueries({
              queryKey: ["emailTemplate-list"],
            });
            queryClient.invalidateQueries({
              queryKey: [`emailTemplate-${id}`],
            });
            navigate(`${segment}/${ADMIN_ROUTES.CMS.EMAIL_TEMPLATES}`);
          });
        }}
      />
    </div>
  );
}

export default function EditEmailTemplatePage() {
  return (
    <PageInnerLayout Header={<Header />}>
      <EditEmailTemplateComponent />
    </PageInnerLayout>
  );
}


const Header = () => null;