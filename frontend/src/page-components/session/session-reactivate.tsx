// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useTransition, useState } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISession } from "@shared/interfaces/session.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Services
import { reactivateSession } from "@/services/session.api";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { formatDate, formatTime } from "@/lib/utils";
import { useApiMutation } from "@/hooks/use-api-mutation";

export type TSessionReactivateExtraProps = Record<string, unknown>;

type ISessionReactivateProps = THandlerComponentProps<
    TSingleHandlerStore<ISession, TSessionReactivateExtraProps>
>;

export default function SessionReactivate({ storeKey, store }: ISessionReactivateProps) {
    // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const { settings } = useUserSettings();
    const [error, setError] = useState('');
    const { t } = useI18n();

    // Always call hooks unconditionally - create selector first
    const selector = useShallow((state: ISingleHandlerState<ISession, TSessionReactivateExtraProps>) => ({
        action: state.action,
        response: state.response,
        setAction: state.setAction,
        reset: state.reset,
    }));

    const storeState = store ? store(selector) : null;
    const session = storeState?.response;

    const handleClose = useCallback(() => {
        if (!storeState) return;
        startTransition(() => {
            setError("");
            storeState.reset();
            storeState.setAction("none");
        });
    }, [storeState, startTransition]);

    const reactivateMutation = useApiMutation(
        async (id: string) => {
            const result = await reactivateSession(id);
            return result;
        },
        {
            onSuccess: () => {
                startTransition(() => {
                    queryClient.invalidateQueries({
                        queryKey: [storeKey + "-calendar"],
                    });
                    handleClose();
                });
            },
            onError: (error: Error) => {
                startTransition(() => {
                    setError(error?.message)
                })
            }
        }
    );

    const handleConfirm = useCallback(() => {
        if (!session?.id) return;
        reactivateMutation.mutate(session.id);
    }, [session, reactivateMutation]);

    const sessionStartDate = useMemo(
        () =>
            session?.startDateTime ? formatDate(session.startDateTime, settings) : "",
        [session?.startDateTime, settings]
    );

    const sessionStartTime = useMemo(
        () =>
            session?.startDateTime ? formatTime(session.startDateTime, settings) : "",
        [session?.startDateTime, settings]
    );

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

    if (!session) {
        return null;
    }

    const { action } = storeState!;

    return (
        <>
            <Dialog open={action === "reactivate"} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {buildSentence(t, "reactivate", "session")}
                        </DialogTitle>
                        <DialogDescription>
                            {buildSentence(t, "are", "you", "sure", "you", "want", "to", "reactivate", "this", "session")}?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-4">
                        <div className="text-sm">
                            <div className="font-medium mb-2">{session.title}</div>
                            <div className="text-muted-foreground">
                                <div>
                                    {sessionStartDate} at {sessionStartTime}
                                </div>
                                {session.duration && (
                                    <div>
                                        {session.duration} {t("minutes")}
                                    </div>
                                )}
                            </div>
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 mt-2">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={reactivateMutation.isPending}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            onClick={handleConfirm}
                            disabled={reactivateMutation.isPending}
                        >
                            {reactivateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {buildSentence(t, "reactivate", "session")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

