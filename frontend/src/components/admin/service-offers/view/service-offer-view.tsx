// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId } from 'react';
import { useTransition } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Tag, DollarSign, Percent, User, Briefcase, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildSentence } from "@/locales/translations";
import { cn } from "@/lib/utils";

// Types
import { type IServiceOffer } from "@shared/interfaces/service-offer.interface";
import { EServiceOfferStatus } from "@shared/enums/service-offer.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";

export type TServiceOfferViewExtraProps = {}

interface IServiceOfferViewProps extends THandlerComponentProps<TSingleHandlerStore<IServiceOffer, TServiceOfferViewExtraProps>> {
}

const statusColors: Record<EServiceOfferStatus, string> = {
  [EServiceOfferStatus.ACTIVE]: "bg-green-100 text-green-800",
  [EServiceOfferStatus.INACTIVE]: "bg-gray-100 text-gray-800",
};

export default function ServiceOfferView({ storeKey, store }: IServiceOfferViewProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: serviceOffer, action, setAction, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        setAction: state.setAction,
        reset: state.reset,
    })));

    if (!serviceOffer) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (serviceOffer: IServiceOffer) => {
        startTransition(() => {
            setAction("createOrUpdate", serviceOffer.id);
        });
    };

    const onDelete = (serviceOffer: IServiceOffer) => {
        startTransition(() => {
            setAction("delete", serviceOffer.id);
        });
    };

    const onUpdateStatus = (serviceOffer: IServiceOffer) => {
        startTransition(() => {
            setAction("updateStatus", serviceOffer.id);
        });
    };

    const discountAmount = (Number(serviceOffer.offerPrice) * (Number(serviceOffer.discount) || 0)) / 100;
    const finalPrice = Number(serviceOffer.offerPrice) - discountAmount;

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={t('serviceOfferDetails')}
                    description={t('viewDetailedInformationAboutThisServiceOffer')}
                >
                    <ServiceOfferDetailContent 
                        serviceOffer={serviceOffer} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUpdateStatus={onUpdateStatus}
                        finalPrice={finalPrice}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IServiceOfferDetailContentProps {
    serviceOffer: IServiceOffer;
    onEdit: (serviceOffer: IServiceOffer) => void;
    onDelete: (serviceOffer: IServiceOffer) => void;
    onUpdateStatus: (serviceOffer: IServiceOffer) => void;
    finalPrice: number;
}

function ServiceOfferDetailContent({ serviceOffer, onEdit, onDelete, onUpdateStatus, finalPrice }: IServiceOfferDetailContentProps) {
    const componentId = useId();
    const { t } = useI18n();

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Tag className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-2xl font-semibold truncate">
                                {serviceOffer.name}
                            </h2>
                            <Badge className={cn(statusColors[serviceOffer.status], "text-xs")}>
                                {serviceOffer.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateStatus(serviceOffer)}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {buildSentence(t, "update", "status")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(serviceOffer)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(serviceOffer)}
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
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">
                          {serviceOffer.discount > 0 ? (
                            <>
                              <span className="line-through text-muted-foreground mr-2">
                                ${serviceOffer.offerPrice}
                              </span>
                              <span className="text-primary">
                                ${finalPrice.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span>${serviceOffer.offerPrice}</span>
                          )}
                        </span>
                    </div>
                    {serviceOffer.discount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {serviceOffer.discount}% {t('discount')}
                      </Badge>
                    )}
                </div>
            </AppCard>

            {/* Service Offer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "offer", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('name')}</div>
                                <div className="font-medium">{serviceOffer.name}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('offerPrice')}</div>
                                <div className="font-medium">${serviceOffer.offerPrice}</div>
                            </div>
                        </div>
                        {serviceOffer.discount > 0 && (
                          <div className="flex items-center gap-3">
                            <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('discount')}</div>
                                <div className="font-medium">{serviceOffer.discount}%</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('finalPrice')}</div>
                                <div className="font-medium text-primary">${finalPrice.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('status')}</div>
                                <Badge className={cn(statusColors[serviceOffer.status], "text-xs")}>
                                    {serviceOffer.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                        {serviceOffer.trainerService && (
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('trainerService')}</div>
                                    <div className="font-medium">{serviceOffer.trainerService.title}</div>
                                </div>
                            </div>
                        )}
                        {serviceOffer.trainer?.user && (
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('trainer')}</div>
                                    <div className="font-medium">
                                        {serviceOffer.trainer.user.firstName} {serviceOffer.trainer.user.lastName}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

