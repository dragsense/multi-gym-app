// External Libraries
import { useId, useTransition, useCallback, useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { updateTask } from "@/services/task.api";
import type { ITask, TUpdateTaskData } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";

interface ITaskProgressUpdateProps extends THandlerComponentProps<TSingleHandlerStore<ITask, any>> {}

export default function TaskProgressUpdate({ storeKey, store }: ITaskProgressUpdateProps) {
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

  // Initialize progress when modal opens
  const [progress, setProgress] = useState<number>(
    response?.progress ?? 0
  );

  // Update progress when response changes
  useEffect(() => {
    if (response?.progress !== undefined && action === "updateProgress") {
      setProgress(response.progress);
    }
  }, [response?.progress, action]);

  const mutation = useMutation({
    mutationFn: (data: TUpdateTaskData) => {
      if (!response?.id) throw new Error("Task ID is required");
      return updateTask(response.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [storeKey] });
      queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
      toast.success(buildSentence(t, "task", "progress", "updated", "successfully"));
      startTransition(() => {
        reset();
        setAction("none");
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.message || buildSentence(t, "failed", "to", "update", "task", "progress"),
      );
    },
  });

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
      setProgress(0);
    });
  }, [reset, setAction, startTransition]);

  const handleUpdate = useCallback(() => {
    if (!response?.id) return;
    
    mutation.mutate({
      progress: progress,
    } as TUpdateTaskData);
  }, [response?.id, progress, mutation]);

  if (action !== "updateProgress" || !response) {
    return null;
  }

  return (
    <Dialog
      open={action === "updateProgress"}
      onOpenChange={(open) => !open && handleClose()}
      data-component-id={componentId}
    >
      <DialogContent>
        <AppDialog
          title={buildSentence(t, "update", "task", "progress")}
          description={buildSentence(t, "adjust", "the", "progress", "percentage", "for", "this", "task")}
          footerContent={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
                {buildSentence(t, "cancel")}
              </Button>
              <Button onClick={handleUpdate} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {buildSentence(t, "update")}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {buildSentence(t, "progress")}
                </label>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Slider
                value={[progress]}
                onValueChange={(value) => setProgress(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

