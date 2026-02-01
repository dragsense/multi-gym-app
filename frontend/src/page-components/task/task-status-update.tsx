// External Libraries
import { useId, useTransition, useCallback, useMemo, useEffect, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateTask } from "@/services/task.api";
import type { ITask, TUpdateTaskData } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";
import { ETaskStatus } from "@shared/enums/task.enum";
import { AppSelect } from "@/components/layout-ui/app-select";

interface ITaskStatusUpdateProps extends THandlerComponentProps<TSingleHandlerStore<ITask, any>> {}

// Status options will be generated with i18n inside the component

export default function TaskStatusUpdate({ storeKey, store }: ITaskStatusUpdateProps) {
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

  // Initialize selectedStatus when modal opens
  const [selectedStatus, setSelectedStatus] = useState<ETaskStatus | null>(
    response?.status || null
  );

  // Update selectedStatus when response changes
  useEffect(() => {
    if (response?.status && action === "updateStatus") {
      setSelectedStatus(response.status);
    }
  }, [response?.status, action]);

  // Generate status options with i18n
  const statusOptions = useMemo(() => [
    { value: ETaskStatus.TODO, label: buildSentence(t, "to", "do") },
    { value: ETaskStatus.IN_PROGRESS, label: buildSentence(t, "in", "progress") },
    { value: ETaskStatus.IN_REVIEW, label: buildSentence(t, "in", "review") },
    { value: ETaskStatus.DONE, label: buildSentence(t, "done") },
    { value: ETaskStatus.CANCELLED, label: buildSentence(t, "cancelled") },
  ], [t]);

  const mutation = useMutation({
    mutationFn: (data: TUpdateTaskData) => {
      if (!response?.id) throw new Error("Task ID is required");
      return updateTask(response.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [storeKey] });
      queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
      toast.success(buildSentence(t, "task", "status", "updated", "successfully"));
      startTransition(() => {
        reset();
        setAction("none");
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.message || buildSentence(t, "failed", "to", "update", "task", "status"),
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
    } as TUpdateTaskData);
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
          title={buildSentence(t, "update", "task", "status")}
          description={buildSentence(t, "select", "a", "new", "status", "for", "this", "task")}
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
                onChange={(value) => setSelectedStatus(value as ETaskStatus)}
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

