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

  // React 19: Memoized fields for better performance
  const fields = useMemo(
    () => ({
      ...originalFields,

      ...(user?.level === EUserLevels.ADMIN
        ? {
          limits: {
            ...originalFields.limits,
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
        renderItem: (item: ThemeSettingsDto) => {
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {item.theme}
            </div>
          );
        },
      },
    }),
    [originalFields, user]
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
      description: buildSentence(t, "theme", "preferences"),
    },
  ];

  return (
    <Form<TUserSettingsData, any> formStore={store}>
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
            const Icon = tab.icon;
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

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
