// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useTransition, useState } from "react";

// Types
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IPage } from "@shared/interfaces/cms.interface";
import type { TUpdatePageData } from "@shared/types/cms.type";

// Store
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";

// Services
import { updatePage } from "@/services/cms.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";

export type TPagePublishExtraProps = Record<string, unknown>;

type IPagePublishProps = THandlerComponentProps<
  TSingleHandlerStore<IPage, TPagePublishExtraProps>
>;

export default function PagePublish({ storeKey, store }: IPagePublishProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<IPage, TPagePublishExtraProps>) => ({
      action: state.action,
      response: state.response,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;
  const page = storeState?.response;

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError("");
      storeState.reset();
      storeState.setAction("none");
    });
  }, [storeState, startTransition]);

  const publishMutation = useApiMutation(
    async (data: TUpdatePageData) => {
      if (!page?.id) throw new Error("Page ID is required");
      return updatePage(page.id)(data);
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
          setError(
            error?.message || buildSentence(t, "failed", "to", "update", "page", "status")
          );
        });
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!page?.id) return;
    publishMutation.mutate({
      isPublished: !page.isPublished,
      ...(page.isPublished ? {} : { publishedAt: new Date().toISOString() }),
    } as TUpdatePageData);
  }, [page, publishMutation]);

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

  if (!page) {
    return null;
  }

  const { action } = storeState!;
  const isPublishing = !page.isPublished;

  return (
    <Dialog
      open={action === "publish" || action === "draft"}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="max-w-md">
        <AppDialog
          title={
            isPublishing
              ? buildSentence(t, "publish", "page")
              : buildSentence(t, "draft", "page")
          }
          description={
            isPublishing
              ? buildSentence(t, "are", "you", "sure", "you", "want", "to", "publish", "this", "page") + "?"
              : buildSentence(t, "are", "you", "sure", "you", "want", "to", "draft", "this", "page") + "?"
          }
          footerContent={
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={publishMutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isPublishing
                  ? buildSentence(t, "publish")
                  : buildSentence(t, "draft")}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-4">
            <div className="text-sm">
              <div className="font-medium mb-2">{page.title}</div>
              <div className="text-muted-foreground">
                <div>{page.slug}</div>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-500 mt-2">{error}</div>
            )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
