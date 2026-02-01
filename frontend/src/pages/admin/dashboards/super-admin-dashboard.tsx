// External Libraries
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

// Types
import type { IBusiness } from "@shared/interfaces";

// Handlers
import { SingleHandler } from '@/handlers';

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { AppLoader } from "@/components/layout-ui/app-loader";

// Layouts
import { PageInnerLayout } from "@/layouts";

// API
import { getMyBusiness, loginToMyBusiness } from "@/services/business/business.api";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Stores
import type { TSingleHandlerStore } from "@/stores";
import { useShallow } from "zustand/shallow";

export default function SuperAdminDashboardPage() {
  const STORE_KEY = "superAdminDashboard";

  return (
    <SingleHandler<IBusiness>
      queryFn={getMyBusiness}
      storeKey={STORE_KEY}
      enabled={true}
      SingleComponent={({ storeKey, store }) => {
        if (!store) {
          return <div>Dashboard store "{storeKey}" not found. Did you forget to register it?</div>;
        }
        return (
          <PageInnerLayout
            Header={<Header />}
          >
            <SuperAdminDashboardView storeKey={storeKey} store={store} />
          </PageInnerLayout>
        );
      }}
    />
  );
}

function Header() {
  return null;
}


interface SuperAdminDashboardViewProps {
  storeKey: string;
  store: TSingleHandlerStore<IBusiness, any>;
}

function SuperAdminDashboardView({ storeKey, store }: SuperAdminDashboardViewProps) {
  const { t } = useI18n();
  const componentId = useId();
  const [isLoading, setIsLoading] = useState(false);

  const { response, isLoading: isFetching } = store(
    useShallow((state) => ({
      response: state.response,
      isLoading: state.isLoading,
    }))
  );

  const business = response;

  const handleLoginToBusiness = async () => {
    try {
      setIsLoading(true);
      
      // Login to current user's business
      const response = await loginToMyBusiness();
      
      if (response.redirectUrl) {
        // Redirect to the business portal
        window.location.href = response.redirectUrl;
      } else {
        toast.error(buildSentence(t, "failed", "to", "get", "redirect", "url"));
      }
    } catch (error: any) {
      toast.error(error?.message || buildSentence(t, "failed", "to", "login", "to", "business"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-component-id={componentId}>
        <AppLoader />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-component-id={componentId}>
        <AppCard
          header={
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">{buildSentence(t, "no", "business", "found")}</h3>
            </div>
          }
        >
          <p className="text-muted-foreground">
            {buildSentence(t, "you", "do", "not", "have", "a", "business", "associated", "with", "your", "account")}
          </p>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{buildSentence(t, "business", "information")}</h3>
          </div>
        }
        footer={
          <Button
            onClick={handleLoginToBusiness}
            size="lg"
            className="w-full md:w-auto"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {buildSentence(t, "loading")}
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                {buildSentence(t, "login", "to", "business")}
              </>
            )}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {buildSentence(t, "business", "name")}
            </p>
            <p className="text-lg font-semibold">{business.name}</p>
          </div>
          
          {business.subdomain && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {buildSentence(t, "subdomain")}
              </p>
              <p className="text-lg font-semibold">{business.subdomain}</p>
            </div>
          )}

          {business.tenantId && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {buildSentence(t, "tenant", "id")}
              </p>
              <p className="text-lg font-mono text-sm">{business.tenantId}</p>
            </div>
          )}

          {business.createdAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {buildSentence(t, "created", "at")}
              </p>
              <p className="text-lg">
                {new Date(business.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}
