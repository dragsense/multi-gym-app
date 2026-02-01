// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useTransition } from "react";
import { useNavigate } from "react-router-dom";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { Mail, Pencil, ExternalLink, Power, PowerOff } from "lucide-react";

// Types
import type { IEmailTemplate } from "@shared/interfaces/cms.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";

export type TEmailTemplateViewExtraProps = Record<string, unknown>;

type IEmailTemplateViewProps = THandlerComponentProps<
  TSingleHandlerStore<IEmailTemplate, TEmailTemplateViewExtraProps>
>;

export default function EmailTemplateView({ storeKey, store }: IEmailTemplateViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  // Always call hooks unconditionally - extract values directly
  const selector = useShallow(
    (state: ISingleHandlerState<IEmailTemplate, TEmailTemplateViewExtraProps>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const { response: template, action, setAction, reset } = store ? store(selector) : { response: null, action: null, setAction: () => {}, reset: () => {} };

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const handleEdit = () => {
    if (!user || !template.id) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      reset();
      navigate(`${segment}/${ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_EDIT.replace(":id", template.id)}`);
    });
  };

  const handlePreview = () => {
    if (!user || !template.id) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      reset();
      navigate(`${segment}/${ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_PREVIEW.replace(":id", template.id)}`);
    });
  };

  const handleActivateToggle = () => {
    if (!template?.id) return;
    startTransition(() => {
      setAction(template.isActive ? "deactivate" : "activate", template.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "emailTemplate", "details")}
          description={buildSentence(t, "view", "detailed", "information", "about", "this", "emailTemplate")}
        >
          <div className="space-y-4" data-component-id={componentId}>
            <AppCard
              header={
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold truncate">
                      {template.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t("preview")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleActivateToggle}
                      className="gap-2"
                    >
                      {template.isActive ? (
                        <>
                          <PowerOff className="w-4 h-4" />
                          {t("deactivate")}
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4" />
                          {t("activate")}
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
                  <Mail className="w-4 h-4" />
                  <span>{template.identifier}</span>
                </div>
              </div>
            </AppCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {buildSentence(t, "emailTemplate", "information")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{t("name")}</div>
                      <div className="font-medium">{template.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {t("identifier")}
                      </div>
                      <div className="font-medium">{template.identifier}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {t("subject")}
                      </div>
                      <div className="font-medium">{template.subject}</div>
                    </div>
                  </div>
                  {template.description && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("description")}
                        </div>
                        <div className="font-medium">{template.description}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{t("status")}</div>
                      <div className="font-medium">
                        {template.isActive ? t("active") : t("inactive")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {template.availableVariables &&
                template.availableVariables.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {t("availableVariables")}
                    </h3>
                    <div className="space-y-2">
                      {template.availableVariables.map((variable, index) => (
                        <div key={index} className="text-sm">
                          <code className="bg-muted px-2 py-1 rounded">
                            {`{{${variable}}}`}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
