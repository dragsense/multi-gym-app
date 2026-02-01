// External Libraries
import { useShallow } from 'zustand/shallow';
import { useId, useMemo, useTransition } from 'react';

// Components
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Settings,
  Tag,
  CreditCard,
  Percent,
  CheckCircle2,
  XCircle,
  DoorOpen,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Types
import { type IMembership } from "@shared/interfaces/membership.interface";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Hooks & Utils
import { formatDate, formatCurrency } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";

export type TMembershipViewExtraProps = {};

interface IMembershipViewProps extends THandlerComponentProps<TSingleHandlerStore<IMembership, TMembershipViewExtraProps>> {
}

export default function MembershipView({ storeKey, store }: IMembershipViewProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const { response: membership, action, reset, setAction } = store(useShallow(state => ({
        response: state.response,
        action: state.action,
        reset: state.reset,
        setAction: state.setAction,
    })));

    if (!membership) {
        return null;
    }

    const handleCloseView = () => {
        startTransition(() => reset());
    };

    const onEditTermsAndConditions = (membership: IMembership) => {
        startTransition(() => {
            setAction('updateTermsAndConditions', membership.id);
        });
    };

    return (
        <Dialog open={action === 'view'} onOpenChange={handleCloseView} data-component-id={componentId}>
            <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
                <AppDialog
                    title={buildSentence(t, 'membership', 'details')}
                    description={buildSentence(t, 'view', 'detailed', 'information', 'about', 'this', 'membership')}
                >
                    <MembershipDetailContent membership={membership} onEditTermsAndConditions={onEditTermsAndConditions} />
                </AppDialog>
            </DialogContent>
        </Dialog>
    );
}

interface IMembershipDetailContentProps {
    membership: IMembership;
    onEditTermsAndConditions: (membership: IMembership) => void;
}

