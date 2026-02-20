// External Libraries
import { User, LogOut, Loader2, ChevronDown, MapPin } from "lucide-react";
import { useState, useEffect, useRef, useId, useMemo, useTransition, useDeferredValue } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared-ui/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

// Hooks
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserProfile } from "@/hooks/use-user-profile"; // Import useUserProfile
import { useLogout } from "@/hooks/use-logout";
import { useUserRewardPoints } from "@/hooks/use-user-rewards";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { EUserLevels } from "@shared/enums";
import { getSelectedLocation } from "@/utils/location-storage";

// Components
import { NotificationBell } from "@/components/shared-ui/notification-bell";
import { AppBreadcrumb } from "./app-breadcrumb";
import { useRegisteredStore } from "@/stores";
import { type TListHandlerStore } from "@/stores";
import { type ILocation } from "@shared/interfaces/location.interface";
import { LOCATION_SELECTION_STORE_KEY } from "@/page-components/location/location-selection";

// Use separate settings config object

export function AppHeader() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  // Title is available for future use if needed
  const [isDesktopSettingsOpen, setIsDesktopSettingsOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthUser();
  const { profile } = useUserProfile(user?.id); // Fetch user profile

  const { logout, isLoading } = useLogout();
  const { t, direction } = useI18n();

  const Admin = user?.level === EUserLevels.ADMIN;
  const selectedLocation = useMemo(() => getSelectedLocation(), [isLocationModalOpen]);

  // Get location store for location selection
  const locationStore = useRegisteredStore<TListHandlerStore<ILocation, any, any>>(
    `${LOCATION_SELECTION_STORE_KEY}-list`
  );

  // Handle location selection modal
  const handleOpenLocationModal = () => {
    if (locationStore) {
      const setAction = locationStore.getState().setAction;
      setAction("selectLocation");
    }
  };

  // React 19: Deferred user data for better performance
  const deferredUser = useDeferredValue(user);

  // Close desktop settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsDesktopSettingsOpen(false);
      }
    };

    if (isDesktopSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDesktopSettingsOpen]);

  // React 19: Memoized user data for better performance
  const memoizedUserData = useMemo(() => {
    const firstName = deferredUser?.firstName || "Unknown";
    const fullName = deferredUser ? `${deferredUser.firstName} ${deferredUser.lastName}` : "Unknown";
    const email = deferredUser?.email || "Unknown";
    return { firstName, fullName, email };
  }, [deferredUser]);

  // Rewards points (single endpoint)
  const isSuperAdmin = user?.level === EUserLevels.SUPER_ADMIN;
  const { data: rewardsData, isLoading: isLoadingRewards } = useUserRewardPoints(isSuperAdmin);
  const userPoints = rewardsData?.points ?? 0;

  // React 19: Smooth logout transitions
  const handleLogout = (all: boolean = false) => {
    startTransition(() => {
      logout(all);
    });
  };

  return (
    <header
      className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-20 flex h-30 shrink-0 items-center gap-2 transition-[width,height] ease-linear"
      data-component-id={componentId}
    >
      <div className="flex flex-row w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex flex-1 items-center gap-4" ref={settingsRef}>
          <SidebarTrigger className="-ml-1 block md:hidden" />
          <AppBreadcrumb />
        </div>

        <div className="flex items-center gap-3">
          {/* Location Selection (Super Admin Only) */}
          {Admin && locationStore && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenLocationModal}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden md:inline">
                {selectedLocation ? selectedLocation.name : buildSentence(t, 'all', 'locations')}
              </span>
            </Button>
          )}

          {/* Rewards points badge */}
          {isSuperAdmin && <div className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {buildSentence(t, 'points')}: {!isLoadingRewards ? userPoints : "--"}
          </div>}

          {/* Chat */}
          {/* Language Switcher */}
          {/* <LanguageSwitcher /> */}
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />
        </div>

        <div className={`flex items-center gap-5 p-4 text-sm bg-header rounded-full border-1 shadow-sm ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
          {/* Profile Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-all duration-200 rounded-lg"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {/* User image */}
                  <AvatarImage src={profile?.image?.url} alt={memoizedUserData.firstName} crossOrigin="anonymous" />

                  {/* Fallback: initials or icon */}
                  <AvatarFallback className="rounded-lg bg-foreground/2 flex items-center justify-center">
                    {memoizedUserData.firstName ? (
                      memoizedUserData.firstName.substring(0, 2).toUpperCase() // show initials
                    ) : (
                      <User className="w-4 h-4" /> // show icon if no name
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className={`hidden md:block ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <div className="font-semibold text-sm">{memoizedUserData.fullName}</div>
                  <div className="text-xs text-muted-foreground">{memoizedUserData.email}</div>
                </div>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={direction === 'rtl' ? 'start' : 'end'}
              className="w-64 animate-in slide-in-from-top-2 fade-in duration-200 shadow-lg border border-border/50"
              sideOffset={8}
            >
              {/* Mobile User Info Header */}
              <div className="md:hidden flex items-center gap-3 p-4 border-b border-border/50">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={profile?.image?.url} alt={memoizedUserData.firstName} crossOrigin="anonymous"/>
                  <AvatarFallback className="rounded-lg bg-foreground/2 flex items-center justify-center">
                    {memoizedUserData.firstName ? (
                      memoizedUserData.firstName.substring(0, 2).toUpperCase()
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{memoizedUserData.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">{memoizedUserData.email}</div>
                </div>
              </div>

              {/* Desktop Profile Actions */}
              <div className="hidden md:block p-2">

              </div>


              <DropdownMenuSeparator />

              {/* Logout Button */}
              <div className="p-2">
                <DropdownMenuItem onClick={() => handleLogout()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}

                  <span>{buildSentence(t, 'logOut')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLogout(true)}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}

                  <span>{buildSentence(t, 'logOutFromAllDevices')}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
}
