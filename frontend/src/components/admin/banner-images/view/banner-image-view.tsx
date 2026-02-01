// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId, useState } from 'react';
import { useTransition } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Image as ImageIcon, Calendar, FileImage, Pencil, Trash2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildSentence } from "@/locales/translations";

// Types
import { type IBannerImage } from "@shared/interfaces/advertisement.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";

export type TBannerImageViewExtraProps = {}

interface IBannerImageViewProps extends THandlerComponentProps<TSingleHandlerStore<IBannerImage, TBannerImageViewExtraProps>> {
}

export default function BannerImageView({ storeKey, store }: IBannerImageViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: bannerImage, action, setAction, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        setAction: state.setAction,
        reset: state.reset,
    })));

    if (!bannerImage) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (bannerImage: IBannerImage) => {
        startTransition(() => {
            setAction("createOrUpdate", bannerImage.id);
        });
    };

    const onDelete = (bannerImage: IBannerImage) => {
        startTransition(() => {
            setAction("delete", bannerImage.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={t('bannerImageDetails')}
                    description={t('viewDetailedInformationAboutThisBannerImage')}
                >
                    <BannerImageDetailContent 
                        bannerImage={bannerImage} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IBannerImageDetailContentProps {
    bannerImage: IBannerImage;
    onEdit: (bannerImage: IBannerImage) => void;
    onDelete: (bannerImage: IBannerImage) => void;
}

// Component for image URL with copy functionality
function ImageUrlCell({ imageUrl, t }: { imageUrl: string; t: (key: string) => string }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy: ', err);
            return false;
        }
    };

    const handleCopy = async () => {
        const success = await copyToClipboard(imageUrl);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">{t('imageUrl')}</div>
                <div className="flex items-center gap-2">
                    <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-xs text-primary hover:underline break-all"
                        title={imageUrl}
                    >
                        {imageUrl}
                    </a>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-6 w-6 p-0 hover:bg-gray-100 flex-shrink-0"
                        title={t('copy') || 'Copy URL'}
                    >
                        {copied ? (
                            <Check className="h-3 w-3 text-green-600" />
                        ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function BannerImageDetailContent({ bannerImage, onEdit, onDelete }: IBannerImageDetailContentProps) {
    // React 19: Essential IDs
    const componentId = useId();
    const { settings } = useUserSettings();
    const { t } = useI18n();

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {bannerImage.name}
                            </h2>
                            {bannerImage.image ? (
                                <Badge variant="outline">{t('imageAvailable')}</Badge>
                            ) : (
                                <Badge variant="secondary">{t('noImage')}</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(bannerImage)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(bannerImage)}
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
                    {bannerImage.image?.url && (
                        <>
                            <a 
                                href={bannerImage.image.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {t('viewFullImage')}
                            </a>
                            <span>•</span>
                        </>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(bannerImage.createdAt, settings)}</span>
                    </div>
                </div>
            </AppCard>

            {/* Banner Image Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "bannerImage", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('name')}</div>
                                <div className="font-medium">{bannerImage.name}</div>
                            </div>
                        </div>
                        
                        {bannerImage.image && (
                            <>
                                <div className="flex items-center gap-3">
                                    <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">{t('imageName')}</div>
                                        <div className="font-medium">{bannerImage.image.name || t('na')}</div>
                                    </div>
                                </div>
                                {bannerImage.image.url && (
                                    <ImageUrlCell imageUrl={bannerImage.image.url} t={t} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Preview */}
            {bannerImage.image?.url && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {t('imagePreview')}
                    </h3>
                    <div className="flex justify-center">
                        <img
                            src={bannerImage.image.url}
                            alt={bannerImage.name}
                            className="max-w-full h-auto rounded-lg border border-gray-200"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
