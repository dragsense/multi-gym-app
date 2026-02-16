// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useTransition } from "react";
import { useNavigate } from "react-router-dom";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Pencil, ExternalLink, Eye, EyeOff } from "lucide-react";

// Types
import type { IPage } from "@shared/interfaces/cms.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { ADMIN_ROUTES, PUBLIC_ROUTES, SEGMENTS } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";

export type TPageViewExtraProps = Record<string, unknown>;

type IPageViewProps = THandlerComponentProps<
  TSingleHandlerStore<IPage, TPageViewExtraProps>
>;

export default function PageView({ storeKey, store }: IPageViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<IPage, TPageViewExtraProps>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const { response: page, action, setAction, reset } = store ? store(selector) : { response: null, action: null, setAction: () => {}, reset: () => {} };

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const handleEdit = () => {
    if (!user || !page?.id) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      reset();
      navigate(`${segment}/${ADMIN_ROUTES.CMS.PAGE_EDIT.replace(":id", page.id)}`);
    });
  };

  const handlePreview = () => {
    if (!user || !page?.id) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      reset();
      navigate(`${segment}/${ADMIN_ROUTES.CMS.PAGE_PREVIEW.replace(":id", page.id)}`);
    });
  };

  const handlePublishToggle = () => {
    if (!page?.id) return;
    startTransition(() => {
      setAction(page.isPublished ? "draft" : "publish", page.id);
    });
  };

  
  if (!page) {
    return null;
  }

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "page", "details")}
          description={buildSentence(t, "view", "detailed", "information", "about", "this", "page")}
        >
          <div className="space-y-4" data-component-id={componentId}>
            <AppCard
              header={
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold truncate">
                      {page.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {page.isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t("preview")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePublishToggle}
                      className="gap-2"
                    >
                      {page.isPublished ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          {t("draft")}
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          {t("publish")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      {buildSentence(t, "edit")}
                    </Button>
                  </div>
                </div>
              }
            >
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4" />
                  <span>{page.slug}</span>
                </div>
              </div>
            </AppCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {buildSentence(t, "page", "information")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{t("title")}</div>
                      <div className="font-medium">{page.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{t("slug")}</div>
                      <div className="font-medium">{page.slug}</div>
                    </div>
                  </div>
                  {page.description && (
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("description")}
                        </div>
                        <div className="font-medium">{page.description}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{t("status")}</div>
                      <div className="font-medium">
                        {page.isPublished ? t("published") : t("unpublished")}
                      </div>
                    </div>
                  </div>
                  {page.publishedAt && (
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("publishedAt")}
                        </div>
                        <div className="font-medium">
                          {new Date(page.publishedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {page.isSystem && (
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("type")}
                        </div>
                        <div className="font-medium">{t("systemPage")}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
