// React
import { useId, useMemo, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { IFileUpload } from "@shared/interfaces/file-upload.interface";
import type { CreateBusinessThemeDto } from "@shared/dtos/business-dtos/business-theme.dto";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Components
import { Form } from "@/components/form-ui/form";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/shared-ui/file-upload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Sun, Moon } from "lucide-react";
import { FONT_OPTIONS } from "@/config/fonts.config";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useInput, type FormInputs } from "@/hooks/use-input";

interface ICustomizationFormProps
  extends THandlerComponentProps<TFormHandlerStore<CreateBusinessThemeDto, any>> { }

const LogoUploadField = ({
  value,
  onChange,
  disabled,
}: {
  value: File | IFileUpload | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) => (
  <FileUpload value={value} onChange={onChange} variant="rectangle" disabled={disabled} />
);

const FaviconUploadField = ({
  value,
  onChange,
  disabled,
}: {
  value: File | IFileUpload | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) => (
  <FileUpload 
    value={value} 
    onChange={onChange} 
    variant="rectangle" 
    disabled={disabled}
    acceptedTypes={['.ico']}
    maxSizeInMB={0.5}
  />
);

export function CustomizationForm({ storeKey, store }: ICustomizationFormProps) {
  const componentId = useId();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'light' | 'dark'>('light');
  const { watch, setValue } = useFormContext<CreateBusinessThemeDto>();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.
      </div>
    );
  }

  const isSubmitting = store(useShallow((state) => state.isSubmitting));
  const setExtra = store((state) => state.setExtra);
  const storeFields = store(useShallow((state) => state.fields)) as TFieldConfigObject<CreateBusinessThemeDto>;

  // Watch fontFamily and automatically set fontUrl
  const fontFamily = watch('fontFamily');
  useEffect(() => {
    if (fontFamily) {
      const selectedFont = FONT_OPTIONS.find(font => font.family === fontFamily);
      if (selectedFont && selectedFont.url) {
        setValue('fontUrl', selectedFont.url, { shouldDirty: false });
      } else if (fontFamily === 'Inter' || !fontFamily) {
        // Inter is default, no URL needed
        setValue('fontUrl', '', { shouldDirty: false });
      }
    }
  }, [fontFamily, setValue]);

  // Update extra when tab changes
  useEffect(() => {
    setExtra('activeTab', activeTab);
  }, [activeTab, setExtra]);

  const fields = useMemo(
    () =>
    ({
      ...storeFields,
      logoLight: {
        ...storeFields.logoLight,
        type: "custom" as const,
        Component: LogoUploadField,
        label: buildSentence(t, "logo"),
      },
      logoDark: {
        ...storeFields.logoDark,
        type: "custom" as const,
        Component: LogoUploadField,
        label: buildSentence(t, "logo"),
      },
      favicon: {
        ...storeFields.favicon,
        type: "custom" as const,
        Component: FaviconUploadField,
        label: buildSentence(t, "favicon"),
      },
      fontFamily: {
        ...storeFields.fontFamily,
        label: buildSentence(t, "font", "family"),
        options: FONT_OPTIONS.map((font) => ({
          value: font.family,
          label: font.name,
        })),
      },
      primaryColorLight: {
        ...storeFields.primaryColorLight,
        label: buildSentence(t, "primary", "color"),
      },
      primaryColorDark: {
        ...storeFields.primaryColorDark,
        label: buildSentence(t, "primary", "color"),
      },
      title: {
        ...storeFields.title,
        label: buildSentence(t, "title"),
        placeholder: buildSentence(t, "enter", "business", "title") || "Enter business title",
      },
    } as TFieldConfigObject<CreateBusinessThemeDto>),
    [storeFields, t]
  );

  const inputs = useInput<CreateBusinessThemeDto>({
    fields,
    showRequiredAsterisk: false,
  }) as FormInputs<CreateBusinessThemeDto>;

  return (
    <Form<CreateBusinessThemeDto, IMessageResponse> formStore={store}>
      <div data-component-id={componentId} className="space-y-4">
        {/* Tabs - Above form */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'light' | 'dark')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="light" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              {buildSentence(t, "light", "theme")}
            </TabsTrigger>
            <TabsTrigger value="dark" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              {buildSentence(t, "dark", "theme")}
            </TabsTrigger>
          </TabsList>
        </Tabs>


        <div className="space-y-6 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 pb-2">
          {/* Title Field */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">{buildSentence(t, "title")}</h3>
            {inputs.title}
          </div>

          {/* Content based on active tab */}
          <div className="w-full space-y-6">
            {activeTab === 'light' && (
              <>
                {/* Logo and Favicon Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">{buildSentence(t, "logo", "and", "favicon")}</h3>
                  <div className="space-y-4">
                    <div>
                      {inputs.logoLight}
                    </div>
                    <div>
                      {inputs.favicon}
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">{buildSentence(t, "colors")}</h3>
                  <div>
                    {inputs.primaryColorLight}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'dark' && (
              <>
                {/* Logo and Favicon Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">{buildSentence(t, "logo", "and", "favicon")}</h3>
                  <div className="space-y-4">
                    <div>
                      {inputs.logoDark}
                    </div>
                    <div>
                      {inputs.favicon}
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">{buildSentence(t, "colors")}</h3>
                  <div>
                    {inputs.primaryColorDark}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Font Option - Outside tabs */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">{buildSentence(t, "font", "family")}</h3>
            {inputs.fontFamily}
          </div>

        </div>

        <div className="flex justify-end gap-2 mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {buildSentence(t, "save", "theme")}
        </Button>
        </div>
      </div>
    </Form>
  );
}
