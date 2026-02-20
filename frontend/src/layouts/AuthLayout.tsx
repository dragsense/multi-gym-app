// Assets
import logo from "@/assets/logos/logo.png";

// React Router
import { Outlet } from "react-router-dom";
import { useId } from "react";

// Hooks & Components
import { useI18n } from "@/hooks/use-i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTheme } from "@/hooks/use-theme";

// Stores
import { useRegisteredStore } from "@/stores";
import type { TSingleHandlerStore } from "@/stores";
import type { IBusinessTheme } from "@shared/interfaces";
import { useShallow } from "zustand/shallow";

export default function AuthLayout() {
  // React 19: Essential IDs
  const componentId = useId();
  const { t, direction } = useI18n();
  const { resolvedTheme } = useTheme();

  // Get theme from store
  const themeStore = useRegisteredStore<
    TSingleHandlerStore<IBusinessTheme | null, {}>
  >("business-theme-single");
  const theme = themeStore
    ? themeStore(useShallow((state) => state.response))
    : null;

  // Get logo based on theme
  const themeLogo =
    resolvedTheme === "dark"
      ? theme?.logoDark?.url || theme?.logoDark
      : theme?.logoLight?.url || theme?.logoLight;
  const displayLogo = themeLogo || logo;

  return (
    <div
      className="min-h-screen max-w-7xl mx-auto grid md:grid-cols-2 md:gap-10 gap-4 p-4 py-15"
      data-component-id={componentId}
      dir={direction}
    >
      {/* Left Panel */}
      <div className="flex flex-col items-center justify-center gap-4">
        <img
          src={displayLogo}
          alt="Logo"
          className="w-10 md:w-10"
          crossOrigin="anonymous"
        />

        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold text-center">
            {t("welcomeTo")} {theme?.title || t("appName")}
          </h1>
          <p className="text-center text-sm max-w-sm">
            {t("authHeroDescription")}
          </p>
          <a
            href="https://linkedin.com/company/formance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            {t("visitLinkedIn")}
          </a>
        </div>
      </div>

      {/* Right Panel */}

      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          {/*   <div className="mb-4">
            <LanguageSwitcher />
          </div> */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
