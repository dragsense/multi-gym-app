import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, LogOutIcon, X } from "lucide-react";
import { useId, useTransition } from "react";

// UI Components
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Config
import { navItemsByLevel } from "@/config/nav.config";
import { ROOT_ROUTE } from "@/config/routes.config";

// Utils
import { matchRoutePath } from "@/lib/utils";

// Hooks
import { useLogout } from "@/hooks/use-logout";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useTheme } from "@/hooks/use-theme";

// Stores
import { useRegisteredStore } from "@/stores";
import type { TSingleHandlerStore } from "@/stores";
import type { IBusinessTheme, IUser } from "@shared/interfaces";
import { useShallow } from "zustand/shallow";

// Assets
import logo from "@/assets/logos/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BUSINESS_THEME_STORE_KEY } from "./business-theme";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  themeClass?: string;
}

export function AppSidebar({ themeClass = "", ...props }: AppSidebarProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const location = useLocation();
  const { logout, isLoading } = useLogout();
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useAuthUser();
  const { t, direction } = useI18n();
  const { resolvedTheme } = useTheme();
  
  // Get theme from store
  const themeStore = useRegisteredStore<TSingleHandlerStore<IBusinessTheme | null, {}>>(BUSINESS_THEME_STORE_KEY + "-single");
  const theme = themeStore ? themeStore(useShallow((state) => state.response)) : null;
  
  // Get logo based on theme
  const themeLogo = resolvedTheme === 'dark' 
    ? (theme?.logoDark?.url || theme?.logoDark) 
    : (theme?.logoLight?.url || theme?.logoLight);
  const displayLogo = themeLogo || logo;
  const displayBrandName = theme?.title || t("appName");

  // Get navigation items based on user level and subscription features
  const navItems = React.useMemo(() => {
    if (!user) return [];

    // Get subscription features from user object (added by /auth/me endpoint)
    const subscriptionFeatures = (user as IUser).subscriptionFeatures || [];

    return navItemsByLevel[user.level]?.(user, subscriptionFeatures) || [];
  }, [user]);

  const [expandedItems, setExpandedItems] = React.useState<
    Record<string, boolean>
  >({});

  React.useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    navItems.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some((child) =>
            matchRoutePath(child.url, location.pathname)
          );
          const isParentActive = matchRoutePath(item.url, location.pathname);

          newExpandedItems[item.title] =
            isChildActive || isParentActive || item.title === t("dashboard");
        }
      });
    });
    setExpandedItems(newExpandedItems);
  }, [location.pathname, navItems, t]);

  // Auto-close mobile sidebar on route change
  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  // React 19: Smooth sidebar interactions
  const toggleExpanded = (title: string) => {
    startTransition(() => {
      setExpandedItems((prev) => ({
        ...prev,
        [title]: !prev[title],
      }));
    });
  };

  // React 19: Memoized sidebar header for better performance
  const renderSidebarHeader = React.useMemo(
    () =>
      (showCloseButton: boolean = false) =>
      (
        <SidebarHeader className="mt-5" data-component-id={componentId}>
          <div
            className={
              showCloseButton
                ? `flex items-center justify-between p-4 ${direction === "rtl" ? "flex-row-reverse" : ""
                }`
                : ""
            }
          >
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-transparent">
                  <Link
                    to={ROOT_ROUTE}
                    className={`h-13 flex items-center gap-2`}
                  >
                    <img
                      src={displayLogo}
                      className="h-full object-contain"
                      alt={displayBrandName}
                      crossOrigin="anonymous"
                    />
                    <span className="text-900 text-xl uppercase">
                      {displayBrandName}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => setOpenMobile(false))}
                className="h-8 w-8 p-0 hover:bg-muted/50"
                aria-label={buildSentence(t, "close", "menu")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SidebarHeader>
      ),
    [componentId, setOpenMobile, startTransition, t, direction, displayLogo, displayBrandName]
  );

  const renderNavItems = () => (
    <SidebarContent className="mt-2">
      {navItems.map((group, groupIndex) => (
        <SidebarGroup key={group.groupTitle || groupIndex}>
          {group.groupTitle && (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              {t(group.groupTitle)}
            </div>
          )}
          <SidebarGroupContent className="flex flex-col">
            <SidebarMenu>
              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems[item.title];

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(item.title)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={matchRoutePath(item.url, location.pathname)}
                            tooltip={t(item.title)}
                            className="group cursor-pointer text-muted-foreground/80 p-6 rounded-xl hover:bg-muted/50 transition-all duration-200"
                          >
                            {item.icon && (
                              <item.icon className="group-data-[active=true]:text-foreground h-6 w-6" />
                            )}
                            <span className="font-medium">{t(item.title)}</span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub
                            className={`${direction === "rtl"
                              ? "mr-4 border-r pr-4"
                              : "ml-4 border-l pl-4"
                              } border-sidebar-border`}
                          >
                            {item.children?.map((child) => (
                              <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === child.url}
                                  className="group cursor-pointer text-foreground/80 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                                >
                                  <Link to={child.url}>
                                    {child.icon && (
                                      <child.icon className="group-data-[active=true]:text-foreground hover:text-foreground h-5 w-5" />
                                    )}
                                    <span className="font-medium">
                                      {t(child.title)}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <Link to={item.url}>
                      <SidebarMenuButton
                        isActive={matchRoutePath(item.url, location.pathname)}
                        tooltip={t(item.title)}
                        className="group cursor-pointer text-foreground/80 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        {item.icon && (
                          <item.icon className="group-data-[active=true]:text-foreground hover:text-foreground h-6 w-6" />
                        )}
                        <span className="font-medium">{t(item.title)}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );

  const renderSidebarFooter = () => (
    <SidebarFooter>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={`${direction === "rtl" ? "justify-end" : "justify-start"
              } gap-2 mb-2 w-full`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOutIcon className="h-4 w-4" />
            )}
            <span>
              {isLoading
                ? buildSentence(t, "logging", "out")
                : buildSentence(t, "log", "out")}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={direction === "rtl" ? "end" : "start"}
          className="w-56"
        >
          <DropdownMenuLabel>
            {buildSentence(t, "logout", "options")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => startTransition(() => logout(false))}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {buildSentence(t, "log", "out", "this", "device")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => startTransition(() => logout(true))}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {buildSentence(t, "log", "out", "from", "all", "devices")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );

  const sidebarSide = direction === "rtl" ? "right" : "left";

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block dark">
        <Sidebar
          collapsible="offcanvas"
          themeClass={themeClass}
          dir={direction}
          side={sidebarSide}
          {...props}
        >
          {renderSidebarHeader()}
          {renderNavItems()}
          {renderSidebarFooter()}
        </Sidebar>
      </div>

      {/* Mobile Sidebar with Close Button */}
      <div className="md:hidden">
        <Sidebar
          collapsible="offcanvas"
          themeClass={themeClass}
          dir={direction}
          side={sidebarSide}
          {...props}
        >
          {renderSidebarHeader(true)}
          {renderNavItems()}
          {renderSidebarFooter()}
        </Sidebar>
      </div>
    </>
  );
}
