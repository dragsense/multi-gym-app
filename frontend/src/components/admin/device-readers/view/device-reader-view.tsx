// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId } from 'react';
import { useTransition } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Radio, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";

// Types
import { type IDeviceReader } from "@shared/interfaces/device-reader.interface";
import { EDeviceReaderStatus } from "@shared/enums/device-reader.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";

export type TDeviceReaderViewExtraProps = {}

interface IDeviceReaderViewProps extends THandlerComponentProps<TSingleHandlerStore<IDeviceReader, TDeviceReaderViewExtraProps>> {
}

const statusColors: Record<EDeviceReaderStatus, string> = {
  [EDeviceReaderStatus.ACTIVE]: "bg-green-100 text-green-800",
  [EDeviceReaderStatus.INACTIVE]: "bg-gray-100 text-gray-800",
  [EDeviceReaderStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
};

export default function DeviceReaderView({ storeKey, store }: IDeviceReaderViewProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: deviceReader, action, setAction, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        setAction: state.setAction,
        reset: state.reset,
    })));

    if (!deviceReader) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (deviceReader: IDeviceReader) => {
        startTransition(() => {
            setAction("createOrUpdate", deviceReader.id);
        });
    };

    const onDelete = (deviceReader: IDeviceReader) => {
        startTransition(() => {
            setAction("delete", deviceReader.id);
        });
    };

    const onUpdateStatus = (deviceReader: IDeviceReader) => {
        startTransition(() => {
            setAction("updateStatus", deviceReader.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={t('deviceReaderDetails')}
                    description={t('viewDetailedInformationAboutThisDeviceReader')}
                >
                    <DeviceReaderDetailContent 
                        deviceReader={deviceReader} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUpdateStatus={onUpdateStatus}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IDeviceReaderDetailContentProps {
    deviceReader: IDeviceReader;
    onEdit: (deviceReader: IDeviceReader) => void;
    onDelete: (deviceReader: IDeviceReader) => void;
    onUpdateStatus: (deviceReader: IDeviceReader) => void;
}

function DeviceReaderDetailContent({ deviceReader, onEdit, onDelete, onUpdateStatus }: IDeviceReaderDetailContentProps) {
    const componentId = useId();
    const { t } = useI18n();

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {deviceReader.deviceName}
                            </h2>
                            <Badge className={cn(statusColors[deviceReader.status], "text-xs")}>
                                {deviceReader.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateStatus(deviceReader)}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {buildSentence(t, "update", "status")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(deviceReader)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(deviceReader)}
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
                        <Radio className="w-4 h-4" />
                        <span>{deviceReader.macAddress}</span>
                    </div>
                </div>
            </AppCard>

            {/* Device Reader Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "device", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Radio className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('deviceName')}</div>
                                <div className="font-medium">{deviceReader.deviceName}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Radio className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('macAddress')}</div>
                                <div className="font-medium">{deviceReader.macAddress}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Radio className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('status')}</div>
                                <Badge className={cn(statusColors[deviceReader.status], "text-xs")}>
                                    {deviceReader.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

