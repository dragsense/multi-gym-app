import { useId, useTransition, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/shallow";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { completeTask } from "@/services/task.api";
import type { ITask } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ITaskCompleteProps extends THandlerComponentProps<TSingleHandlerStore<ITask, any>> { }

export default function TaskComplete({ storeKey, store }: ITaskCompleteProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const { t } = useI18n();

    if (!store) {
        return null;
    }

    const { action, response, isLoading, setAction, reset } = store(
        useShallow((state) => ({
            action: state.action,
            response: state.response,
            isLoading: state.isLoading,
            setAction: state.setAction,
            reset: state.reset,
        }))
    );

    const mutation = useMutation({
        mutationFn: (taskId: string) => completeTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [storeKey] });
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
            toast.success(buildSentence(t, "task", "completed", "successfully"));
            startTransition(() => {
                reset();
                setAction("none");
            });
        },
        onError: (error: any) => {
            toast.error(
                error?.message || buildSentence(t, "failed", "to", "complete", "task"),
            );
        },
    });

    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction("none");
        });
    }, [reset, setAction, startTransition]);

    const handleComplete = useCallback(() => {
        if (response?.id) {
            mutation.mutate(response.id);
        }
    }, [response?.id, mutation]);

    if (action !== "completeTask" || !response) {
        return null;
    }

    return (
        <Dialog
            open={action === "completeTask"}
            onOpenChange={(open) => !open && handleClose()}
            data-component-id={componentId}
        >
            <DialogContent>
                <AppDialog
                    title={buildSentence(t, "complete", "task")}
                    description={buildSentence(t, "are", "you", "sure", "you", "want", "to", "mark", "this", "task", "as", "completed")}
                    footerContent={
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
                                {buildSentence(t, "cancel")}
                            </Button>
                            <Button onClick={handleComplete} disabled={mutation.isPending}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {buildSentence(t, "complete", "task")}
                            </Button>
                        </div>
                    }
                >
                    <div></div>
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

