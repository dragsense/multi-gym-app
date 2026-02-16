// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId } from 'react';
import { useTransition } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Calendar, Link as LinkIcon, Megaphone, Image as ImageIcon, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";

// Types
import { type IAdvertisement } from "@shared/interfaces/advertisement.interface";
import { EAdvertisementStatus } from "@shared/enums/advertisement.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

export type TAdvertisementViewExtraProps = {}

interface IAdvertisementViewProps extends THandlerComponentProps<TSingleHandlerStore<IAdvertisement, TAdvertisementViewExtraProps>> {
}

const getStatusBadgeVariant = (status: EAdvertisementStatus) => {
  switch (status) {
    case EAdvertisementStatus.ACTIVE:
      return "default";
    case EAdvertisementStatus.DRAFT:
      return "secondary";
    case EAdvertisementStatus.INACTIVE:
      return "outline";
    case EAdvertisementStatus.EXPIRED:
      return "destructive";
    default:
      return "outline";
  }
};

const statusColors: Record<EAdvertisementStatus, string> = {
  [EAdvertisementStatus.ACTIVE]: "bg-green-100 text-green-800 border-green-200",
  [EAdvertisementStatus.INACTIVE]: "bg-gray-100 text-gray-800 border-gray-200",
  [EAdvertisementStatus.DRAFT]: "bg-blue-100 text-blue-800 border-blue-200",
  [EAdvertisementStatus.EXPIRED]: "bg-red-100 text-red-800 border-red-200",
};

export default function AdvertisementView({ storeKey, store }: IAdvertisementViewProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: advertisement, action, setAction, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        setAction: state.setAction,
        reset: state.reset,
    })));

    if (!advertisement) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (advertisement: IAdvertisement) => {
        startTransition(() => {
            setAction("createOrUpdate", advertisement.id);
        });
    };

    const onDelete = (advertisement: IAdvertisement) => {
        startTransition(() => {
            setAction("delete", advertisement.id);
        });
    };

    const onUpdateStatus = (advertisement: IAdvertisement) => {
        startTransition(() => {
            setAction("updateStatus", advertisement.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={t('advertisementDetails')}
                    description={t('viewDetailedInformationAboutThisAdvertisement')}
                >
                    <AdvertisementDetailContent 
                        advertisement={advertisement} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUpdateStatus={onUpdateStatus}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IAdvertisementDetailContentProps {
    advertisement: IAdvertisement;
    onEdit: (advertisement: IAdvertisement) => void;
    onDelete: (advertisement: IAdvertisement) => void;
    onUpdateStatus: (advertisement: IAdvertisement) => void;
}

function AdvertisementDetailContent({ advertisement, onEdit, onDelete, onUpdateStatus }: IAdvertisementDetailContentProps) {
    const componentId = useId();
    const { settings } = useUserSettings();
    const { t } = useI18n();
    const isExpired = new Date(advertisement.endDate) < new Date();

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {advertisement.title}
                            </h2>
                            <Badge className={cn(statusColors[advertisement.status], "text-xs")}>
                                {advertisement.status.replace('_', ' ')}
                            </Badge>
                            {isExpired && (
                                <Badge variant="destructive" className="text-xs">
                                    {t('expired') || 'Expired'}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateStatus(advertisement)}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {buildSentence(t, "update", "status")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(advertisement)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(advertisement)}
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
                        <Calendar className="w-4 h-4" />
                        <span>{t('startDate')}: {formatDateTime(advertisement.startDate, settings)}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{t('endDate')}: {formatDateTime(advertisement.endDate, settings)}</span>
                    </div>
                    {advertisement.websiteLink && (
                        <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                                <LinkIcon className="w-4 h-4" />
                                <a 
                                    href={advertisement.websiteLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {t('websiteLink')}
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </AppCard>

            {/* Advertisement Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "advertisement", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Megaphone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('title')}</div>
                                <div className="font-medium">{advertisement.title}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Megaphone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('status')}</div>
                                <div className="font-medium">
                                    <Badge className={cn(statusColors[advertisement.status], "text-xs")}>
                                        {advertisement.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        {advertisement.websiteLink && (
                            <div className="flex items-center gap-3">
                                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('websiteLink')}</div>
                                    <div className="font-medium">
                                        <a 
                                            href={advertisement.websiteLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-xs break-all"
                                        >
                                            {advertisement.websiteLink}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "schedule")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('startDate')}</div>
                                <div className="font-medium">{formatDateTime(advertisement.startDate, settings)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('endDate')}</div>
                                <div className="font-medium">{formatDateTime(advertisement.endDate, settings)}</div>
                            </div>
                        </div>
                        {advertisement.bannerImage && (
                            <div className="flex items-center gap-3">
                                <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('bannerImage')}</div>
                                    <div className="font-medium">{advertisement.bannerImage.name || t('na')}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Banner Image Preview */}
            {advertisement.bannerImage?.image?.url && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {t('bannerImagePreview')}
                    </h3>
                    <div className="flex justify-center">
                        <img
                            src={advertisement.bannerImage.image.url}
                            alt={advertisement.title}
                            className="max-w-full h-auto rounded-lg border border-gray-200"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
