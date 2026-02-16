// React & Hooks
import { useEffect, useId, useTransition, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useShallow } from "zustand/shallow";

// External libraries
import { MapPin, Building2 } from "lucide-react";

// Types
import { type ILocation } from "@shared/interfaces/location.interface";
import { type TListHandlerStore } from "@/stores";

// UI Components
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { Skeleton } from "@/components/ui/skeleton";

// Utils
import {
    setSelectedLocation,
    getSelectedLocation,
} from "@/utils/location-storage";

interface ILocationSelectionListProps {
    store: TListHandlerStore<ILocation, any, any>;
}

export default function LocationSelectionList({
    store,
}: ILocationSelectionListProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return null;
    }

    const { response: locations, isLoading, setAction } = store(
        useShallow((state) => ({
            response: state.response,
            isLoading: state.isLoading,
            setAction: state.setAction,
        }))
    );

    const selectedLocation = getSelectedLocation();
    const [localSelectedLocation, setLocalSelectedLocation] = useState<ILocation | null>(selectedLocation);




    // Check if selection has changed
    const hasSelectionChanged = 
        (localSelectedLocation === null && selectedLocation !== null) ||
        (localSelectedLocation !== null && selectedLocation === null) ||
        (localSelectedLocation?.id !== selectedLocation?.id);

    const handleSelectLocation = (location: ILocation | null) => {
        // Check if the same location is already selected locally
        if (location === null && localSelectedLocation === null) {
            // "All Locations" is already selected locally, don't do anything
            return;
        }
        
        if (location?.id === localSelectedLocation?.id) {
            // Same location is already selected locally, don't do anything
            return;
        }



        // Update local selection only (no reload yet) - update immediately
        setLocalSelectedLocation(location);
    };

    const handleApplySelection = () => {
        startTransition(() => {
            // Check if selection actually changed
            const hasChanged = 
                (localSelectedLocation === null && selectedLocation !== null) ||
                (localSelectedLocation !== null && selectedLocation === null) ||
                (localSelectedLocation?.id !== selectedLocation?.id);

            if (!hasChanged) {
                // No change, just close modal
                setAction("none");
                return;
            }

            // Apply the selection and reload
            setSelectedLocation(localSelectedLocation);
            setAction("none");
            window.location.reload();
        });
    };

    return (
        <div className="space-y-4 max-h-[60vh] p-2 overflow-y-auto" data-component-id={componentId}>
            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-80" />
                    ))}
                </div>
            )}

            {/* Location Cards Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* All Locations Option */}
                    <div className="h-full">
                        <AppCard
                            onClick={() => handleSelectLocation(null)}
                            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden h-full flex flex-col ${localSelectedLocation === null
                                ? "ring-2 ring-primary shadow-lg"
                                : ""
                                }`}
                        >
                            <div className="flex flex-col h-full">
                                {/* Image Section - Top */}
                                <div className="relative w-full h-48 overflow-hidden bg-primary/10 flex-shrink-0">
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Building2 className="h-16 w-16 text-primary" />
                                    </div>
                                    {/* Selection Indicator - Top Right */}
                                    {localSelectedLocation === null && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                                <div className="w-3 h-3 rounded-full bg-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Location Information - Bottom */}
                                <div className="p-4 flex-1 flex flex-col min-h-[100px]">
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                                        {buildSentence(t, "all", "locations")}
                                    </h3>
                                    <div className="flex items-start gap-2 mt-auto">
                                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                                            {buildSentence(t, "view", "data", "from", "all", "locations")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AppCard>
                    </div>

                    {/* Individual Location Cards */}
                    {locations?.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                            <p className="text-muted-foreground mb-4">
                                {buildSentence(t, "no", "locations", "found")}
                            </p>
                        </div>
                    ) : (
                        locations?.map((location) => (
                            <div key={location.id} className="h-full">
                                <AppCard
                                    onClick={() => handleSelectLocation(location)}
                                    className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden h-full flex flex-col ${localSelectedLocation?.id === location.id
                                        ? "ring-2 ring-primary shadow-lg"
                                        : ""
                                        }`}
                                >
                                    <div className="flex flex-col h-full">
                                        {/* Image Section - Top */}
                                        <div className="relative w-full h-48 overflow-hidden bg-muted flex-shrink-0">
                                            {location.image?.url ? (
                                                <img
                                                    src={location.image.url}
                                                    alt={location.name}
                                                    className="w-full h-full object-cover"
                                                    crossOrigin="anonymous"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <MapPin className="h-16 w-16 text-muted-foreground" />
                                                </div>
                                            )}
                                            {/* Selection Indicator - Top Right */}
                                            {localSelectedLocation?.id === location.id && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                                        <div className="w-3 h-3 rounded-full bg-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Location Information - Bottom */}
                                        <div className="p-4 flex-1 flex flex-col min-h-[100px]">
                                            <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                                                {location.name}
                                            </h3>
                                            <div className="flex items-start gap-2 mt-auto">
                                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                                                    {location.address}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </AppCard>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Apply Selection Button */}
            {hasSelectionChanged && (
                <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {buildSentence(t, "selected")}:{" "}
                            <span className="font-semibold text-foreground">
                                {localSelectedLocation ? localSelectedLocation.name : buildSentence(t, "all", "locations")}
                            </span>
                        </p>
                        {selectedLocation && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {buildSentence(t, "currently", "active")}: {selectedLocation.name}
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={handleApplySelection}
                        className="shrink-0"
                    >
                        {buildSentence(t, "apply", "selection")}
                    </Button>
                </div>
            )}

        </div>
    );
}
