import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { PageInnerLayout } from "@/layouts";
import { FormHandler } from "@/handlers/form-handler";
import { CustomizationForm } from "@/components/admin/customization";
import { upsertBusinessTheme } from "@/services/business/business-theme.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { CreateBusinessThemeDto, UpdateBusinessThemeDto } from "@shared/dtos/business-dtos/business-theme.dto";
import { CustomizationPreview } from "@/components/admin/customization";
import { toast } from "sonner";
import { strictDeepMerge } from "@/utils";
import { FONT_OPTIONS } from "@/config/fonts.config";
import { useRegisteredStore, type TSingleHandlerStore } from "@/stores";
import { BUSINESS_THEME_STORE_KEY } from "@/components/layout-ui/business-theme";
import type { IBusinessTheme } from "@shared/interfaces";
import { useShallow } from "zustand/shallow";

const Header = () => null;

export default function CustomizationPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  
  // Get theme from store
  const themeStore = useRegisteredStore<TSingleHandlerStore<IBusinessTheme | null, {}>>(BUSINESS_THEME_STORE_KEY + "-single");
  const currentTheme = themeStore ? themeStore(useShallow((state) => state.response)) : null;


  const STORE_KEY = "business-customization";

  const initialValues = useMemo<CreateBusinessThemeDto>(() => {
    const INITIAL_VALUES: CreateBusinessThemeDto = {
      title: "",
      primaryColorLight: "#c10320",
      primaryColorDark: "#c10320",
      fontFamily: FONT_OPTIONS[2].family,
      fontUrl: FONT_OPTIONS[2].url,
      logoLight: null,
      logoDark: null,
      favicon: null,
    };

    if (!currentTheme) return INITIAL_VALUES;

    return strictDeepMerge<CreateBusinessThemeDto | UpdateBusinessThemeDto>(INITIAL_VALUES, currentTheme as CreateBusinessThemeDto | UpdateBusinessThemeDto);
  }, [currentTheme]);

  return (
    <PageInnerLayout Header={<Header />}>
      <FormHandler<CreateBusinessThemeDto | UpdateBusinessThemeDto, any, { activeTab?: 'light' | 'dark' }>
        mutationFn={upsertBusinessTheme}
        FormComponent={({ storeKey, store }) => (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Settings (1/3) */}
            <div className="lg:col-span-1 space-y-6">
              <CustomizationForm storeKey={storeKey} store={store} />
            </div>

            {/* Right Column - Preview (2/3) */}
              <div className="lg:col-span-3">
              <CustomizationPreview store={store} />
            </div>
          </div>
        )}
        storeKey={STORE_KEY}
        initialValues={initialValues}
        validationMode={EVALIDATION_MODES.OnSubmit}
        dto={CreateBusinessThemeDto}
        isEditing={!!currentTheme}
                onSuccess={(response) => {
                  toast.success(buildSentence(t, "theme", "saved", "successfully"));
                  queryClient.invalidateQueries({ queryKey: [BUSINESS_THEME_STORE_KEY + "-single"] });
              
                }}
        onError={(error) => {
          toast.error(buildSentence(t, "failed", "to", "save", "theme") + ": " + error?.message);
        }}
      />
    </PageInnerLayout>
  );
}
