import { useId } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Components
import { Render } from "@measured/puck";

// Types
import type { IPage } from "@shared/interfaces/cms.interface";

// Hooks & Utils
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchPageBySlug } from "@/services/cms.api";
import { config } from "@/lib/puck/config";

function PublicPageComponent() {
  const componentId = useId();
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading } = useApiQuery<IPage>(
    [`page-slug-${slug}`, slug],
    () => fetchPageBySlug(slug || ""),
    {},
    {
      enabled: !!slug,
    }
  );

  if (!slug) {
    return <div>Invalid slug</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return <div>Page not found</div>;
  }

  // Initialize PUCK data structure
  const puckData = page.content
    ? {
        content: Array.isArray(page.content.content)
          ? page.content.content
          : [],
        root: page.content.root || { props: {} },
        zones: page.content.zones || {},
      }
    : {
        content: [],
        root: { props: {} },
        zones: {},
      };

  return (
    <div data-component-id={componentId} className="w-full">
      <Render config={config} data={puckData} />
    </div>
  );
}

export default function PublicPage() {
  return <PublicPageComponent />;
}
