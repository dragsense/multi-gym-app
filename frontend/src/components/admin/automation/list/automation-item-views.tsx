// External Libraries
import { type JSX } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Eye, Power } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import type { IAutomation } from "@shared/interfaces/automation.interface";
import { EAutomationStatus, EAutomationTrigger, EAutomationFormat } from "@shared/enums";
import type { IUser } from "@shared/interfaces";
import { EUserLevels } from "@shared/enums";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

const AutomationActions = ({
    automation,
    handleEdit,
    handleDelete,
    handleView,
    handleToggleStatus,
    componentId,
}: {
    automation: IAutomation;
    handleEdit?: (id: string) => void;
    handleDelete?: (id: string) => void;
    handleView?: (id: string) => void;
    handleToggleStatus?: (id: string) => void;
    componentId?: string;
}) => {
    const { t } = useI18n();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" data-component-id={componentId}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{buildSentence(t, "actions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {handleView && (
                    <DropdownMenuItem onClick={() => handleView(automation.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {buildSentence(t, "view", "details")}
                    </DropdownMenuItem>
                )}
                {handleEdit && (
                    <DropdownMenuItem onClick={() => handleEdit(automation.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {buildSentence(t, "edit")}
                    </DropdownMenuItem>
                )}
                {handleToggleStatus && (
                    <DropdownMenuItem onClick={() => handleToggleStatus(automation.id)}>
                        <Power className="h-4 w-4 mr-2" />
                        {automation.status === EAutomationStatus.ACTIVE
                            ? buildSentence(t, "deactivate")
                            : buildSentence(t, "activate")}
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {handleDelete && (
                    <DropdownMenuItem onClick={() => handleDelete(automation.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {buildSentence(t, "delete")}
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

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

export const automationItemViews = ({
    handleEdit,
    handleDelete,
    handleView,
    handleToggleStatus,
    componentId,
}: {
    handleEdit?: (id: string) => void;
    handleDelete?: (id: string) => void;
    handleView?: (id: string) => void;
    handleToggleStatus?: (id: string) => void;
    componentId?: string;
}) => {
    const { t } = useI18n();

    const columns: ColumnDef<IAutomation>[] = [
        {
            accessorKey: "name",
            header: buildSentence(t, "template", "name"),
            cell: ({ row }) => {
                const automation = row.original;
                const templateName = typeof automation.emailTemplate === "object"
                    ? automation.emailTemplate?.name
                    : automation.name;
                return <div className="font-medium">{templateName || automation.name || "-"}</div>;
            },
        },
        {
            accessorKey: "trigger",
            header: buildSentence(t, "trigger"),
            cell: ({ row }) => {
                const automation = row.original;
                return (
                    <Badge variant="outline">
                        {automation.trigger ? formatTrigger(automation.trigger, t) : "-"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "status",
            header: buildSentence(t, "status"),
            cell: ({ row }) => {
                const automation = row.original;
                const isActive = automation.status === EAutomationStatus.ACTIVE;
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "format",
            header: buildSentence(t, "format"),
            cell: ({ row }) => {
                const automation = row.original;
                return (
                    <Badge variant="outline">
                        {automation.format ? formatFormat(automation.format, t) : "-"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: buildSentence(t, "actions"),
            cell: ({ row }) => {
                const automation = row.original;
                return (
                    <AutomationActions
                        automation={automation}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        handleView={handleView}
                        handleToggleStatus={handleToggleStatus}
                        componentId={componentId}
                    />
                );
            },
        },
    ];

    const listItem = (automation: IAutomation, currentUser?: IUser | null): JSX.Element => {
        const templateName = typeof automation.emailTemplate === "object"
            ? automation.emailTemplate?.name
            : automation.name;
        const isActive = automation.status === EAutomationStatus.ACTIVE;
        const isAdmin = currentUser?.level && currentUser.level <= EUserLevels.ADMIN;

        return (
            <AppCard key={automation.id} className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{templateName || automation.name}</h3>
                            <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
                            </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            {automation.trigger && (
                                <span>{buildSentence(t, "trigger")}: {formatTrigger(automation.trigger, t)}</span>
                            )}
                            {automation.format && (
                                <span>{buildSentence(t, "format")}: {formatFormat(automation.format, t)}</span>
                            )}
                        </div>
                    </div>
                    <AutomationActions
                        automation={automation}
                        handleEdit={isAdmin ? handleEdit : undefined}
                        handleDelete={isAdmin ? handleDelete : undefined}
                        handleView={handleView}
                        handleToggleStatus={isAdmin ? handleToggleStatus : undefined}
                        componentId={componentId}
                    />
                </div>
            </AppCard>
        );
    };

    return { columns, listItem };
};
