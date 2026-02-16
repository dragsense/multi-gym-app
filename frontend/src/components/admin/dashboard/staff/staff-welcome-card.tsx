// React
import { useId, useState, useEffect } from "react";

// Components
import { Clock, Sparkles } from "lucide-react";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useAuthUser } from "@/hooks/use-auth-user";
import { AppCard } from "@/components/layout-ui/app-card";

/**
 * Welcome card with live time for trainer dashboard
 */
export function StaffWelcomeCard() {
  const componentId = useId();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t("goodMorning") || "Good Morning";
    if (hour < 17) return t("goodAfternoon") || "Good Afternoon";
    return t("goodEvening") || "Good Evening";
  };

  const userName = user?.firstName || t("trainer") || "Trainer";

  return (
    <div data-component-id={componentId}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Welcome Message */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("welcome") || "Welcome"}, {userName}!
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("trainerDashboardSubtitle") || "Here's what's happening with your schedule today."}
          </p>
        </div>

        {/* Right: Live Clock */}
        <AppCard>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-3xl md:text-4xl font-mono font-bold text-foreground tabular-nums">
                {formatTime(currentTime)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </p>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
