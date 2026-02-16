// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId, useMemo, useTransition } from 'react';

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import {
  Building2,
  Globe,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Types
import { EBusinessStatus } from '@shared/enums';
import { type IBusiness } from "@shared/interfaces";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTime } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";

export type TBusinessViewExtraProps = Record<string, never>;

type IBusinessViewProps = THandlerComponentProps<
  TSingleHandlerStore<IBusiness, TBusinessViewExtraProps>
>;

export default function BusinessView({ storeKey, store }: IBusinessViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  const { response: business, action, reset } = store(useShallow(state => ({
    response: state.response,
    action: state.action,
    reset: state.reset,
  })));

  if (!business) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  return (
    <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, 'business', 'details')}
          description={buildSentence(t, 'view', 'detailed', 'information', 'about', 'this', 'business')}
        >
          <BusinessDetailContent business={business} />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IBusinessDetailContentProps {
  business: IBusiness;
}

function BusinessDetailContent({ business }: IBusinessDetailContentProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  // React 19: Memoized dates for better performance
  const businessCreationDate = useMemo(() =>
    business.createdAt ? formatDateTime(business.createdAt, settings) : '',
    [business.createdAt, settings]
  );

  const statusClasses = {
    [EBusinessStatus.ACTIVE]: "bg-green-100 text-green-800",
    [EBusinessStatus.INACTIVE]: "bg-gray-100 text-gray-800",
  };

  const statusLabel = {
    [EBusinessStatus.ACTIVE]: t("active"),
    [EBusinessStatus.INACTIVE]: t("inactive"),
  };

  return (
    <div className="space-y-4" data-component-id={componentId}>
      {/* Header Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {business.name}
              </h2>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {business.subdomain && (
            <>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span className="font-medium text-foreground">{business.subdomain}</span>
              </div>
              <span>•</span>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{buildSentence(t, 'business', 'since')} {businessCreationDate}</span>
          </div>
        </div>
      </AppCard>

      {/* Business Details and Owner Information - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, 'business', 'information')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t('name')}</div>
                <div className="font-medium">{business.name}</div>
              </div>
            </div>
            {business.subdomain && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('subdomain')}</div>
                  <div className="font-medium">{business.subdomain}</div>
                </div>
              </div>
            )}
            {business.tenantId && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('tenantId')}</div>
                  <div className="font-medium text-xs">{business.tenantId}</div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Owner Information */}
        {business.user && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {buildSentence(t, 'owner', 'information')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('owner')}</div>
                  <div className="font-medium">
                    {business.user.firstName} {business.user.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {business.user.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
