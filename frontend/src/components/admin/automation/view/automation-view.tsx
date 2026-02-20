// External Libraries
import { useId, useTransition, useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { Edit, Trash2, Power, Zap, Mail, FileText } from "lucide-react";

// Types
import type { IAutomation } from "@shared/interfaces/automation.interface";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TSingleHandlerStore } from "@/stores";
import type { ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels, EAutomationStatus, EAutomationTrigger, EAutomationFormat } from "@shared/enums";

export type TAutomationViewExtraProps = Record<string, unknown>;

type IAutomationViewProps = THandlerComponentProps<
    TSingleHandlerStore<IAutomation, TAutomationViewExtraProps>
>;

export default function AutomationView({ storeKey, store }: IAutomationViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();
    const { user } = useAuthUser();

    // Always call hooks unconditionally - create selector first
    const selector = useShallow(
        (state: ISingleHandlerState<IAutomation, TAutomationViewExtraProps>) => ({
            response: state.response,
            action: state.action,
            setAction: state.setAction,
            reset: state.reset,
        })
    );

    const storeState = store ? store(selector) : null;

    if (!store) {
        return (
            <div>
                {buildSentence(t, "single", "store")} "{storeKey}"{" "}
                {buildSentence(t, "not", "found")}.{" "}
                {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
            </div>
        );
    }

    if (!storeState) {
        return null;
    }

    const { response: automation, action, setAction, reset } = storeState;

    const handleCloseView = useCallback(() => {
        startTransition(() => reset());
    }, [reset, startTransition]);

    const onEdit = useCallback((automation: IAutomation) => {
        startTransition(() => {
            setAction("createOrUpdate", automation.id);
        });
    }, [setAction, startTransition]);

    const onDelete = useCallback((automation: IAutomation) => {
        startTransition(() => {
            setAction("delete", automation.id);
        });
    }, [setAction, startTransition]);

    const onToggleStatus = useCallback((automation: IAutomation) => {
        startTransition(() => {
            setAction("toggleStatus", automation.id);
        });
    }, [setAction, startTransition]);

    if (!automation) {
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
                    title={buildSentence(t, "automation", "details")}
                    description={buildSentence(t, "view", "detailed", "information", "about", "this", "automation")}
                >
                    <AutomationDetailContent
                        automation={automation}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleStatus={onToggleStatus}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IAutomationDetailContentProps {
    automation: IAutomation;
    onEdit: (automation: IAutomation) => void;
    onDelete: (automation: IAutomation) => void;
    onToggleStatus: (automation: IAutomation) => void;
}

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

// Helper to format format display name
const formatFormat = (format: EAutomationFormat, t: (key: string) => string): string => {
    const formatLabels: Record<EAutomationFormat, string> = {
        [EAutomationFormat.EMAIL]: buildSentence(t, "email"),
    };
    return formatLabels[format] || format;
};

function AutomationDetailContent({
    automation,
    onEdit,
    onDelete,
    onToggleStatus,
}: IAutomationDetailContentProps) {
    const componentId = useId();
    const { t } = useI18n();
    const { user } = useAuthUser();

    const isActive = automation.status === EAutomationStatus.ACTIVE;
    const templateName = typeof automation.emailTemplate === "object"
        ? automation.emailTemplate?.name
        : automation.name;

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">{templateName || automation.name}</h2>
                            <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
                            </Badge>
                        </div>
                        {user?.level && user.level <= EUserLevels.ADMIN && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onToggleStatus(automation)}
                                    className="gap-2"
                                >
                                    <Power className="w-4 h-4" />
                                    {isActive ? buildSentence(t, "deactivate") : buildSentence(t, "activate")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(automation)}
                                    className="gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    {buildSentence(t, "edit")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDelete(automation)}
                                    className="gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {buildSentence(t, "delete")}
                                </Button>
                            </div>
                        )}
                    </div>
                }
            >
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>{buildSentence(t, "automation")}</span>
                    {automation.trigger && (
                        <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-4 h-4" />
                                <span>{formatTrigger(automation.trigger, t)}</span>
                            </div>
                        </>
                    )}
                    {automation.format && (
                        <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" />
                                <span>{formatFormat(automation.format, t)}</span>
                            </div>
                        </>
                    )}
                </div>
            </AppCard>

            {/* Automation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "automation", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, "trigger")}
                                </div>
                                <div className="font-medium">
                                    <Badge variant="outline">
                                        {automation.trigger ? formatTrigger(automation.trigger, t) : "-"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, "format")}
                                </div>
                                <div className="font-medium">
                                    <Badge variant="outline">
                                        {automation.format ? formatFormat(automation.format, t) : "-"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Power className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, "status")}
                                </div>
                                <div className="font-medium">
                                    <Badge variant={isActive ? "default" : "secondary"}>
                                        {isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "template", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, "template", "name")}
                                </div>
                                <div className="font-medium">{templateName || "-"}</div>
                            </div>
                        </div>
                        {typeof automation.emailTemplate === "object" && automation.emailTemplate?.subject && (
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, "subject")}
                                    </div>
                                    <div className="font-medium">{automation.emailTemplate.subject}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
