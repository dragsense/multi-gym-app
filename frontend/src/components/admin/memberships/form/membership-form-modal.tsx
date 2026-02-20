// External Libraries
import React, { useMemo, useId, useTransition, useState, useCallback } from "react";
import { Loader2, Pencil } from "lucide-react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableAccessHours, useSearchableAccessFeatures, useSearchableDoors } from "@/hooks/use-searchable";
import { useFormContext } from "react-hook-form";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TMembershipData, TUpdateMembershipData } from "@shared/types/membership.type";
import type { TMembershipResponse } from "@shared/interfaces/membership.interface";
import type { IAccessHour, IAccessFeature } from "@shared/interfaces";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { QuillEditor } from "@/components/shared-ui/quill-editor";
import { Label } from "@/components/ui/label";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";
import type { IDoor } from "@shared/interfaces/door.interface";
import { DoorDto } from "@shared/dtos";


// Custom components - must be defined before early return
const AccessHoursSelect = React.memo((props: TCustomInputWrapper) => {
    const searchableAccessHours = useSearchableAccessHours({});
    const { t } = useI18n();
    return (
        <SearchableInputWrapper<IAccessHour>
            {...props}
            modal={true}
            useSearchable={() => searchableAccessHours}
            getLabel={(item) => {
                if (!item?.name) return buildSentence(t, 'select', 'access', 'hours');
                const timeRange = item.startTime && item.endTime
                    ? ` (${item.startTime} - ${item.endTime})`
                    : '';
                return `${item.name}${timeRange}`;
            }}
            getKey={(item) => item.id.toString()}
            getValue={(item) => {
                return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    daysOfWeek: item.daysOfWeek
                };
            }}
            shouldFilter={false}
            multiple={true}
        />
    );
});

const AccessFeaturesSelect = React.memo((props: TCustomInputWrapper) => {
    const searchableAccessFeatures = useSearchableAccessFeatures({});
    const { t } = useI18n();
    return (
        <SearchableInputWrapper<IAccessFeature>
            {...props}
            modal={true}
            useSearchable={() => searchableAccessFeatures}
            getLabel={(item) => {
                if (!item?.name) return buildSentence(t, 'select', 'access', 'features');
                return item.name;
            }}
            getKey={(item) => item.id.toString()}
            getValue={(item) => {
                return {
                    id: item.id,
                    name: item.name,
                    description: item.description
                };
            }}
            shouldFilter={false}
            multiple={true}
        />
    );
});

const DoorSelect = React.memo((props: TCustomInputWrapper) => {
    const searchableDoors = useSearchableDoors({});
    const { t } = useI18n();
    const value = props.value as IDoor[] | undefined;
    const isAllDoors = !value || (Array.isArray(value) && value.length === 0);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="doors-all-doors"
                    checked={isAllDoors}
                    onChange={(e) => {
                        if (e.target.checked && props.onChange) {
                            props.onChange([]);
                        }
                    }}
                    className="rounded border-input"
                />
                <label htmlFor="doors-all-doors" className="text-sm font-medium cursor-pointer">
                    {buildSentence(t, 'all', 'doors')}
                </label>
            </div>
            <SearchableInputWrapper<IDoor>
                {...props}
                modal={true}
                useSearchable={() => searchableDoors}
                getLabel={(item) => {
                    if (!item) return buildSentence(t, 'select', 'door');
                    const loc = (item as any).location?.name || (item as any).location?.address;
                    return loc ? `${item.name || item.id} (${loc})` : (item.name || item.id);
                }}
                getKey={(item) => item.id.toString()}
                getValue={(item) => {
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        locationId: item.locationId,
                    } as IDoor;
                }}
                shouldFilter={false}
                multiple={true}
                disabled={isAllDoors}
            />
        </div>
    );
});

