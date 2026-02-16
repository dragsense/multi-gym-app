import { useId } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Components
import { Render } from "@measured/puck";

// Types
import type { IEmailTemplate } from "@shared/interfaces/cms.interface";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchEmailTemplate } from "@/services/cms.api";
import { PageInnerLayout } from "@/layouts";
import { config } from "@/lib/puck/config";

function EmailTemplatePreviewComponent() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();

  const { data: template, isLoading } = useApiQuery<IEmailTemplate>(
    [`emailTemplate-${id}`, id],
    (params) => fetchEmailTemplate(id || "", params),
    {},
    {
      enabled: !!id,
    }
  );

  if (!id) {
    return <div>Invalid ID</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return <div>Email template not found</div>;
  }

  // Initialize PUCK data structure
  const puckData = template.content
    ? {
        content: Array.isArray(template.content.content)
          ? template.content.content
          : [],
        root: template.content.root || { props: {} },
        zones: template.content.zones || {},
      }
    : {
        content: [],
        root: { props: {} },
        zones: {},
      };

  return (
    <div data-component-id={componentId} className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Email Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Email Header */}
          <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {template.name?.charAt(0).toUpperCase() || "E"}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {template.name || "Email Template"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {template.identifier || "template"}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t("subject")}
              </div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {template.subject || "No subject"}
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="px-6 py-8 bg-white dark:bg-gray-800">
            <div className="w-full">
              <Render config={config} data={puckData} />
            </div>
          </div>

          {/* Email Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t("preview")} - {template.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Header = () => null;

export default function EmailTemplatePreviewPage() {
  return (
    <PageInnerLayout Header={<Header />}>
      <EmailTemplatePreviewComponent />
    </PageInnerLayout>
  );
}
