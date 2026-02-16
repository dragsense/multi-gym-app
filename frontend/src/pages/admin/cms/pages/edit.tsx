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
import { CreatePageDto, UpdatePageDto } from "@shared/dtos";
import type { TCreatePageData } from "@shared/types/cms.type";
import type { IPage } from "@shared/interfaces/cms.interface";

// Components
import { PageForm } from "@/components/admin";
import type { IPageFormExtraProps } from "@/components/admin";

// Services
import { updatePage, fetchPage } from "@/services/cms.api";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { strictDeepMerge } from "@/utils";
import { PageInnerLayout } from "@/layouts";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuthUser } from "@/hooks/use-auth-user";

const INITIAL_VALUES: TCreatePageData = {
  title: "",
  slug: "",
  content: { content: [], root: { props: {} }, zones: {} },
  description: "",
  isPublished: false,
};

function EditPageComponent() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const STORE_KEY = `page-edit-${id}`;

  if (!id) {
    return (
        <div>Invalid ID</div>
    );
  }

  // Direct API call using useApiQuery
  const { data: page, isLoading } = useApiQuery<IPage>(
    [`page-${id}`, id],
    (params) => fetchPage(id, params),
    {},
    {
      enabled: !!id,
    }
  );

  const initialValues = useMemo(() => {
    if (!page) return INITIAL_VALUES;
    const { content, ...rest } = page ?? {};
    const merged = strictDeepMerge<TCreatePageData>(
      INITIAL_VALUES,
      rest ?? {}
    );
    merged.content = content;
    return merged;
  }, [page]);

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
          TCreatePageData,
          IMessageResponse,
          IPageFormExtraProps
        >
          mutationFn={updatePage(id)}
          FormComponent={PageForm}
          storeKey={STORE_KEY}
          initialValues={initialValues}
          dto={UpdatePageDto}
          validationMode={EVALIDATION_MODES.OnSubmit}
          isEditing={true}
          onSuccess={() => {
            if (!user) return;
            const segment = SEGMENTS[user.level];
            startTransition(() => {
              queryClient.invalidateQueries({
                queryKey: ["page-list"],
              });
              queryClient.invalidateQueries({
                queryKey: [`page-${id}`],
              });
              navigate(`${segment}/${ADMIN_ROUTES.CMS.PAGES}`);
            });
          }}
        />
      </div>
  );
}

const Header = () => null;

export default function EditPagePage() {
  return (
    <PageInnerLayout Header={<Header />}>
      <EditPageComponent />
    </PageInnerLayout>
  );
}