const TermsAndConditionsButton = React.memo((props: TCustomInputWrapper) => {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const { watch, setValue } = useFormContext<TMembershipData | TUpdateMembershipData>();
    const termsAndConditions = watch("termsAndConditions") || "";

    const handleOpen = useCallback(() => {
        setOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, []);

    const handleSave = useCallback(() => {
        setOpen(false);
    }, []);

    return (
        <>
            <div className="space-y-2">
                <Label>{buildSentence(t, 'terms', 'and', 'conditions')}</Label>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpen}
                    className="w-full justify-start"
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    {termsAndConditions ? buildSentence(t, 'edit', 'terms', 'and', 'conditions') : buildSentence(t, 'add', 'terms', 'and', 'conditions')}
                </Button>
                {termsAndConditions && (
                    <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: termsAndConditions.substring(0, 100) + (termsAndConditions.length > 100 ? '...' : '') }} />
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <AppDialog
                        title={<DialogTitle>{buildSentence(t, 'terms', 'and', 'conditions')}</DialogTitle>}
                        footerContent={
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                >
                                    {t("cancel")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={handleSave}
                                >
                                    {buildSentence(t, "save")}
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-3 py-4 overflow-y-auto flex-1">
                            <QuillEditor
                                value={termsAndConditions}
                                onChange={(value) => setValue("termsAndConditions", value)}
                                placeholder={buildSentence(t, "enter", "terms", "and", "conditions")}
                                minHeight="400px"
                            />
                        </div>
                    </AppDialog>
                </DialogContent>
            </Dialog>
        </>
    );
});

export interface IMembershipFormModalExtraProps {
    open: boolean;
    onClose: () => void;
}

interface IMembershipFormModalProps extends THandlerComponentProps<TFormHandlerStore<TMembershipData, TMembershipResponse, IMembershipFormModalExtraProps>> {
}

const MembershipFormModal = React.memo(function MembershipFormModal({
    storeKey,
    store,
}: IMembershipFormModalProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return `${buildSentence(t, 'form', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
    }

    const isEditing = store((state) => state.isEditing);
    const isSubmitting = store((state) => state.isSubmitting);

    const open = store((state) => state.extra.open);
    const onClose = store((state) => state.extra.onClose);

    // React 19: Memoized fields for better performance
    const storeFields = store((state) => state.fields);

    // React 19: Memoized fields for better performance
    const fields = useMemo(() => ({
        ...storeFields,
        title: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).title,
            label: buildSentence(t, 'Title'),
            placeholder: buildSentence(t, 'enter', 'title'),
        },
        description: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).description,
            label: buildSentence(t, 'description'),
            placeholder: buildSentence(t, 'enter', 'description'),
        },
        enabled: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).enabled,
            label: buildSentence(t, 'enabled'),
        },
        sortOrder: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).sortOrder,
            label: buildSentence(t, 'sort', 'order'),
            placeholder: buildSentence(t, 'enter', 'sort', 'order'),
        },
        color: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).color,
            label: buildSentence(t, 'color'),
            placeholder: buildSentence(t, 'select', 'color'),
        },
        price: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).price,
            label: buildSentence(t, 'price'),
            placeholder: buildSentence(t, 'enter', 'price'),
            required:true
        },
        pricePeriod: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).pricePeriod,
            label: buildSentence(t, 'price', 'period'),
            placeholder: buildSentence(t, 'enter', 'price', 'period'),
        },
        signupFee: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).signupFee,
            label: buildSentence(t, 'signup', 'fee'),
            placeholder: buildSentence(t, 'enter', 'signup', 'fee'),
        },
        annualFee: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).annualFee,
            label: buildSentence(t, 'annual', 'fee'),
            placeholder: buildSentence(t, 'enter', 'annual', 'fee'),
        },
        cancellationFee: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).cancellationFee,
            label: buildSentence(t, 'cancellation', 'fee'),
            placeholder: buildSentence(t, 'enter', 'cancellation', 'fee'),
        },
        discountPercentage: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).discountPercentage,
            label: buildSentence(t, 'discount', 'percentage'),
            placeholder: buildSentence(t, 'enter', 'discount', 'percentage'),
        },
        billingFrequency: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).billingFrequency,
            label: buildSentence(t, 'billing', 'frequency'),
            placeholder: buildSentence(t, 'select', 'billing', 'frequency'),
            required:true
        },
        paymentPreference: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).paymentPreference,
            label: buildSentence(t, 'payment', 'preference'),
            placeholder: buildSentence(t, 'select', 'payment', 'preference'),
        },
        billingStartDay: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).billingStartDay,
            label: buildSentence(t, 'billing', 'start', 'day'),
            placeholder: buildSentence(t, 'enter', 'billing', 'start', 'day'),
        },
        prorate: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).prorate,
            label: buildSentence(t, 'prorate'),
        },
        expiry: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).expiry,
            label: buildSentence(t, 'expiry'),
            placeholder: buildSentence(t, 'select', 'expiry', 'period'),
        },
        annualFeeDate: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).annualFeeDate,
            label: buildSentence(t, 'annual', 'fee', 'date'),
            placeholder: buildSentence(t, 'enter', 'annual', 'fee', 'date'),
        },
        settings: {
            ...(storeFields as any).settings,
            label: buildSentence(t, 'settings'),
            subFields: {
                ...((storeFields as any).settings?.subFields || {}),
                autoRenew: {
                    ...((storeFields as any).settings?.subFields?.autoRenew || {}),
                    label: buildSentence(t, 'auto', 'renew'),
                },
                allowGuestAccess: {
                    ...((storeFields as any).settings?.subFields?.allowGuestAccess || {}),
                    label: buildSentence(t, 'allow', 'guest', 'access'),
                },
                maxGuestVisitsPerMonth: {
                    ...((storeFields as any).settings?.subFields?.maxGuestVisitsPerMonth || {}),
                    label: t('maxGuestVisitsPerMonth'),
                    placeholder: t('enterMaxGuestVisitsPerMonth'),
                },
                memberLimits: {
                    ...((storeFields as any).settings?.subFields?.memberLimits || {}),
                    label: buildSentence(t, 'member', 'limits'),
                    placeholder: buildSentence(t, 'enter', 'member', 'limits'),
                },
                minAge: {
                    ...((storeFields as any).settings?.subFields?.minAge || {}),
                    label: buildSentence(t, 'minimum', 'age'),
                    placeholder: buildSentence(t, 'enter', 'minimum', 'age'),
                },
                maxAge: {
                    ...((storeFields as any).settings?.subFields?.maxAge || {}),
                    label: buildSentence(t, 'maximum', 'age'),
                    placeholder: buildSentence(t, 'enter', 'maximum', 'age'),
                },
            },
            renderItem: (item: any) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {item.autoRenew}
                    {item.allowGuestAccess}
                    {item.maxGuestVisitsPerMonth}
                    {item.memberLimits}
                    {item.minAge}
                    {item.maxAge}
                </div>
            ),
        },
        accessHours: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).accessHours,
            type: "custom" as const,
            Component: AccessHoursSelect,
            label: t('accessHours'),
        },
        accessFeatures: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).accessFeatures,
            type: "custom" as const,
            Component: AccessFeaturesSelect,
            label: t('accessFeatures'),
            required:true
        },
        doors: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).doors,
            type: "custom" as const,
            Component: DoorSelect,
            label: buildSentence(t, 'doors'),
        },
        termsAndConditions: {
            ...(storeFields as TFieldConfigObject<TMembershipData>).termsAndConditions,
            type: "custom" as const,
            Component: TermsAndConditionsButton,
            label: buildSentence(t, 'terms', 'and', 'conditions'),
        },
    } as TFieldConfigObject<TMembershipData>), [storeFields, t]);

    const inputs = useInput<TMembershipData | TUpdateMembershipData>({
        fields,
        showRequiredAsterisk: true,
    }) as FormInputs<TMembershipData | TUpdateMembershipData>;

    // React 19: Smooth modal state changes
    const onOpenChange = (state: boolean) => {
        if (state === false) {
            startTransition(() => {
                onClose();
            });
        }
    };

    // React 19: Memoized form buttons for better performance
    const formButtons = useMemo(() => (
        <div className="flex justify-end gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                    e.preventDefault();
                    startTransition(() => {
                        onClose();
                    });
                }}
                data-component-id={componentId}
            >
                {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} data-component-id={componentId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? t('update') : t('add')}
            </Button>
        </div>
    ), [componentId, isEditing, onClose, isSubmitting, t]);

    return (
        <>
            <ModalForm<TMembershipData, TMembershipResponse, IMembershipFormModalExtraProps>
                title={buildSentence(t, isEditing ? 'edit' : 'add', 'membership')}
                description={buildSentence(t, isEditing ? 'edit' : 'add', 'a', 'new', 'membership')}
                open={open}
                onOpenChange={onOpenChange}
                formStore={store}
                footerContent={formButtons}
                width="4xl"
            >
                <div className="space-y-8">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">{buildSentence(t, 'basic', 'information')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {inputs.title}
                            {inputs.enabled}
                            {inputs.sortOrder}
                            {inputs.color}
                        </div>
                        <div className="mt-6">
                            {inputs.description}
                        </div>
                    </div>

                    {/* Pricing Information */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">{buildSentence(t, 'pricing', 'information')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {inputs.price}
                            {inputs.pricePeriod}
                            {inputs.signupFee}
                            {inputs.annualFee}
                            {inputs.cancellationFee}
                            {inputs.discountPercentage}
                        </div>
                    </div>

                    {/* Billing Information */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">{buildSentence(t, 'billing', 'information')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {inputs.billingFrequency}
                            {inputs.paymentPreference}
                            {inputs.billingStartDay}
                            {inputs.prorate}
                            {inputs.expiry}
                            {inputs.annualFeeDate}
                        </div>
                    </div>

                    {/* Settings */}
                    {inputs.settings && (
                        <div>
                            <h3 className="text-sm font-semibold mb-3">{t('otherSettings')}</h3>
                            {inputs.settings}
                        </div>
                    )}

                        {/* Access Hours and Features */}

                    <div>
                      
                            <h3 className="text-sm font-semibold mb-3">{buildSentence(t, 'accessHours', 'and', 'accessFeatures')}</h3>
                      
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {inputs.accessHours}
                            {inputs.accessFeatures}
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">{buildSentence(t, 'terms', 'and', 'conditions')}</h3>
                        <div className="space-y-2">
                            {inputs.termsAndConditions}
                        </div>
                    </div>

                </div>
            </ModalForm >
        </>
    );
});

export default MembershipFormModal;