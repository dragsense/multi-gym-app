// React
import { useEffect, useState } from "react";

// Types
import { ESubscriptionFrequency } from "@shared/enums";
import type { ISubscription } from "@shared/interfaces";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import { SubscriptionCard } from "@/components/shared-ui/subscription-card";

// Utils
import { cn } from "@/lib/utils";

const FREQUENCIES = Object.values(ESubscriptionFrequency);

export const SubscriptionSelect = ({
    value,
    onChange,
    disabled,
    subscriptions,
}: {
    value?: {
        plan: ISubscription;
        frequency: ESubscriptionFrequency;
    };
    onChange: (value: {
        plan: ISubscription;
        frequency: ESubscriptionFrequency;
    }) => void;
    disabled?: boolean;
    subscriptions: ISubscription[];
}) => {

    const [frequency, setFrequency] = useState<ESubscriptionFrequency>(
        value?.frequency ?? ESubscriptionFrequency.MONTHLY
    );

    useEffect(() => {
        if (value?.frequency) {
            setFrequency(value.frequency);
        }
    }, [value?.frequency]);

    // Filter subscriptions that support selected frequency
    const filteredPlans = subscriptions.filter((s) =>
        s.frequency?.includes(frequency)
    );

    return (
        <div className="w-full">
            {/* Frequency Tabs */}
            <div className="flex justify-center mb-8 gap-4">
                {FREQUENCIES.map((freq) => (
                    <Button
                        key={freq}
                        variant={frequency === freq ? "default" : "outline"}
                        onClick={() => setFrequency(freq)}
                        disabled={disabled}
                        className="capitalize"
                    >
                        {freq.toLowerCase()}
                    </Button>
                ))}
            </div>

            {/* Subscription Plans Grid */}
            {filteredPlans.length === 0 ? (
                <AppCard>
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No subscriptions available for {frequency.toLowerCase()} billing.
                        </p>
                    </div>
                </AppCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((subscription) => {
                        const isSelected = value?.plan.id === subscription.id && value?.frequency === frequency;

                        return (
                            <SubscriptionCard
                                key={subscription.id}
                                subscription={subscription}
                                frequency={frequency}
                                isSelected={isSelected}
                                onClick={() => {
                                    if (!disabled) {
                                        onChange({
                                            plan: subscription,
                                            frequency,
                                        });
                                    }
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};
