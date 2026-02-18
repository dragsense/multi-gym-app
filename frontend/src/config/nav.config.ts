import {
  Activity,
  type LucideIcon,
  UserCheck,
  FileText,
  CalendarClock,
  Database,
  Shield,
  Users,
  UserPlus,
  UserCog,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Link,
  Home,
  User,
  Box,
  Bot,
  CardSim,
  ClipboardList,
  CreditCard,
  Receipt,
  LogIn,
  LayoutDashboard,
  Image,
  Megaphone,
  MapPin,
  Radio,
  Building2,
  Briefcase,
  Tag,
  MessageCircle,
  Bell,
  Mail,
  LayoutGrid,
  Video,
  Package,
  ShoppingCart,
} from "lucide-react";
import {
  ADMIN_ROUTES,
  ADMIN_SEGMENT,
  MEMBER_SEGMENT,
  PLATFORM_OWNER_SEGMENT,
  ROOT_ROUTE,
  SUPER_ADMIN_SEGMENT,
  STAFF_SEGMENT,
} from "./routes.config";
import { EUserLevels } from "@shared/enums";
import { EResource } from "@shared/enums";
import { ESubscriptionFeatures } from "@shared/enums/business/subscription.enum";
import { canReadResource } from "@/utils/permissions";
import type { IUser } from "@shared/interfaces/user.interface";

type NavItemGroup = {
  groupTitle: string;
  items: NavItem[];
};

// Navigation items type
export type NavItem = {
  title: string;
  icon?: LucideIcon;
  url: string;
  roles?: EUserLevels[];
  children?: NavItem[];
  // Permission-based access control (for STAFF level)
  requiredResource?: EResource;
  requiredAction?: ('read' | 'create' | 'update' | 'delete' | 'manage')[];
  // Subscription feature requirement
  requiredFeature?: ESubscriptionFeatures;
};

const levelSegments: Record<EUserLevels, string> = {
  [EUserLevels.PLATFORM_OWNER]: PLATFORM_OWNER_SEGMENT,
  [EUserLevels.SUPER_ADMIN]: SUPER_ADMIN_SEGMENT,
  [EUserLevels.ADMIN]: ADMIN_SEGMENT,
  [EUserLevels.STAFF]: STAFF_SEGMENT,
  [EUserLevels.MEMBER]: MEMBER_SEGMENT,
};

