// External Libraries
import { useId, useTransition, useCallback, useMemo, useEffect, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateFacilityInfoStatus } from "@/services/facility-info.api";
import type { IFacilityInfo } from "@shared/interfaces/facility-info.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";
import { EFacilityInfoStatus } from "@shared/enums/facility-info.enum";
import { AppSelect } from "@/components/layout-ui/app-select";

interface IFacilityInfoStatusUpdateProps extends THandlerComponentProps<TSingleHandlerStore<IFacilityInfo, any>> {}

export default function FacilityInfoStatusUpdate({ storeKey, store }: IFacilityInfoStatusUpdateProps) {
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

  const [selectedStatus, setSelectedStatus] = useState<EFacilityInfoStatus | null>(
    response?.status || null
  );

  useEffect(() => {
    if (response?.status && action === "updateStatus") {
      setSelectedStatus(response.status);
    }
  }, [response?.status, action]);

  const statusOptions = useMemo(() => [
    { value: EFacilityInfoStatus.ACTIVE, label: buildSentence(t, "active") },
    { value: EFacilityInfoStatus.INACTIVE, label: buildSentence(t, "inactive") },
  ], [t]);

  const mutation = useMutation({
    mutationFn: (data: { status: EFacilityInfoStatus; message?: string }) => {
      if (!response?.id) throw new Error("Facility Info ID is required");
      return updateFacilityInfoStatus(response.id)(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [storeKey] });
      queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
      toast.success(buildSentence(t, "facility", "info", "status", "updated", "successfully"));
      startTransition(() => {
        reset();
        setAction("none");
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.message || buildSentence(t, "failed", "to", "update", "facility", "info", "status"),
      );
    },
  });

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
      setSelectedStatus(null);
    });
  }, [reset, setAction, startTransition]);

  const handleUpdate = useCallback(() => {
    if (!response?.id || !selectedStatus) return;
    
    mutation.mutate({
      status: selectedStatus,
    });
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
          title={buildSentence(t, "update", "facility", "info", "status")}
          description={buildSentence(t, "select", "a", "new", "status", "for", "this", "facility", "info")}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
                {buildSentence(t, "cancel")}
              </Button>
              <Button onClick={handleUpdate} disabled={mutation.isPending || !selectedStatus}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                onChange={(value) => setSelectedStatus(value as EFacilityInfoStatus)}
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

