import { useId, useTransition } from "react";

// Types
import { type IUserAvailability } from "@shared/interfaces/user-availability.interface";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TSingleHandlerStore } from "@/stores";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Icons
import { Calendar, Clock, Edit, Plus } from "lucide-react";

// Utils
import { useShallow } from "zustand/shallow";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate, formatDateString, formatTimeString } from "@/lib/utils";

export type TUserAvailabilityViewExtraProps = {};

interface IUserAvailabilityViewProps extends THandlerComponentProps<TSingleHandlerStore<IUserAvailability, TUserAvailabilityViewExtraProps>> { }

export default function UserAvailabilityView({
    storeKey,
    store,
}: IUserAvailabilityViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { settings } = useUserSettings();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { response, isLoading, error, setAction } = store(useShallow(state => ({
        response: state.response,
        isLoading: state.isLoading,
        error: state.error,
        setAction: state.setAction
    })));

    const handleUpdateAvailability = () => {
        startTransition(() => {
            setAction('createOrUpdate');
        });
    };

    const handleAddAvailability = () => {
        startTransition(() => {
            setAction('createOrUpdate');
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading availability...</p>
                </div>
            </div>
        );
    }



    if (!response) {
        return (
            <AppCard
                header={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">User Availability</h2>
                        </div>
                        <Button onClick={handleAddAvailability} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Availability
                        </Button>
                    </div>
                }
            >

                {error && (
                    <div className="text-center">
                        <p className="text-red-500">{error?.message}</p>
                    </div>
                )}

                <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Availability Set</h3>
                    <p className="text-muted-foreground mb-4">
                        You haven't set your availability yet. Click the button above to get started.
                    </p>
                    <Button onClick={handleAddAvailability}>
                        <Plus className="h-4 w-4 mr-2" />
                        Set Availability
                    </Button>
                </div>
            </AppCard>
        );
    }

    return (
        <div data-component-id={componentId} className="space-y-6">
            <AppCard
                header={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <Button onClick={handleUpdateAvailability} variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Update Availability
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Weekly Schedule */}
                    <div className="flex justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <h4 className="font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Weekly Schedule
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {response.weeklySchedule && Object.entries(response.weeklySchedule).map(([day, schedule]) => (
                                    <div key={day} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium capitalize">{day}</h5>
                                            <Badge variant={schedule.enabled ? "default" : "secondary"}>
                                                {schedule.enabled ? "Available" : "Unavailable"}
                                            </Badge>
                                        </div>
                                        {schedule.enabled && schedule.timeSlots && schedule.timeSlots.length > 0 ? (
                                            <div className="space-y-1">
                                                {schedule.timeSlots.map((slot, index) => (
                                                    <div key={index} className="text-sm">
                                                        <Badge variant="outline" className="text-xs">
                                                            {formatTimeString(slot.start)} - {formatTimeString(slot.end)}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : schedule.enabled ? (
                                            <span className="text-xs text-muted-foreground">No time slots</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Not available</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Unavailable Periods */}
                        {response.unavailablePeriods && response.unavailablePeriods.length > 0 && (
                            <div className="space-y-2 ">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Unavailable Periods
                                </h4>
                                <div className="max-h-[45vh] overflow-y-auto">
                                    <div className="space-y-2">
                                        {response.unavailablePeriods.map((period, index) => (
                                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-red-800">{period.reason}</span>
                                                    <Badge variant="destructive" className="text-xs">
                                                        Unavailable
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-red-600 mt-1">

                                                    {formatDateString(period.dateRange?.[0], settings)} - {formatDateString(period.dateRange?.[1], settings)}

                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Last updated: {response.updatedAt ? formatDate(response.updatedAt, settings) : 'Never'}
                        </div>
                        <Button onClick={handleUpdateAvailability} variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Update Availability
                        </Button>
                    </div>
                </div>
            </AppCard>
        </div>
    );
}