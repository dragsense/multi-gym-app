// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import {
  Clock,
  DollarSign,
  FileText,
  Palette,
  ListOrdered,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";

// Types
import { ESubscriptionStatus } from "@shared/enums";
import { type ISubscription } from "@shared/interfaces";

// Stores
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatPercentage, getCurrencySymbol } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";

export type TSubscriptionViewExtraProps = Record<string, never>;

type ISubscriptionViewProps = THandlerComponentProps<
  TSingleHandlerStore<ISubscription, TSubscriptionViewExtraProps>
>;

export default function SubscriptionView({
  storeKey,
  store,
}: ISubscriptionViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ISubscription, TSubscriptionViewExtraProps>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!storeState) {
    return null;
  }

  const { response: subscription, action, setAction, reset } = storeState;

  if (!subscription) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (subscription: ISubscription) => {
    startTransition(() => {
      setAction("createOrUpdate", subscription.id);
    });
  };

  const onDelete = (subscription: ISubscription) => {
    startTransition(() => {
      setAction("delete", subscription.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "subscription", "details")}
          description={buildSentence(
            t,
            "view",
            "detailed",
            "information",
            "about",
            "this",
            "subscription"
          )}
        >
          <SubscriptionDetailContent
            subscription={subscription}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface ISubscriptionDetailContentProps {
  subscription: ISubscription;
  onEdit: (subscription: ISubscription) => void;
  onDelete: (subscription: ISubscription) => void;
}

function SubscriptionDetailContent({
  subscription,
  onEdit,
  onDelete,
}: ISubscriptionDetailContentProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  // React 19: Memoized status configuration
  const statusConfig = useMemo(
    () => ({
      [ESubscriptionStatus.ACTIVE]: {
        variant: "default" as const,
        label: t("active"),
        className: "bg-green-100 text-green-800 border-green-200",
      },
      [ESubscriptionStatus.EXPIRED]: {
        variant: "outline" as const,
        label: t("expired"),
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
      [ESubscriptionStatus.INACTIVE]: {
        variant: "destructive" as const,
        label: t("inactive"),
        className: "bg-red-100 text-red-800 border-red-200",
      },
    }),
    [t]
  );

  const status = statusConfig[subscription.status] || {
    variant: "secondary" as const,
    label: subscription.status,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };

  // Calculate discounted price - ensure values are numbers
  const basePrice = Number(subscription.price) || 0;
  const discountPercent = Number(subscription.discountPercentage) || 0;
  
  const discountedPrice = useMemo(() => {
    if (discountPercent > 0 && basePrice > 0) {
      return basePrice - (basePrice * discountPercent) / 100;
    }
    return basePrice;
  }, [basePrice, discountPercent]);

  return (
    <div className="space-y-4" data-component-id={componentId}>
      {/* Header Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {subscription.title}
              </h2>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(subscription)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(subscription)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {buildSentence(t, "delete")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold text-foreground">
              {getCurrencySymbol("USD")}
              {discountedPrice.toFixed(2)}
              <span className="text-muted-foreground font-normal">
                {" "}
                / {t("month")}
              </span>
            </span>
          </div>
          {discountPercent > 0 && (
            <>
              <span>•</span>
              <span className="line-through text-muted-foreground">
                {getCurrencySymbol("USD")}
                {basePrice.toFixed(2)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {discountPercent}% {t("off")}
              </Badge>
            </>
          )}
          {subscription.color && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: subscription.color }}
                />
                <span>{subscription.color}</span>
              </div>
            </>
          )}
        </div>
      </AppCard>

      {/* Subscription Details - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "pricing", "information")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "base", "price")}
                </div>
                <div className="font-medium">
                  {getCurrencySymbol("USD")}
                  {basePrice.toFixed(2)} / {t("month")}
                </div>
              </div>
            </div>
            {discountPercent > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("discount")}
                    </div>
                    <div className="font-medium text-green-600">
                      {formatPercentage(discountPercent)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {buildSentence(t, "final", "price")}
                    </div>
                    <div className="font-medium text-lg text-green-600">
                      {getCurrencySymbol("USD")}
                      {discountedPrice.toFixed(2)} / {t("month")}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "subscription", "info")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("status")}</div>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>
            </div>
            {subscription.frequency && subscription.frequency.length > 0 && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("frequency")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subscription.frequency.map((freq) => (
                      <Badge key={freq} variant="default" className="text-xs">
                        {freq.charAt(0).toUpperCase() + freq.slice(1).toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {subscription.color && (
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("color")}</div>
                  <div className="flex items-center gap-2 font-medium">
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-200"
                      style={{ backgroundColor: subscription.color }}
                    />
                    <span>{subscription.color}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <ListOrdered className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "sort", "order")}
                </div>
                <div className="font-medium">{subscription.sortOrder || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {subscription.description && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("description")}
          </h3>
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">{subscription.description}</div>
          </div>
        </div>
      )}

      {/* Features */}
      {subscription.features && subscription.features.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("features")} ({subscription.features.length})
          </h3>
          <div className="space-y-2">
            {subscription.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Check className="w-4 h-4 text-green-600 shrink-0" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
