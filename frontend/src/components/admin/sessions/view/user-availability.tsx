// External Libraries
import { useId } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Hooks
import { useUserAvailability } from "@/hooks/use-user-availability";

// Types
interface IUserAvailabilityProps {
    userId: string;
    dateTime: string;
    duration?: number;
}

/**
 * Reusable component to display user availability status with loading effect
 */
export function UserAvailability({
    userId,
    dateTime,
    duration = 60,
}: IUserAvailabilityProps) {
    const componentId = useId();

    const { data, isLoading, isError } = useUserAvailability({
        userId,
        dateTime,
        duration,
    });

    // Loading state
    if (isLoading) {
        return (
            <div
                className="flex items-center gap-2"
                data-component-id={componentId}
            >
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking...</span>
            </div>
        );
    }

    // Error state or no data
    if (isError || !data) {
        return (
            <div
                className="flex items-center gap-2"
                data-component-id={componentId}
            >
                <Badge variant="outline" className="text-xs">
                    Unknown
                </Badge>
            </div>
        );
    }

    // Available state
    if (data.isAvailable) {
        return (
            <div
                className="flex items-center gap-2"
                data-component-id={componentId}
            >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                    Available
                </Badge>
            </div>
        );
    }

    // Not available state
    return (
        <div className="flex items-center gap-2" data-component-id={componentId}>
            <AlertCircle className="w-4 h-4 text-red-600" />
            <Badge
                variant="outline"
                className="text-xs bg-red-50 text-red-700 border-red-200"
            >
                {data.reason || "Not Available"}
            </Badge>
        </div>
    );
}

