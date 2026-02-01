// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId, useMemo, useTransition } from 'react';

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import {
  Package,
  Calendar,
  Hash,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";

// Types
import { type IEquipment } from "@shared/interfaces/equipment-reservation.interface";
import { EEquipmentStatus } from "@shared/enums";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";

export type TEquipmentViewExtraProps = {};

interface IEquipmentViewProps extends THandlerComponentProps<TSingleHandlerStore<IEquipment, TEquipmentViewExtraProps>> {
}

export default function EquipmentView({ storeKey, store }: IEquipmentViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const { response: equipment, action, reset, setAction } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        reset: state.reset,
        setAction: state.setAction,
    })));

    if (!equipment) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (equipment: IEquipment) => {
        startTransition(() => {
            setAction('createOrUpdate', equipment.id);
        });
    };

    const onDelete = (equipment: IEquipment) => {
        startTransition(() => {
            setAction('delete', equipment.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={buildSentence(t, 'equipment', 'details')}
                    description={buildSentence(t, 'view', 'detailed', 'information', 'about', 'this', 'equipment')}
                >
                    <EquipmentDetailContent 
                        equipment={equipment} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IEquipmentDetailContentProps {
    equipment: IEquipment;
    onEdit: (equipment: IEquipment) => void;
    onDelete: (equipment: IEquipment) => void;
}

function EquipmentDetailContent({ equipment, onEdit, onDelete }: IEquipmentDetailContentProps) {
    // React 19: Essential IDs
    const componentId = useId();
    const { t } = useI18n();
    const { settings } = useUserSettings();

    const createdAt = useMemo(
        () => (equipment.createdAt ? formatDate(equipment.createdAt, settings) : ""),
        [equipment.createdAt, settings]
    );

    const updatedAt = useMemo(
        () => (equipment.updatedAt ? formatDate(equipment.updatedAt, settings) : ""),
        [equipment.updatedAt, settings]
    );

    return (
        <div className="space-y-4" data-component-id={componentId}>
            {/* Header Card */}
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {equipment.name}
                            </h2>
                            {equipment.status && (() => {
                                const status = equipment.status;
                                const statusColors: Record<string, string> = {
                                    [EEquipmentStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
                                    [EEquipmentStatus.AVAILABLE]: "bg-green-100 text-green-800",
                                    [EEquipmentStatus.NOT_AVAILABLE]: "bg-red-100 text-red-800",
                                };
                                const statusLabels: Record<string, string> = {
                                    [EEquipmentStatus.MAINTENANCE]: t('maintenance'),
                                    [EEquipmentStatus.AVAILABLE]: t('available'),
                                    [EEquipmentStatus.NOT_AVAILABLE]: t('not', 'available'),
                                };
                                return (
                                    <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
                                        {statusLabels[status] || status}
                                    </Badge>
                                );
                            })()}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(equipment)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(equipment)}
                                className="gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {buildSentence(t, "delete")}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {equipment.equipmentType && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Package className="w-4 h-4" />
                                <span className="font-semibold text-foreground">
                                    {equipment.equipmentType.name}
                                </span>
                            </div>
                            <span>•</span>
                        </>
                    )}
                    {createdAt && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{buildSentence(t, 'created', 'on')} {createdAt}</span>
                            </div>
                        </>
                    )}
                </div>
            </AppCard>

            {/* Equipment Details - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'equipment', 'information')}
                    </h3>
                    <div className="space-y-3">
                        {equipment.equipmentType && (
                            <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'equipment', 'type')}
                                    </div>
                                    <div className="font-medium">{equipment.equipmentType.name}</div>
                                    {equipment.equipmentType.description && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {equipment.equipmentType.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {equipment.serialNumber && (
                            <div className="flex items-center gap-3">
                                <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'serial', 'number')}
                                    </div>
                                    <div className="font-medium font-mono text-sm">{equipment.serialNumber}</div>
                                </div>
                            </div>
                        )}

                        {equipment.status && (
                            <div className="flex items-center gap-3">
                                {equipment.status === EEquipmentStatus.AVAILABLE ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                ) : equipment.status === EEquipmentStatus.MAINTENANCE ? (
                                    <XCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                                )}
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'status')}
                                    </div>
                                    <div className="font-medium">
                                        {equipment.status === EEquipmentStatus.MAINTENANCE ? t('maintenance') :
                                         equipment.status === EEquipmentStatus.AVAILABLE ? t('available') :
                                         equipment.status === EEquipmentStatus.NOT_AVAILABLE ? t('not', 'available') :
                                         equipment.status}
                                    </div>
                                </div>
                            </div>
                        )}

                        {equipment.description && (
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {buildSentence(t, 'description')}
                                    </div>
                                    <div className="text-sm">{equipment.description}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'metadata')}
                    </h3>
                    <div className="space-y-3">
                        {createdAt && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'created', 'at')}
                                    </div>
                                    <div className="font-medium">{createdAt}</div>
                                </div>
                            </div>
                        )}
                        {updatedAt && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'updated', 'at')}
                                    </div>
                                    <div className="font-medium">{updatedAt}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
