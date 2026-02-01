import { useId } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { useNavigate } from "react-router-dom";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreatePageDto } from "@shared/dtos";
import type { TCreatePageData } from "@shared/types/cms.type";

// Components
import { PageForm } from "@/components/admin";
import type { IPageFormExtraProps } from "@/components/admin";

// Services
import { createPage } from "@/services/cms.api";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { PageInnerLayout } from "@/layouts";
import { useAuthUser } from "@/hooks/use-auth-user";

function CreatePageComponent() {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const STORE_KEY = "page-create";

  const INITIAL_VALUES: TCreatePageData = {
    title: "",
    slug: "",
    content: { content: [], root: { props: {} }, zones: {} },
    description: "",
    isPublished: false,
  };

  return (
      <div data-component-id={componentId}>
        <FormHandler<
          TCreatePageData,
          IMessageResponse,
          IPageFormExtraProps
        >
          mutationFn={createPage}
          FormComponent={PageForm}
          storeKey={STORE_KEY}
          initialValues={INITIAL_VALUES}
          dto={CreatePageDto}
          validationMode={EVALIDATION_MODES.OnSubmit}
          isEditing={false}
          onSuccess={() => {
            if (!user) return;
            const segment = SEGMENTS[user.level];
            startTransition(() => {
              queryClient.invalidateQueries({
                queryKey: ["page-list"],
              });
              navigate(`${segment}/${ADMIN_ROUTES.CMS.PAGES}`);
            });
          }}
        />
      </div>
  );
}

const Header = () => null;

export default function CreatePagePage() {
  return (
    <PageInnerLayout Header={<Header />}>
      <CreatePageComponent />
    </PageInnerLayout>
  );
} 