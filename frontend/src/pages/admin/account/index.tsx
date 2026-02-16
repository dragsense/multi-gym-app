// External Libraries
import { Loader2, User, UserCircle, Lock, CreditCard, BadgeCheck, Wallet, Link2 } from "lucide-react";
import { useId, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Components
import { AccountTab, ProfileTab, PasswordResetTab, CurrentSubscriptionTab, CurrentMembershipTab, PaymentCardsTab, StripeConnectTab, PaysafeAccountTab } from "./tabs";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useMyBusiness } from "@/hooks/use-my-business";
import { EUserLevels, EPaymentProcessorType } from "@shared/enums";
import type { IBusiness } from "@shared/interfaces";

const BUSINESS_LEVELS = [EUserLevels.SUPER_ADMIN];

export default function AccountPage() {

    const { user } = useAuthUser();
    const [searchParams] = useSearchParams();

    // React 19: Essential IDs
    const componentId = useId();

    const { business } = useMyBusiness({
        enabled: user?.level != null && BUSINESS_LEVELS.includes(user.level),
    });

    const paymentProcessorType = (business as IBusiness & { paymentProcessor?: { type?: string } })?.paymentProcessor?.type;

    // Support deep-linking to tabs via ?tab=stripe-connect
    const tabFromUrl = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(tabFromUrl || "account");

    const accountTabs = useMemo(() => {
        const tabs = [
            {
                id: "account",
                label: "Account",
                icon: User,
                description: "User information"
            },
            {
                id: "profile",
                label: "Profile",
                icon: UserCircle,
                description: "Profile information"
            },
            {
                id: "password-reset",
                label: "Password Reset",
                icon: Lock,
                description: "Change your password"
            },
            ...(user?.level === EUserLevels.SUPER_ADMIN ? [{
                id: "current-subscription",
                label: "Current Subscription",
                icon: CreditCard,
                description: "Your current subscription"
            }] : []),
            ...(user?.level === EUserLevels.MEMBER ? [{
                id: "current-membership",
                label: "Current Membership",
                icon: BadgeCheck,
                description: "Your current membership"
            }] : []),
        ];

        if (paymentProcessorType === EPaymentProcessorType.STRIPE) {
            if (user?.level >= EUserLevels.SUPER_ADMIN) {
                tabs.push({
                    id: "payment-cards",
                    label: "Payment Cards",
                    icon: Wallet,
                    description: "Manage your payment methods"
                });
            }
            if (user?.level === EUserLevels.SUPER_ADMIN) {
                tabs.push({
                    id: "stripe-connect",
                    label: "Stripe Account",
                    icon: Link2,
                    description: "Manage your Stripe Connect account"
                });
            }
        } else if (paymentProcessorType === EPaymentProcessorType.PAYSAFE) {
            if (BUSINESS_LEVELS.includes(user?.level ?? -1)) {
                tabs.push({
                    id: "paysafe-account",
                    label: "Paysafe Account",
                    icon: Wallet,
                    description: "Manage your Paysafe account"
                });
            }
        }

        return tabs;
    }, [user?.level, paymentProcessorType]);

    return (
        <div data-component-id={componentId} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex justify-start gap-5 mb-6">
                    {accountTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                <TabsContent value="account" className="mt-0">
                    <AccountTab />
                </TabsContent>

                <TabsContent value="profile" className="mt-0">
                    <ProfileTab />
                </TabsContent>

                <TabsContent value="password-reset" className="mt-0">
                    <PasswordResetTab />
                </TabsContent>

                <TabsContent value="current-subscription" className="mt-0">
                    <CurrentSubscriptionTab />
                </TabsContent>

                <TabsContent value="current-membership" className="mt-0">
                    <CurrentMembershipTab />
                </TabsContent>

                <TabsContent value="payment-cards" className="mt-0">
                    <PaymentCardsTab />
                </TabsContent>

                <TabsContent value="stripe-connect" className="mt-0">
                    <StripeConnectTab />
                </TabsContent>

                <TabsContent value="paysafe-account" className="mt-0">
                    <PaysafeAccountTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