function MembershipDetailContent({ membership, onEditTermsAndConditions }: IMembershipDetailContentProps) {
    // React 19: Essential IDs
    const componentId = useId();
    const { t } = useI18n();
    const { settings } = useUserSettings();

    // React 19: Memoized expiry formatting for better performance
    const expiryLabel = useMemo(() => {
        if (!membership.expiry) return "";
        return membership.expiry.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    }, [membership.expiry]);

    const createdAt = useMemo(
        () => (membership.createdAt ? formatDate(membership.createdAt, settings) : ""),
        [membership.createdAt, settings]
    );

    const updatedAt = useMemo(
        () => (membership.updatedAt ? formatDate(membership.updatedAt, settings) : ""),
        [membership.updatedAt, settings]
    );

    return (
        <div className="space-y-4" data-component-id={componentId}>
            {/* Header Card */}
            <AppCard
                header={
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-semibold truncate">
                                {membership.title}
                            </h2>
                            <Badge variant={membership.enabled ? "default" : "secondary"}>
                                {membership.enabled ? t('enabled') : t('disabled')}
                            </Badge>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {membership.price !== undefined && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold text-foreground">
                                    {formatCurrency(
                                        Number(membership.price),
                                        undefined,
                                        undefined,
                                        2,
                                        2,
                                        settings
                                    )}
                                </span>
                            </div>
                            <span>•</span>
                        </>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{buildSentence(t, 'created', 'at')} {createdAt}</span>
                    </div>
                </div>
            </AppCard>

            {/* Basic Information and Pricing - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'basic', 'information')}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, 'title')}
                                </div>
                                <div className="font-medium">{membership.title}</div>
                            </div>
                        </div>
                        {membership.description && (
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {buildSentence(t, 'description')}
                                    </div>
                                    <div className="text-sm">{membership.description}</div>
                                </div>
                            </div>
                        )}
                        {membership.color && (
                            <div className="flex items-center gap-3">
                                <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'color')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-6 h-6 rounded border" 
                                            style={{ backgroundColor: membership.color }}
                                        />
                                        <span className="font-medium">{membership.color}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, 'sort', 'order')}
                                </div>
                                <div className="font-medium">{membership.sortOrder ?? 0}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {membership.enabled ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, 'status')}
                                </div>
                                <div className="font-medium">
                                    {membership.enabled ? t('enabled') : t('disabled')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'pricing', 'information')}
                    </h3>
                    <div className="space-y-3">
                        {membership.price !== undefined && (
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'price')}
                                    </div>
                                    <div className="font-medium text-lg text-green-600">
                                        {formatCurrency(
                                            Number(membership.price),
                                            undefined,
                                            undefined,
                                            2,
                                            2,
                                            settings
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.calculatedPrice !== undefined && (
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'calculated', 'price')}
                                    </div>
                                    <div className="font-medium text-lg text-blue-600">
                                        {formatCurrency(
                                            Number(membership.calculatedPrice),
                                            undefined,
                                            undefined,
                                            2,
                                            2,
                                            settings
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.pricePeriod && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'price', 'period')}
                                    </div>
                                    <div className="font-medium">
                                        {membership.pricePeriod} {buildSentence(t, 'months')}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.signupFee !== undefined && (
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'signup', 'fee')}
                                    </div>
                                    <div className="font-medium">
                                        {formatCurrency(
                                            Number(membership.signupFee),
                                            undefined,
                                            undefined,
                                            2,
                                            2,
                                            settings
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.annualFee !== undefined && (
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'annual', 'fee')}
                                    </div>
                                    <div className="font-medium">
                                        {formatCurrency(
                                            Number(membership.annualFee),
                                            undefined,
                                            undefined,
                                            2,
                                            2,
                                            settings
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.cancellationFee !== undefined && (
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'cancellation', 'fee')}
                                    </div>
                                    <div className="font-medium">
                                        {formatCurrency(
                                            Number(membership.cancellationFee),
                                            undefined,
                                            undefined,
                                            2,
                                            2,
                                            settings
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.discountPercentage !== undefined && (
                            <div className="flex items-center gap-3">
                                <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'discount', 'percentage')}
                                    </div>
                                    <div className="font-medium">{membership.discountPercentage}%</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Billing Information */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {buildSentence(t, 'billing', 'information')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        {membership.billingFrequency && (
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'billing', 'frequency')}
                                    </div>
                                    <div className="font-medium capitalize">
                                        {membership.billingFrequency.replace(/_/g, ' ').toLowerCase()}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.paymentPreference && Array.isArray(membership.paymentPreference) && membership.paymentPreference.length > 0 && (
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'payment', 'preference')}
                                    </div>
                                    <div className="font-medium capitalize">
                                        {membership.paymentPreference.map((p: string) => p.replace(/_/g, ' ').toLowerCase()).join(', ')}
                                    </div>
                                </div>
                            </div>
                        )}
                        {membership.billingStartDay && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'billing', 'start', 'day')}
                                    </div>
                                    <div className="font-medium">{membership.billingStartDay}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    {buildSentence(t, 'prorate')}
                                </div>
                                <Badge variant={membership.prorate ? "default" : "secondary"}>
                                    {membership.prorate ? t('yes') : t('no')}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {membership.annualFeeDate && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'annual', 'fee', 'date')}
                                    </div>
                                    <div className="font-medium">{membership.annualFeeDate}</div>
                                </div>
                            </div>
                        )}
                        {membership.expiry && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        {buildSentence(t, 'expiry')}
                                    </div>
                                    <div className="font-medium capitalize">{expiryLabel}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings */}
            {membership.settings && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'settings')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            {membership.settings.memberLimits !== undefined && (
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'member', 'limits')}
                                        </div>
                                        <div className="font-medium">{membership.settings.memberLimits}</div>
                                    </div>
                                </div>
                            )}
                            {membership.settings.autoRenew !== undefined && (
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'auto', 'renew')}
                                        </div>
                                        <Badge variant={membership.settings.autoRenew ? "default" : "secondary"}>
                                            {membership.settings.autoRenew ? t('yes') : t('no')}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                            {membership.settings.allowGuestAccess !== undefined && (
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'allow', 'guest', 'access')}
                                        </div>
                                        <Badge variant={membership.settings.allowGuestAccess ? "default" : "secondary"}>
                                            {membership.settings.allowGuestAccess ? t('yes') : t('no')}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            {membership.settings.minAge !== undefined && (
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'minimum', 'age')}
                                        </div>
                                        <div className="font-medium">{membership.settings.minAge}</div>
                                    </div>
                                </div>
                            )}
                            {membership.settings.maxAge !== undefined && (
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'maximum', 'age')}
                                        </div>
                                        <div className="font-medium">{membership.settings.maxAge}</div>
                                    </div>
                                </div>
                            )}
                            {membership.settings.maxGuestVisitsPerMonth !== undefined && (
                                <div className="flex items-center gap-3">
                                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'max', 'guest', 'visits', 'per', 'month')}
                                        </div>
                                        <div className="font-medium">{membership.settings.maxGuestVisitsPerMonth}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Access Hours */}
            {membership.accessHours && membership.accessHours.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'access', 'hours')} ({membership.accessHours.length})
                    </h3>
                    <div className="space-y-3">
                        {membership.accessHours.map((accessHour, index) => (
                            <div
                                key={accessHour.id || index}
                                className="flex items-center justify-between gap-4 hover:bg-muted p-3 rounded-md border"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium">{accessHour.name || "-"}</div>
                                    {accessHour.description && (
                                        <div className="text-sm text-muted-foreground">{accessHour.description}</div>
                                    )}
                                    {accessHour.startTime && accessHour.endTime && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                {accessHour.startTime} - {accessHour.endTime}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Access Features */}
            {membership.accessFeatures && membership.accessFeatures.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'access', 'features')} ({membership.accessFeatures.length})
                    </h3>
                    <div className="space-y-3">
                        {membership.accessFeatures.map((accessFeature, index) => (
                            <div
                                key={accessFeature.id || index}
                                className="flex items-center justify-between gap-4 hover:bg-muted p-3 rounded-md border"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium">{accessFeature.name || "-"}</div>
                                    {accessFeature.description && (
                                        <div className="text-sm text-muted-foreground">{accessFeature.description}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Doors */}
            {membership.doors && membership.doors.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'doors')} ({membership.doors.length})
                    </h3>
                    <div className="space-y-3">
                        {membership.doors.map((door: any, index: number) => (
                            <div
                                key={door.id || index}
                                className="flex items-center justify-between gap-4 hover:bg-muted p-3 rounded-md border"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <DoorOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">{door.name || "-"}</div>
                                        {door.description && (
                                            <div className="text-sm text-muted-foreground">{door.description}</div>
                                        )}
                                        {door.location && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {typeof door.location === 'string' 
                                                  ? door.location 
                                                  : door.location.name || door.location.address || t("location")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Terms and Conditions */}
            <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {buildSentence(t, 'terms', 'and', 'conditions')}
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTermsAndConditions(membership)}
                        className="gap-2"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>
                <TermsAndConditionsView termsAndConditions={membership.termsAndConditions} t={t} />
            </div>
        </div>
    );
}

// Terms and Conditions Component with View/Hide Toggle
function TermsAndConditionsView({
    termsAndConditions,
    t,
}: {
    termsAndConditions?: string;
    t: (key: string) => string;
}) {
    const [showFull, setShowFull] = useState(false);

    if (!termsAndConditions) {
        return (
            <div className="space-y-2">
                <div className="border rounded-md p-3 bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                        {buildSentence(t, "no", "terms", "and", "conditions")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="border rounded-md p-3 bg-muted/30">
                <div 
                    className={`text-sm text-foreground prose prose-sm max-w-none ${
                        showFull ? "" : "max-h-[200px] overflow-y-auto"
                    }`}
                    dangerouslySetInnerHTML={{ __html: termsAndConditions }}
                />
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setShowFull(!showFull)}
                    className="mt-2 h-auto p-0 text-xs"
                >
                    {showFull
                        ? buildSentence(t, "read", "less")
                        : buildSentence(t, "read", "more")}
                </Button>
            </div>
        </div>
    );
}