// Single source of truth for all navigation items.
// Items are filtered by the user's role and then prefixed with the correct segment.
const baseNavItems: NavItemGroup[] = [
  {
    groupTitle: "home",
    items: [
      {
        title: "dashboard",
        url: ADMIN_ROUTES.DASHBOARD,
        icon: Home,
      },
      {
        title: "systemDashboard",
        url: ADMIN_ROUTES.SYSTEM_DASHBOARD,
        icon: Home,
        roles: [EUserLevels.PLATFORM_OWNER],
      },
    ],
  },
  {
    groupTitle: "Schedule",
    items: [
      {
        title: "sessions",
        url: ADMIN_ROUTES.SESSIONS,
        icon: Calendar,
        roles: [EUserLevels.ADMIN, EUserLevels.MEMBER],
        requiredResource: EResource.SESSIONS,
        requiredAction: ['read', 'manage'],
        requiredFeature: ESubscriptionFeatures.SESSIONS,
      },
      {
        title: "tasks",
        url: ADMIN_ROUTES.TASKS,
        icon: LayoutDashboard,
        roles: [EUserLevels.ADMIN, EUserLevels.STAFF],
        requiredResource: EResource.TASKS,
        requiredAction: ['read', 'manage'],
        requiredFeature: ESubscriptionFeatures.TASKS,
      },
      {
        title: "tickets",
        url: ADMIN_ROUTES.TICKETS,
        icon: MessageCircle,
        roles: [EUserLevels.SUPER_ADMIN, EUserLevels.PLATFORM_OWNER],
      },
      {
        title: "checkins",
        url: ADMIN_ROUTES.CHECKINS,
        icon: LogIn,
        roles: [EUserLevels.ADMIN, EUserLevels.MEMBER],
        requiredResource: EResource.CHECKINS,
        requiredAction: ['read', 'manage'],
        requiredFeature: ESubscriptionFeatures.CHECKINS,
      },
    ],
  },
  {
    groupTitle: "Billing",
    items: [
      {
        title: "billings",
        url: ADMIN_ROUTES.BILLINGS,
        icon: DollarSign,
        requiredResource: EResource.BILLINGS,
        requiredAction: ['read', 'manage'],
        roles: [EUserLevels.ADMIN, EUserLevels.MEMBER, EUserLevels.STAFF],
      },
      {
        title: "subscription",
        url: ADMIN_ROUTES.SUBSCRIPTION,
        icon: ClipboardList,
        roles: [],
      },
      {
        title: "business",
        url: ADMIN_ROUTES.BUSINESS,
        icon: Building2,
        roles: [EUserLevels.PLATFORM_OWNER],
      },
    ],
  },
  {
    groupTitle: "Referral",
    items: [
      {
        title: "referralLinks",
        url: ADMIN_ROUTES.REFERRAL_LINKS,
        icon: Link,
        roles: [EUserLevels.SUPER_ADMIN],
      },
    ],
  },
  {
    groupTitle: "Communications",
    items: [
      {
        title: "chat",
        url: ADMIN_ROUTES.CHAT,
        icon: MessageCircle,
        roles: [EUserLevels.ADMIN, EUserLevels.MEMBER, EUserLevels.STAFF],
        requiredResource: EResource.CHAT,
        requiredAction: ['read', 'manage'],
        requiredFeature: ESubscriptionFeatures.CHAT,
      },
      {
        title: "notifications",
        url: ADMIN_ROUTES.NOTIFICATIONS,
        icon: Bell, // Assuming Bell icon is imported
      },
      {
        title: "automation",
        url: ADMIN_ROUTES.AUTOMATION,
        icon: Bot,
        roles: [],
        requiredFeature: ESubscriptionFeatures.EMAIL_TEMPLATES,
      }, 
    ],
  },
  {
    groupTitle: "Store",
    items: [
      {
        title: "store",
        url: ADMIN_ROUTES.STORE,
        icon: Package,
        roles: [EUserLevels.STAFF, EUserLevels.MEMBER],
        requiredFeature: ESubscriptionFeatures.E_COMMERCE,
      },
      {
        title: "cart",
        url: ADMIN_ROUTES.CART,
        icon: ShoppingCart,
        roles: [EUserLevels.STAFF, EUserLevels.MEMBER],
        requiredFeature: ESubscriptionFeatures.E_COMMERCE,
      },
      {
        title: "myOrders",
        url: ADMIN_ROUTES.ORDERS,
        icon: Receipt,
        roles: [EUserLevels.STAFF, EUserLevels.MEMBER],
        requiredFeature: ESubscriptionFeatures.E_COMMERCE,
      },
      {
        title: "orders",
        url: ADMIN_ROUTES.ORDERS,
        icon: Receipt,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.E_COMMERCE,
      },
    ],
  },
  {
    groupTitle: "Content Management",
    items: [
      {
        title: "emailTemplates",
        url: ADMIN_ROUTES.CMS.EMAIL_TEMPLATES,
        icon: Mail,
        roles: [],
        requiredFeature: ESubscriptionFeatures.EMAIL_TEMPLATES,
      }, 
      {
        title: "pages",
        url: ADMIN_ROUTES.CMS.PAGES,
        icon: LayoutGrid,
        roles: [EUserLevels.PLATFORM_OWNER, EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.PAGES,
      },
      {
        title: "faqs",
        url: ADMIN_ROUTES.CMS.FAQS,
        icon: FileText,
        requiredFeature: ESubscriptionFeatures.FAQS,
      },
    ],
  },
  {
    groupTitle: "My Settings",
    items: [
      {
        title: "userAvailability",
        url: ADMIN_ROUTES.USER_AVAILABILITY,
        icon: Calendar,
        roles: [EUserLevels.STAFF, EUserLevels.MEMBER],
      },
      {
        title: "account",
        url: ADMIN_ROUTES.ACCOUNT,
        icon: User,
      },
      {
        title: "settings",
        url: ADMIN_ROUTES.SETTINGS,
        icon: Settings,
      },
      {
        title: "paymentProcessor",
        url: ADMIN_ROUTES.PAYMENT_PROCESSOR,
        icon: CreditCard,
        roles: [],
      },
    ],
  },
  {
    groupTitle: "Logs",
    items: [
      {
        title: "activityLogs",
        url: ADMIN_ROUTES.ACTIVITY_LOGS,
        icon: Activity,
        roles: [EUserLevels.ADMIN, EUserLevels.PLATFORM_OWNER],
      },
    ],
  },
  {
    groupTitle: "Users",
    items: [
      {
        title: "users",
        url: ADMIN_ROUTES.USERS,
        icon: UserCheck,
        roles: [],
      },
      {
        title: "members",
        url: ADMIN_ROUTES.MEMBERS,
        icon: UserPlus,
        roles: [EUserLevels.ADMIN],
        requiredResource: EResource.MEMBERS,
        requiredAction: ['read', 'manage'],
      },
      {
        title: "memberships",
        url: ADMIN_ROUTES.MEMBERSHIPS,
        icon: CreditCard,
        roles: [EUserLevels.ADMIN],
        requiredResource: EResource.MEMBERSHIPS,
        requiredAction: ['read', 'manage'],
        requiredFeature: ESubscriptionFeatures.MEMBERSHIPS,
      },

      {
        title: "staff",
        url: ADMIN_ROUTES.STAFF,
        icon: Users,
        roles: [EUserLevels.ADMIN],
        requiredResource: EResource.STAFF,
        requiredAction: ['read', 'manage'],
        requiredFeature: ESubscriptionFeatures.STAFF,
      },

      {
        title: "roles",
        url: ADMIN_ROUTES.ROLES,
        icon: Shield,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.ROLES,
      },
      {
        title: "linkMembers",
        url: ADMIN_ROUTES.LINK_MEMBERS.INDEX,
        icon: Link,
        roles: [EUserLevels.MEMBER],
        requiredFeature: ESubscriptionFeatures.LINK_MEMBERS,
      },
    ],
  },
  {
    groupTitle: "E-commerce",
    items: [
      {
        title: "products",
        url: ADMIN_ROUTES.PRODCUTS.INDEX,
        icon: Box,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.E_COMMERCE,
      },
      {
        title: "productTypes",
        url: ADMIN_ROUTES.PRODCUTS.PRODUCT_TYPES,
        icon: Package,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.E_COMMERCE,
      },
      {
        title: "attributes",
        url: ADMIN_ROUTES.PRODCUTS.ATTRIBUTES,
        icon: Tag,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.E_COMMERCE,
      },
    ],
  },
  {
    groupTitle: "Files",
    items: [
      {
        title: "files",
        url: ADMIN_ROUTES.FILES,
        icon: FileText,
        roles: [],
      },
      {
        title: "bannerImages",
        url: ADMIN_ROUTES.BANNER_IMAGES,
        icon: Image,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.ADVERTISEMENTS,
      },
    ],
  },
  {
    groupTitle: "Marketing",
    items: [
      {
        title: "advertisements",
        url: ADMIN_ROUTES.ADVERTISEMENTS,
        icon: Megaphone,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.ADVERTISEMENTS,
      },
      {
        title: "serviceOffers",
        url: ADMIN_ROUTES.SERVICE_OFFERS,
        icon: Tag,
        roles: [EUserLevels.ADMIN, EUserLevels.STAFF],
        requiredResource: EResource.SERVICE_OFFERS,
        requiredAction: ['read', 'manage'],   
        requiredFeature: ESubscriptionFeatures.SERVICE_OFFERS,
      },
    ],
  },
  {
    groupTitle: "Services",
    items: [
      {
        title: "trainerServices",
        url: ADMIN_ROUTES.TRAINER_SERVICES,
        icon: Briefcase,
        roles: [EUserLevels.ADMIN, EUserLevels.STAFF],
        requiredFeature: ESubscriptionFeatures.TRAINER_SERVICES,
        requiredResource: EResource.TRAINER_SERVICES,
      },
    ],
  },
  {
    groupTitle: "Configuration",
    items: [
      {
        title: "customization",
        url: ADMIN_ROUTES.CUSTOMIZATION,
        icon: Settings,
        roles: [EUserLevels.SUPER_ADMIN],
        requiredFeature: ESubscriptionFeatures.CUSTOMIZATION,
      },
      {
        title: "locations",
        url: ADMIN_ROUTES.LOCATIONS,
        icon: MapPin,
        roles: [EUserLevels.ADMIN,],
        requiredFeature: ESubscriptionFeatures.LOCATIONS,
      },
      {
        title: "deviceReaders",
        url: ADMIN_ROUTES.DEVICE_READERS,
        icon: Radio,
        roles: [EUserLevels.ADMIN,],
        requiredFeature: ESubscriptionFeatures.LOCATIONS,
      },
   /*    {
        title: "facilityInfo",
        url: ADMIN_ROUTES.FACILITY_INFO,
        icon: Building2,
        roles: [EUserLevels.ADMIN,],
      }, */
      {
        title: "cameras",
        url: ADMIN_ROUTES.CAMERAS,
        icon: Video,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.VIDEO_STREAM,
      },
    ],
  },
  {
    groupTitle: "Schedules",
    items: [
      {
        title: "schedules",
        url: ADMIN_ROUTES.SCHEDULES,
        icon: CalendarClock,
        roles: [],
      },
    ],
  },
  {
    groupTitle: "Equipment",
    items: [
      {
        title: "equipmentReservations",
        url: ADMIN_ROUTES.EQUIPMENT_RESERVATIONS,
        icon: Package,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.EQUIPMENT_RESERVATION,
      },
      {
        title: "equipment",
        url: ADMIN_ROUTES.EQUIPMENT,
        icon: Package,
        roles: [EUserLevels.ADMIN],
        requiredFeature: ESubscriptionFeatures.EQUIPMENT_RESERVATION,
      },
    ],
  },
  {
    groupTitle: "Queue Board",
    items: [
      {
        title: "queueBoard",
        url: ADMIN_ROUTES.QUEUE_BOARD,
        icon: BarChart3,
        roles: [],
      },
    ],
  },
  {
    groupTitle: "Cache",
    items: [
      {
        title: "cache",
        url: ADMIN_ROUTES.CACHE,
        icon: Database,
        roles: [],
      },
    ],
  },
];

const filterNavItemsByRole = (
  items: NavItem[],
  level: EUserLevels,
  user?: IUser | null,
  subscriptionFeatures?: string[]
): NavItem[] =>
  items
    .filter((item) => {
      // Check subscription feature requirement
      if (item.requiredFeature) {
        // For platform owner and super admin, skip feature check
        if (level === EUserLevels.PLATFORM_OWNER) {
          // Skip feature check for platform owners
        } else {
          // For admin, staff, and member, check if feature is available
          if (!subscriptionFeatures || !subscriptionFeatures.includes(item.requiredFeature)) {
            return false;
          }
        }
      }

      if (level === EUserLevels.STAFF) {
        if (item.requiredResource) {
          return canReadResource(user, item.requiredResource);
        }
      }

      // For other levels, check role-based access
      if (item.roles && !item.roles.includes(level)) {
        return false;
      }

      return true;
    })
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItemsByRole(item.children, level, user, subscriptionFeatures) : undefined,
    }));

