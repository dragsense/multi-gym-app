// React
import { useId } from "react";
import { useNavigate } from "react-router-dom";

// Components
import { Calendar, DollarSign, MessageCircle, Clock, ChevronRight } from "lucide-react";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useAuthUser } from "@/hooks/use-auth-user";

// Config
import { ADMIN_ROUTES, STAFF_SEGMENT } from "@/config/routes.config";
import { buildRoutePath } from "@/lib/utils";
import { AppCard } from "@/components/layout-ui/app-card";
import { EResource } from "@shared/enums";
import { canReadResource } from "@/utils/permissions";

/**
 * Quick action buttons card for staff dashboard
 * Provides easy access to common staff actions
 */
export function StaffQuickActionsCard() {
  const componentId = useId();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const allQuickActions = [
    {
      id: "schedule",
      label: t("scheduleSession") || "Schedule Session",
      description: t("scheduleSessionDesc") || "Book a new session",
      icon: Calendar,
      onClick: () => navigate(buildRoutePath(`${STAFF_SEGMENT}/${ADMIN_ROUTES.SESSIONS}`)),
      requiredResource: EResource.SESSIONS,
    },
    {
      id: "billings",
      label: t("viewBillings") || "View Billings",
      description: t("viewBillingsDesc") || "Check payment status",
      icon: DollarSign,
      onClick: () => navigate(buildRoutePath(`${STAFF_SEGMENT}/${ADMIN_ROUTES.BILLINGS}`)),
      requiredResource: EResource.BILLINGS,
    },
    {
      id: "chat",
      label: t("startChat") || "Start Chat",
      description: t("startChatDesc") || "Message your clients",
      icon: MessageCircle,
      onClick: () => navigate(buildRoutePath(`${STAFF_SEGMENT}/${ADMIN_ROUTES.CHAT}`)),
      requiredResource: EResource.CHAT,
    },
    {
      id: "availability",
      label: t("setAvailability") || "Set Availability",
      description: t("setAvailabilityDesc") || "Manage your schedule",
      icon: Clock,
      onClick: () => navigate(buildRoutePath(`${STAFF_SEGMENT}/${ADMIN_ROUTES.USER_AVAILABILITY}`)),
      // User availability doesn't require a specific resource permission
      requiredResource: undefined,
    },
  ];

  // Filter actions based on user permissions
  const quickActions = allQuickActions.filter((action) => {
    if (!action.requiredResource) {
      return true; // Always show actions without resource requirements
    }
    return canReadResource(user, action.requiredResource);
  });

  return (
    <div data-component-id={componentId}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <AppCard
              key={action.id}
              onClick={action.onClick}
              className="cursor-pointer"
            >
              <div className="group flex items-center gap-4 p-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {action.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            </AppCard>
          );
        })}
      </div>
    </div>
  );
}
