import { useId, useTransition, useState, useMemo, ReactNode } from "react";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form-ui/form";
import { AppCard } from "@/components/layout-ui/app-card";

// Icons
import {
  DollarSign,
  Shield,
  Building,
  CreditCard,
  Bell,
  Loader2,
  Clock,
  Palette,
} from "lucide-react";

// Types
import { type TUserSettingsData } from "@shared/types/settings.type";
import { type TFormHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import { type FormInputs } from "@/hooks/use-input";

// Hooks
import { useInput } from "@/hooks/use-input";
import type {
  BillingSettingsDto,
  BusinessSettingsDto,
  LimitSettingsDto,
  CurrencySettingsDto,
  NotificationSettingsDto,
  TimeSettingsDto,
  ThemeSettingsDto,
} from "@shared/dtos";
import { FormErrors } from "@/components/shared-ui/form-errors";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums/user.enum";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { usePushPermissionOnToggle } from "@/components/shared-ui/push-notification-setup";

// Component that watches push toggle and requests permission
function PushPermissionWatcher() {
  usePushPermissionOnToggle();
  return null;
}


interface IUserSettingsFormProps
  extends THandlerComponentProps<
    TFormHandlerStore<TUserSettingsData, any, any>
  > { }

export default function UserSettingsForm({
  storeKey,
  store,
}: IUserSettingsFormProps) {
  const { user } = useAuthUser();
  const { t } = useI18n();

  const componentId = useId();
  const [activeTab, setActiveTab] = useState("time");

  if (!store) {
    return (
      <div>
        {buildSentence(t, "form", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  const isSubmitting = store((state) => state.isSubmitting);
  const originalFields = store((state) => state.fields);

  const selectPlaceholder = `${t("select")}...`;

  // React 19: Memoized fields for better performance (labels/placeholders use t() for i18n)
  const fields = useMemo(
    () => ({
      ...originalFields,

      ...(user?.level === EUserLevels.ADMIN
        ? {
          limits: {
            ...originalFields.limits,
            label: "",
            subFields: originalFields.limits?.subFields
              ? {
                ...originalFields.limits.subFields,
                maxSessionsPerDay: { ...originalFields.limits.subFields.maxSessionsPerDay, label: buildSentence(t, "maximum", "sessions", "per", "day"), placeholder: buildSentence(t, "enter", "maximum", "sessions") },
                maxMembersPerSession: { ...originalFields.limits.subFields.maxMembersPerSession, label: buildSentence(t, "maximum", "members", "per", "session"), placeholder: buildSentence(t, "enter", "maximum", "members") },
                maxMembersPerTrainer: { ...originalFields.limits.subFields.maxMembersPerTrainer, label: buildSentence(t, "maximum", "members", "per", "trainer"), placeholder: buildSentence(t, "enter", "maximum", "members") },
                maxSessionDuration: { ...originalFields.limits.subFields.maxSessionDuration, label: buildSentence(t, "maximum", "session", "duration"), placeholder: buildSentence(t, "enter", "duration", "minutes") },
                slotStepMinutes: { ...originalFields.limits.subFields.slotStepMinutes, label: buildSentence(t, "slot", "step", "minutes"), placeholder: buildSentence(t, "enter", "slot", "step") },
              }
              : undefined,
            renderItem: (item: LimitSettingsDto) => {
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {item.maxSessionsPerDay}
                  {item.maxMembersPerSession}
                  {item.maxMembersPerTrainer}
                  {item.maxSessionDuration}
                  {item.slotStepMinutes}
                </div>
              );
            },
          },
          business: {
            ...originalFields.business,
            label: "",
            subFields: originalFields.business?.subFields
              ? {
                ...originalFields.business.subFields,
                businessName: { ...originalFields.business.subFields.businessName, label: buildSentence(t, "business", "name"), placeholder: buildSentence(t, "enter", "business", "name") },
                businessEmail: { ...originalFields.business.subFields.businessEmail, label: buildSentence(t, "business", "email"), placeholder: buildSentence(t, "enter", "email") },
                businessPhone: { ...originalFields.business.subFields.businessPhone, label: buildSentence(t, "business", "phone"), placeholder: buildSentence(t, "enter", "phone", "number") },
                businessAddress: { ...originalFields.business.subFields.businessAddress, label: buildSentence(t, "business", "address"), placeholder: buildSentence(t, "enter", "address") },
                businessLogo: { ...originalFields.business.subFields.businessLogo, label: buildSentence(t, "business", "logo"), placeholder: buildSentence(t, "enter", "logo", "url") },
              }
              : undefined,
            renderItem: (item: BusinessSettingsDto) => {
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {item.businessName}
                  {item.businessEmail}
                  {item.businessPhone}
                  {item.businessAddress}
                  {item.businessLogo}
                </div>
              );
            },
          },
        }
        : {
          limits: undefined,
          business: undefined,
        }),
      time: {
        ...originalFields.time,
        label: "",
        subFields: originalFields.time?.subFields
          ? {
            ...originalFields.time.subFields,
            dateFormat: { ...originalFields.time.subFields.dateFormat, label: buildSentence(t, "date", "format"), placeholder: selectPlaceholder },
            timeFormat: { ...originalFields.time.subFields.timeFormat, label: buildSentence(t, "time", "format"), placeholder: selectPlaceholder },
            timezone: { ...originalFields.time.subFields.timezone, label: t("timezone"), placeholder: selectPlaceholder },
          }
          : undefined,
        renderItem: (item: TimeSettingsDto) => {
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {item.dateFormat}
              {item.timeFormat}
              {item.timezone}
            </div>
          );
        },
      },
      // Only show currency and billing sections if user is at least STAFF level
      ...(user?.level === EUserLevels.ADMIN || user?.level === EUserLevels.PLATFORM_OWNER
        ? {
          currency: {
            ...originalFields.currency,
            label: "",
            subFields: originalFields.currency?.subFields
              ? {
                ...originalFields.currency.subFields,
                defaultCurrency: { ...originalFields.currency.subFields.defaultCurrency, label: buildSentence(t, "default", "currency"), placeholder: selectPlaceholder },
                currencySymbol: { ...originalFields.currency.subFields.currencySymbol, label: buildSentence(t, "currency", "symbol"), placeholder: buildSentence(t, "enter", "currency", "symbol") },
              }
              : undefined,
            renderItem: (item: CurrencySettingsDto) => {
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {item.defaultCurrency}
                  {item.currencySymbol}
                </div>
              );
            },
          },
          billing: {
            ...originalFields.billing,
            label: "",
            subFields: originalFields.billing?.subFields
              ? {
                ...originalFields.billing.subFields,
                taxRate: { ...originalFields.billing.subFields.taxRate, label: buildSentence(t, "tax", "rate"), placeholder: buildSentence(t, "enter", "tax", "rate") },
                invoicePrefix: { ...originalFields.billing.subFields.invoicePrefix, label: buildSentence(t, "invoice", "prefix"), placeholder: buildSentence(t, "enter", "invoice", "prefix") },
                commissionRate: { ...originalFields.billing.subFields.commissionRate, label: buildSentence(t, "commission", "rate"), placeholder: buildSentence(t, "enter", "commission", "rate") },
              }
              : undefined,
            renderItem: (item: BillingSettingsDto) => {
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {item.taxRate}
                  {item.invoicePrefix}
                  {item.commissionRate}
                </div>
              );
            },
          },
        }
        : {
          currency: undefined,
          billing: undefined,
        }),
      notifications: {
        ...originalFields.notifications,
        label: "",
        subFields: originalFields.notifications?.subFields
          ? {
            ...originalFields.notifications.subFields,
            emailEnabled: { ...originalFields.notifications.subFields.emailEnabled, label: buildSentence(t, "email", "enabled") },
            smsEnabled: { ...originalFields.notifications.subFields.smsEnabled, label: buildSentence(t, "sms", "enabled") },
            pushEnabled: { ...originalFields.notifications.subFields.pushEnabled, label: buildSentence(t, "push", "enabled") },
            inAppEnabled: { ...originalFields.notifications.subFields.inAppEnabled, label: buildSentence(t, "in", "app", "enabled") },
          }
          : undefined,
        renderItem: (item: NotificationSettingsDto) => {
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {item.emailEnabled}
              {item.smsEnabled}
              {item.pushEnabled}
              {item.inAppEnabled}
            </div>
          );
        },
      },
      theme: {
        ...originalFields.theme,
        label: "",
        subFields: originalFields.theme?.subFields
          ? {
            ...originalFields.theme.subFields,
            theme: { ...originalFields.theme.subFields.theme, label: t("theme"), placeholder: buildSentence(t, "select", "theme") },
          }
          : undefined,
        renderItem: (item: ThemeSettingsDto) => {
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {item.theme}
            </div>
          );
        },
      },
    }),
    [originalFields, user, t]
  );

  const inputs = useInput<TUserSettingsData>({
    fields: fields as TFieldConfigObject<TUserSettingsData>,
    showRequiredAsterisk: true,
  }) as FormInputs<TUserSettingsData>;

  const settingsTabs = [
    {
      id: "time",
      label: t("time"),
      icon: Clock,
      description: buildSentence(t, "time", "settings"),
    },
    ...(user?.level === EUserLevels.ADMIN
      ? [

        {
          id: "limits",
          label: t("limits"),
          icon: Shield,
          description: buildSentence(t, "session", "and", "member", "limits"),
        },
        {
          id: "business",
          label: t("business"),
          icon: Building,
          description: buildSentence(
            t,
            "business",
            "information",
            "and",
            "branding"
          ),
        },
      ]
      : []),

    ...(user?.level === EUserLevels.ADMIN || user?.level === EUserLevels.PLATFORM_OWNER
      ? [
        {
          id: "currency",
          label: t("currency"),
          icon: DollarSign,
          description: buildSentence(
            t,
            "currency",
            "and",
            "localization",
            "settings"
          ),
        },

        {
          id: "billing",
          label: t("billing"),
          icon: CreditCard,
          description: buildSentence(
            t,
            "billing",
            "and",
            "commission",
            "settings"
          ),
        },
      ]
      : []),
    {
      id: "notifications",
      label: t("notification"),
      icon: Bell,
      description: buildSentence(t, "notification", "preferences"),
    },
    {
      id: "theme",
      label: t("theme"),
      icon: Palette,
    },
  ];

  return (
    <Form<TUserSettingsData, any> formStore={store}>
      <PushPermissionWatcher />
      <AppCard
        header={
          <>
            <p className="text-sm text-muted-foreground">
              {buildSentence(
                t,
                "configure",
                "your",
                "application",
                "settings",
                "and",
                "preferences"
              )}
            </p>
          </>
        }
        footer={
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              data-component-id={componentId}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {buildSentence(t, "save", "settings")}
            </Button>
          </div>
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-between gap-5">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {settingsTabs.map((tab) => {
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                <div className="space-y-4">
                  {tab.id === "limits" && (inputs.limits as ReactNode)}

                  {tab.id === "time" && inputs.time}

                  {tab.id === "currency" && inputs.currency}

                  {tab.id === "business" && inputs.business}

                  {tab.id === "billing" && inputs.billing}

                  {tab.id === "notifications" && inputs.notifications}

                  {tab.id === "theme" && inputs.theme}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
        <FormErrors />
      </AppCard>
    </Form>
  );
}
