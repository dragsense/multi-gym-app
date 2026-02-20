import { useId, useMemo, useState, useCallback, useEffect, useTransition } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { AppSelect } from "@/components/layout-ui/app-select";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";
import { updateOrderStatus } from "@/services/order.api";
import { EOrderStatus } from "@shared/enums/order.enum";
import type { IOrder } from "@shared/interfaces/order.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";

interface IOrderStatusUpdateProps
  extends THandlerComponentProps<TSingleHandlerStore<IOrder, any>> {}

export function OrderStatusUpdate({ storeKey, store }: IOrderStatusUpdateProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return null;
  }

  const { action, response, setAction, reset } = store(
    useShallow((state) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    }))
  );

  const [selectedStatus, setSelectedStatus] = useState<EOrderStatus | null>(
    response?.status || null
  );

  useEffect(() => {
    if (response?.status && action === "updateStatus") {
      setSelectedStatus(response.status);
    }
  }, [response?.status, action]);

  const statusOptions = useMemo(
    () => [
      { value: EOrderStatus.PENDING, label: t("pending") },
      { value: EOrderStatus.SHIPPED, label: t("shipped") },
      { value: EOrderStatus.FULFILLED, label: t("fulfilled") },
      { value: EOrderStatus.CANCELLED, label: t("cancelled") },
      { value: EOrderStatus.REFUNDED, label: t('refunded')}
    ],
    [t]
  );

  const mutation = useMutation({
    mutationFn: (status: EOrderStatus) => {
      if (!response?.id) throw new Error("Order ID is required");
      return updateOrderStatus(response.id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [storeKey+"-single"] });
      toast.success(buildSentence(t, "order", "status", "updated", "successfully"));
      startTransition(() => {
        setAction("none");
      });
    },
    onError: (error: Error) => {
      toast.error(
        error?.message || buildSentence(t, "failed", "to", "update", "order", "status")
      );
    },
  });

  const handleClose = useCallback(() => {
    startTransition(() => {
      setAction("none");
      setSelectedStatus(null);
    });
  }, [reset, setAction, startTransition]);

  const handleUpdate = useCallback(() => {
    if (!response?.id || !selectedStatus) return;
    mutation.mutate(selectedStatus);
  }, [response?.id, selectedStatus, mutation]);

  if (action !== "updateStatus" || !response) {
    return null;
  }

  return (
    <Dialog
      open={action === "updateStatus"}
      onOpenChange={(open) => !open && handleClose()}
      data-component-id={componentId}
    >
      <DialogContent>
        <AppDialog
          title={buildSentence(t, "update", "order", "status")}
          description={buildSentence(
            t,
            "select",
            "a",
            "new",
            "status",
            "for",
            "this",
            "order"
          )}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                {buildSentence(t, "cancel")}
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={mutation.isPending || !selectedStatus}
              >
                {mutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {buildSentence(t, "update")}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {buildSentence(t, "status")}
              </label>
              <AppSelect
                value={selectedStatus || response.status}
                onChange={(value) => setSelectedStatus(value as EOrderStatus)}
                options={statusOptions}
                placeholder={buildSentence(t, "select", "status")}
              />
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

export default OrderStatusUpdate;

