// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId } from 'react';
import { useTransition } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Building2, Mail, Phone, MapPin, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";

// Types
import { type IFacilityInfo } from "@shared/interfaces/facility-info.interface";
import { EFacilityInfoStatus } from "@shared/enums/facility-info.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";

export type TFacilityInfoViewExtraProps = {}

interface IFacilityInfoViewProps extends THandlerComponentProps<TSingleHandlerStore<IFacilityInfo, TFacilityInfoViewExtraProps>> {
}

const statusColors: Record<EFacilityInfoStatus, string> = {
  [EFacilityInfoStatus.ACTIVE]: "bg-green-100 text-green-800",
  [EFacilityInfoStatus.INACTIVE]: "bg-gray-100 text-gray-800",
};

export default function FacilityInfoView({ storeKey, store }: IFacilityInfoViewProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: facilityInfo, action, setAction, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        setAction: state.setAction,
        reset: state.reset,
    })));

    if (!facilityInfo) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (facilityInfo: IFacilityInfo) => {
        startTransition(() => {
            setAction("createOrUpdate", facilityInfo.id);
        });
    };

    const onDelete = (facilityInfo: IFacilityInfo) => {
        startTransition(() => {
            setAction("delete", facilityInfo.id);
        });
    };

    const onUpdateStatus = (facilityInfo: IFacilityInfo) => {
        startTransition(() => {
            setAction("updateStatus", facilityInfo.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={t('facilityInfoDetails')}
                    description={t('viewDetailedInformationAboutThisFacility')}
                >
                    <FacilityInfoDetailContent 
                        facilityInfo={facilityInfo} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUpdateStatus={onUpdateStatus}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IFacilityInfoDetailContentProps {
    facilityInfo: IFacilityInfo;
    onEdit: (facilityInfo: IFacilityInfo) => void;
    onDelete: (facilityInfo: IFacilityInfo) => void;
    onUpdateStatus: (facilityInfo: IFacilityInfo) => void;
}

function FacilityInfoDetailContent({ facilityInfo, onEdit, onDelete, onUpdateStatus }: IFacilityInfoDetailContentProps) {
    const componentId = useId();
    const { t } = useI18n();

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-2xl font-semibold truncate">
                                {t('facilityInfo')}
                            </h2>
                            <Badge className={cn(statusColors[facilityInfo.status], "text-xs")}>
                                {facilityInfo.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateStatus(facilityInfo)}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {buildSentence(t, "update", "status")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(facilityInfo)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(facilityInfo)}
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
                    <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span>{facilityInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        <span>{facilityInfo.phone}</span>
                    </div>
                </div>
            </AppCard>

            {/* Facility Info Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "facility", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('email')}</div>
                                <div className="font-medium">{facilityInfo.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('phone')}</div>
                                <div className="font-medium">{facilityInfo.phone}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('address')}</div>
                                <div className="font-medium">{facilityInfo.address}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('status')}</div>
                                <Badge className={cn(statusColors[facilityInfo.status], "text-xs")}>
                                    {facilityInfo.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