const buildNavItemsForLevel = (level: EUserLevels, user?: IUser | null, subscriptionFeatures?: string[]): NavItemGroup[] => {
  const segment = levelSegments[level];

  return baseNavItems
    .map((group) => {
      const filteredItems = filterNavItemsByRole(group.items, level, user, subscriptionFeatures).map((item) => ({
        ...item,
        url: `${segment}/${item.url}`,
        children: item.children?.map((child) => ({
          ...child,
          url: `${segment}/${child.url}`,
        })),
      }));

      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
};

// Export nav items organized by user level
// Note: For STAFF level, pass user to filter by permissions
// Note: subscriptionFeatures should be passed to filter by subscription features
export const navItemsByLevel = {
  [EUserLevels.PLATFORM_OWNER]: (user?: IUser | null, subscriptionFeatures?: string[]) => buildNavItemsForLevel(EUserLevels.PLATFORM_OWNER, user, subscriptionFeatures),
  [EUserLevels.SUPER_ADMIN]: (user?: IUser | null, subscriptionFeatures?: string[]) => buildNavItemsForLevel(EUserLevels.SUPER_ADMIN, user, subscriptionFeatures),
  [EUserLevels.ADMIN]: (user?: IUser | null, subscriptionFeatures?: string[]) => buildNavItemsForLevel(EUserLevels.ADMIN, user, subscriptionFeatures),
  [EUserLevels.STAFF]: (user?: IUser | null, subscriptionFeatures?: string[]) => buildNavItemsForLevel(EUserLevels.STAFF, user, subscriptionFeatures),
  [EUserLevels.MEMBER]: (user?: IUser | null, subscriptionFeatures?: string[]) => buildNavItemsForLevel(EUserLevels.MEMBER, user, subscriptionFeatures),
};