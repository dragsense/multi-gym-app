// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId } from 'react';
import { useTransition } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Briefcase, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSentence } from "@/locales/translations";

// Types
import { type ITrainerService } from "@shared/interfaces/trainer-service.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";

export type TTrainerServiceViewExtraProps = {}

interface ITrainerServiceViewProps extends THandlerComponentProps<TSingleHandlerStore<ITrainerService, TTrainerServiceViewExtraProps>> {
}

export default function TrainerServiceView({ storeKey, store }: ITrainerServiceViewProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: trainerService, action, setAction, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        setAction: state.setAction,
        reset: state.reset,
    })));

    if (!trainerService) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (trainerService: ITrainerService) => {
        startTransition(() => {
            setAction("createOrUpdate", trainerService.id);
        });
    };

    const onDelete = (trainerService: ITrainerService) => {
        startTransition(() => {
            setAction("delete", trainerService.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={t('trainerServiceDetails')}
                    description={t('viewDetailedInformationAboutThisTrainerService')}
                >
                    <TrainerServiceDetailContent 
                        trainerService={trainerService} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface ITrainerServiceDetailContentProps {
    trainerService: ITrainerService;
    onEdit: (trainerService: ITrainerService) => void;
    onDelete: (trainerService: ITrainerService) => void;
}

function TrainerServiceDetailContent({ trainerService, onEdit, onDelete }: ITrainerServiceDetailContentProps) {
    const componentId = useId();
    const { t } = useI18n();

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-2xl font-semibold truncate">
                                {trainerService.title}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(trainerService)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(trainerService)}
                                className="gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {buildSentence(t, "delete")}
                            </Button>
                        </div>
                    </div>
                }
            >
                {trainerService.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                        {trainerService.description}
                    </p>
                )}
            </AppCard>

            {/* Trainer Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "service", "information")}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">{t('title')}</div>
                                <div className="font-medium">{trainerService.title}</div>
                            </div>
                        </div>
                        {trainerService.description && (
                            <div className="flex items-start gap-3">
                                <Briefcase className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('description')}</div>
                                    <div className="font-medium">{trainerService.description}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

