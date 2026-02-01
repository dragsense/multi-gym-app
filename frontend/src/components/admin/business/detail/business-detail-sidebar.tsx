// React
import { useId, useMemo, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { useNavigate } from "react-router-dom";

// Types
import type { IBusiness } from "@shared/interfaces";
import type { TSingleHandlerStore } from "@/stores";
import type { TBusinessViewExtraProps } from "@/components/admin/business/view/business-view";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Globe,
  User,
  Calendar,
  Edit,
} from "lucide-react";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate } from "@/lib/utils";

interface IBusinessDetailSidebarProps {
  business: IBusiness;
  storeKey: string;
  store: TSingleHandlerStore<IBusiness, TBusinessViewExtraProps>;
}

export function BusinessDetailSidebar({ business, storeKey, store }: IBusinessDetailSidebarProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const [, startTransition] = useTransition();
  const navigate = useNavigate();

  // Get setAction from store
  const setAction = store(useShallow((state) => state.setAction));

  // Handle edit action
  const handleEdit = () => {
    startTransition(() => {
      setAction('createOrUpdate', business.id);
    });
  };

  const businessCreationDate = useMemo(() =>
    business.createdAt ? formatDate(business.createdAt, settings) : '',
    [business.createdAt, settings]
  );

  return (
    <div data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {business.name}
                </h2>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Edit Button */}
          <Button
            onClick={handleEdit}
            className="w-full"
            variant="outline"
            data-component-id={componentId}
          >
            <Edit className="w-4 h-4 mr-2" />
            {buildSentence(t, "edit", "business")}
          </Button>

          <Separator />

          {/* Business Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {buildSentence(t, "business", "information")}
            </h3>
            
            {business.subdomain && (
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{t("subdomain")}</div>
                  <div className="font-medium truncate">{business.subdomain}</div>
                </div>
              </div>
            )}

            {business.tenantId && (
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{t("tenantId")}</div>
                  <div className="font-medium text-xs truncate">{business.tenantId}</div>
                </div>
              </div>
            )}

            {businessCreationDate && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "created")}
                  </div>
                  <div className="font-medium text-sm">{businessCreationDate}</div>
                </div>
              </div>
            )}
          </div>

          {/* Owner Information */}
          {business.user && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {buildSentence(t, "owner", "information")}
                </h3>
                
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">{t("owner")}</div>
                    <div className="font-medium">
                      {business.user.firstName} {business.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {business.user.email}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AppCard>
    </div>
  );
}
