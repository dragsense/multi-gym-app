// React & Hooks
import { useId, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useShallow } from "zustand/shallow";

// External libraries
import { Settings } from "lucide-react";

// Types
import { type ILocation } from "@shared/interfaces/location.interface";
import { type TListHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";

// Components
import LocationSelectionList from "./location-selection-list";
import { useNavigate } from "react-router-dom";
import { buildRoutePath } from "@/lib/utils";
import { ADMIN_ROUTES, ADMIN_SEGMENT, SUPER_ADMIN_SEGMENT } from "@/config/routes.config";
import { useRegisteredStore } from "@/stores";
import { LOCATION_SELECTION_STORE_KEY } from "@/page-components/location/location-selection";

interface ILocationSelectionModalProps
    extends THandlerComponentProps<TListHandlerStore<ILocation, any, any>> { }

export function LocationSelectionModal({
    storeKey,
    store,
}: ILocationSelectionModalProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();
    const navigate = useNavigate();


    if (!store) {
        return null;
    }

    const { action, setAction } = store(
        useShallow((state) => ({
            action: state.action,
            setAction: state.setAction,
        }))
    );

    const handleClose = () => {
        startTransition(() => {
            setAction("none");
        });
    };

    const handleManageLocations = () => {
        startTransition(() => {
            handleClose();
            navigate(
                buildRoutePath(`${ADMIN_SEGMENT}/${ADMIN_ROUTES.LOCATIONS}`)
            );
        });
    };

    const isOpen = action === "selectLocation";

    if (!isOpen) return null;

    const footerContent = (
        <div className="flex justify-end items-center w-full">
        {/*     <Button
                variant="outline"
                onClick={handleManageLocations}
                className="flex items-center gap-2"
            >
                <Settings className="h-4 w-4" />
                {t("manageLocations")}
            </Button> */}
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                    {t("cancel")}
                </Button>
            </div>
        </div>
    );

    return (
        <Dialog data-component-id={componentId} open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="min-w-4xl">
                <AppDialog
                    title={buildSentence(t, "select", "location")}
                    description={buildSentence(
                        t,
                        "select",
                        "a",
                        "location",
                        "to",
                        "filter",
                        "data"
                    )}
                    footerContent={footerContent}
                >
                    <LocationSelectionList store={store} />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}
