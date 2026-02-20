import { useId, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, User, Package, MapPin, CreditCard, FileText } from "lucide-react";
import type { IOrder } from "@shared/interfaces/order.interface";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Link } from "react-router-dom";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTime } from "@/lib/utils";
import { getBillingStatusColor } from "@shared/enums/billing.enum";
import { OrderTimeline } from "./order-timeline";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";

type TOrderDetailExtraProps = {
  canUpdateStatus?: boolean;
};

interface IOrderDetailContentProps
  extends THandlerComponentProps<
    TSingleHandlerStore<IOrder, TOrderDetailExtraProps>
  > {}

export default function OrderDetailContent({ store }: IOrderDetailContentProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const { settings } = useUserSettings();
  const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";

  if (!store) return null;

  const { response: order, isLoading, extra } = store(
    useShallow((s) => ({
      response: s.response as IOrder | null,
      isLoading: s.isLoading,
      extra: s.extra,
    }))
  );


  const canUpdateStatus = extra?.canUpdateStatus ?? false;

  const handleUpdateStatusClick = () => {
    store.setState({ action: "updateStatus" });
  };

  const createdDate = useMemo(
    () => order?.createdAt ? formatDateTime(order.createdAt, settings) : "",
    [order?.createdAt, settings]
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4" data-component-id={componentId}>
        <AppCard loading>{null}</AppCard>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto" data-component-id={componentId}>
        <AppCard>
          <div className="p-8 text-center text-muted-foreground">
            <p>{t("orderNotFound")}</p>
          </div>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-component-id={componentId}>
      {/* Header Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="text-2xl font-semibold">{t("orderConfirmed")}</h2>
              {order.orderRef && (
                <span className="text-sm text-muted-foreground font-mono">({order.orderRef})</span>
              )}
              <Badge variant="outline">{buildSentence(t, order.status.toLowerCase())}</Badge>
            </div>
            {canUpdateStatus && (
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleUpdateStatusClick}>
                  {t("updateStatus")}
                </Button>
              </div>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold text-foreground">
              ${Number(order.totalAmount ?? 0).toFixed(2)}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{createdDate}</span>
          </div>
        </div>
      </AppCard>

      {/* Order Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("orderInformation")}
          </h3>
          <div className="space-y-3">
            {order.buyerUser?.email && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("buyer")}</div>
                  <div className="font-medium">{order.buyerUser.email}</div>
                </div>
              </div>
            )}
            {(order.buyerUser?.firstName || order.buyerUser?.lastName) && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("name")}</div>
                  <div className="font-medium">
                    {[order.buyerUser.firstName, order.buyerUser.lastName].filter(Boolean).join(" ")}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">{t("created")}</div>
                <div className="font-medium">{createdDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Billing Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("shipping")} & {t("billing")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">{t("shippingAddress")}</div>
                {(order.shippingAddressLine1 || order.shippingCity) ? (
                  <div className="text-sm space-y-0.5">
                    {order.shippingAddressLine1 && <div>{order.shippingAddressLine1}</div>}
                    {order.shippingAddressLine2 && <div>{order.shippingAddressLine2}</div>}
                    {(order.shippingCity || order.shippingState || order.shippingZip) && (
                      <div>
                        {[order.shippingCity, order.shippingState, order.shippingZip].filter(Boolean).join(", ")}
                      </div>
                    )}
                    {order.shippingCountry && <div>{order.shippingCountry}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">{buildSentence(t, "not", "provided")}</div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">{t("billing")}</div>
                {order.billing ? (
                  <div className="text-sm space-y-1">
                    {order.billing.title && <div className="font-medium">{order.billing.title}</div>}
                    {order.billing.status && (
                      <Badge variant="outline" className={getBillingStatusColor(order.billing.status)}>
                        {buildSentence(t, order.billing.status.toLowerCase())}
                      </Badge>
                    )}
                    {order.billing.type && (
                      <div className="text-xs text-muted-foreground">
                        {buildSentence(t, "type")}: {buildSentence(t, order.billing.type.toLowerCase())}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">{buildSentence(t, "not", "available")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      {order.history && order.history.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "order", "timeline")}
          </h3>
          <AppCard>
            <OrderTimeline history={order.history} />
          </AppCard>
        </div>
      )}

      {/* Line Items */}
      {order.lineItems && order.lineItems.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("items")}
          </h3>
          <AppCard>
            <ul className="space-y-2">
              {order.lineItems.map((item: any) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.description} × {item.quantity}
                  </span>
                  <span>
                    ${((item.quantity ?? 0) * Number(item.unitPrice ?? 0)).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-semibold mt-4 pt-4 border-t">
              <span>{t("total")}</span>
              <span>${Number(order.totalAmount ?? 0).toFixed(2)}</span>
            </div>
          </AppCard>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to={`${segment}/${ADMIN_ROUTES.ORDERS}`}>
            {t("myOrders")}
          </Link>
        </Button>
        <Button asChild>
          <Link to={`${segment}/${ADMIN_ROUTES.STORE}`}>
            {t("continueShopping")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
