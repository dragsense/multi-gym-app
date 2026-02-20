// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useTransition, useState } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IAutomation } from "@shared/interfaces/automation.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { deleteAutomation } from "@/services/automation.api";
import { Badge } from "@/components/ui/badge";
import { EAutomationStatus, EAutomationTrigger, EAutomationFormat } from "@shared/enums";

export type TAutomationDeleteExtraProps = Record<string, unknown>;

type IAutomationDeleteProps = THandlerComponentProps<
    TSingleHandlerStore<IAutomation, TAutomationDeleteExtraProps>
>;

// Helper to format trigger display name
const formatTrigger = (trigger: EAutomationTrigger, t: (key: string) => string): string => {
    const triggerLabels: Record<EAutomationTrigger, string> = {
        [EAutomationTrigger.ONBOARD]: buildSentence(t, "onboard"),
        [EAutomationTrigger.BILLING]: buildSentence(t, "billing"),
        [EAutomationTrigger.CHECKIN]: buildSentence(t, "check-in"),
        [EAutomationTrigger.CHECKOUT]: buildSentence(t, "check-out"),
        [EAutomationTrigger.MEMBERSHIP_RENEWAL]: buildSentence(t, "membership", "renewal"),
    };
    return triggerLabels[trigger] || trigger;
};

export default function AutomationDelete({
    storeKey,
    store,
}: IAutomationDeleteProps) {
    // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const { t } = useI18n();

    // Always call hooks unconditionally - create selector first
    const selector = useShallow(
        (state: ISingleHandlerState<IAutomation, TAutomationDeleteExtraProps>) => ({
            action: state.action,
            response: state.response,
            setAction: state.setAction,
            reset: state.reset,
        })
    );

    const storeState = store ? store(selector) : null;
    const automation = storeState?.response;

    const handleClose = useCallback(() => {
        if (!storeState) return;
        startTransition(() => {
            setError(null);
            storeState.reset();
            storeState.setAction("none");
        });
    }, [storeState, startTransition]);

    const deleteMutation = useApiMutation(
        async (id: string) => {
            const result = await deleteAutomation(id);
            return result;
        },
        {
            onSuccess: () => {
                startTransition(() => {
                    queryClient.invalidateQueries({
                        queryKey: [storeKey],
                    });
                    queryClient.invalidateQueries({
                        queryKey: [storeKey + "-list"],
                    });
                    handleClose();
                });
            },
            onError: (error: Error) => {
                startTransition(() => {
                    setError(error?.message || "Failed to delete automation");
                });
            },
        }
    );

    const handleConfirm = useCallback(() => {
        if (!automation?.id) return;
        deleteMutation.mutate(automation.id);
    }, [automation, deleteMutation]);

    // Get template name
    const templateName = typeof automation?.emailTemplate === "object"
        ? automation.emailTemplate?.name
        : automation?.name;

    // Early returns AFTER all hooks
    if (!store) {
        return (
            <div>
                {buildSentence(t, "single", "store")} "{storeKey}"{" "}
                {buildSentence(t, "not", "found")}.{" "}
                {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
            </div>
        );
    }

    if (!automation) {
        return null;
    }

    const { action } = storeState!;
    const isOpen = action === "delete";

    if (!isOpen) {
        return null;
    }

    const isActive = automation.status === EAutomationStatus.ACTIVE;

    return (
        <AlertDialog open={isOpen} onOpenChange={handleClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <AlertDialogTitle>
                                {buildSentence(t, "delete", "automation")}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-1">
                                {buildSentence(
                                    t,
                                    "are",
                                    "you",
                                    "sure you want to delete this automation"
                                )}
                                ? {buildSentence(t, "this", "action", "cannot", "be", "undone")}.
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="space-y-3 py-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="text-sm">
                            <div className="font-medium text-red-900 mb-2">
                                {templateName || automation.name}
                            </div>
                            <div className="text-red-700 space-y-1">
                                {automation.trigger && (
                                    <div className="flex items-center gap-2">
                                        {buildSentence(t, "trigger")}:{" "}
                                        <Badge variant="outline">{formatTrigger(automation.trigger, t)}</Badge>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {buildSentence(t, "status")}:{" "}
                                    <Badge variant={isActive ? "default" : "secondary"}>
                                        {isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 mt-2">{error}</div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={handleClose}
                        disabled={deleteMutation.isPending}
                    >
                        {t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {deleteMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {buildSentence(t, "delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
