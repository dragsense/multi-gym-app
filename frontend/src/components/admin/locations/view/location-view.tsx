// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId } from 'react';
import { useTransition } from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { MapPin, Pencil, Trash2, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSentence } from "@/locales/translations";

// Types
import { type ILocation } from "@shared/interfaces/location.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";

export type TLocationViewExtraProps = {}

interface ILocationViewProps extends THandlerComponentProps<TSingleHandlerStore<ILocation, TLocationViewExtraProps>> {
}

export default function LocationView({ storeKey, store }: ILocationViewProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response: location, action, setAction, reset } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        setAction: state.setAction,
        reset: state.reset,
    })));

    if (!location) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEdit = (location: ILocation) => {
        startTransition(() => {
            setAction("createOrUpdate", location.id);
        });
    };

    const onDelete = (location: ILocation) => {
        startTransition(() => {
            setAction("delete", location.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={t('locationDetails')}
                    description={t('viewDetailedInformationAboutThisLocation')}
                >
                    <LocationDetailContent 
                        location={location} 
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface ILocationDetailContentProps {
    location: ILocation;
    onEdit: (location: ILocation) => void;
    onDelete: (location: ILocation) => void;
}

function LocationDetailContent({ location, onEdit, onDelete }: ILocationDetailContentProps) {
    const componentId = useId();
    const { t } = useI18n();

    return (
        <div className="space-y-4" data-component-id={componentId}>
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {location.name}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(location)}
                                className="gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                {buildSentence(t, "edit")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(location)}
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
                        <MapPin className="w-4 h-4" />
                        <span>{location.address}</span>
                    </div>
                </div>
            </AppCard>

            {/* Doors List */}
            {location.doors && location.doors.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, "doors")} ({location.doors.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {location.doors.map((door: any, index: number) => (
                            <div
                                key={door.id || index}
                                className="flex items-start gap-3 hover:bg-muted p-4 rounded-lg border transition-colors"
                            >
                                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                                    <DoorOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-base mb-1">{door.name || "-"}</div>
                                    {door.description && (
                                        <div className="text-sm text-muted-foreground">{door.description}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {location.image?.url && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {t('imagePreview')}
                    </h3>
                    <div className="flex justify-center">
                        <img
                            src={location.image.url}
                            alt={location.name}
                            className="max-w-full h-auto rounded-lg border border-gray-200"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

