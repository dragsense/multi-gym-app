import { useShallow } from "zustand/shallow";
import { useId, useTransition, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, User, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import type { IOrder } from "@shared/interfaces/order.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTime } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums/user.enum";

export type TOrderViewExtraProps = Record<string, unknown>;

interface IOrderViewProps
  extends THandlerComponentProps<TSingleHandlerStore<IOrder, TOrderViewExtraProps>> {}

export default function OrderView({ storeKey, store }: IOrderViewProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }

  const { response: order, action, reset, setAction } = store(
    useShallow((s) => ({
      response: s.response,
      action: s.action,
      reset: s.reset,
      setAction: s.setAction,
    }))
  );

  if (!order) return null;

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = () => {
    startTransition(() => setAction("createOrUpdate", order.id));
  };

  const onDelete = () => {
    startTransition(() => setAction("delete", order.id));
  };

  const onUpdateStatus = () => {
    startTransition(() => setAction("updateStatus", order.id));
  };

  return (
    <Dialog open={action === "view"} onOpenChange={handleCloseView} data-component-id={componentId}>
      <DialogContent className="min-w-5xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "order", "details")}
          description={buildSentence(t, "view", "detailed", "information", "about", "this", "order")}
        >
          <OrderDetailContent
            order={order}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IOrderDetailContentProps {
  order: IOrder;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: () => void;
}

function OrderDetailContent({ order, onEdit, onDelete, onUpdateStatus }: IOrderDetailContentProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const { user } = useAuthUser();

  const createdDate = useMemo(
    () => order.createdAt ? formatDateTime(order.createdAt, settings) : "",
    [order.createdAt, settings]
  );

  const canEdit = user?.level === EUserLevels.ADMIN || user?.level === EUserLevels.PLATFORM_OWNER;

  return (
    <div className="space-y-4" data-component-id={componentId}>
      {/* Header Card */}
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="text-2xl font-semibold truncate">{order.orderRef ?? order.id}</h2>
              <Badge variant="outline">{order.status}</Badge>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUpdateStatus}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {buildSentence(t, "update", "status")}
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                  <Pencil className="w-4 h-4" />
                  {buildSentence(t, "edit")}
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  {buildSentence(t, "delete")}
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
            {buildSentence(t, "order", "information")}
          </h3>
          <div className="space-y-3">
            {order.buyerUser?.email && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{buildSentence(t, "buyer")}</div>
                  <div className="font-medium">{order.buyerUser.email}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{buildSentence(t, "created")}</div>
                <div className="font-medium">{createdDate}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "status", "details")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{t("status")}</div>
                <Badge variant="outline">{order.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      {order.lineItems && order.lineItems.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("items") || "Items"}
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
    </div>
  );
}
