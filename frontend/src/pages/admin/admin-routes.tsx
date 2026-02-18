import { lazy } from "react";
import { ADMIN_ROUTES } from "@/config/routes.config";
import { createRouteElement } from "@/lib/route-utils";
import { ESubscriptionFeatures, EUserLevels } from "@shared/enums";
import { EResource } from "@shared/enums";
import { canReadResource, hasResourcePermission } from "@/utils/permissions";
import type { IUser } from "@shared/interfaces/user.interface";

// Route definition type
export type RouteDefinition = {
  path: string;
  element: React.ReactElement;
};

// React 19: Lazy load admin pages with enhanced performance
const UsersPage = lazy(() => import("./users"));
const StaffDetailPage = lazy(() => import("./staff/detail"));
const MembersPage = lazy(() => import("./members"));
const MemberDetailPage = lazy(() => import("./members/detail"));
const MembershipsPage = lazy(() => import("./memberships"));
const SessionsPage = lazy(() => import("./sessions"));
const BillingsPage = lazy(() => import("./billings"));
const ReferralLinksPage = lazy(() => import("./referral-links"));
const ActivityLogsPage = lazy(() => import("./activity-logs"));
const FilesPage = lazy(() => import("./files"));
const SchedulesPage = lazy(() => import("./schedules"));
const WorkersPage = lazy(() => import("./workers"));
const RolesPage = lazy(() => import("./roles"));
const QueuesPage = lazy(() => import("./queues"));
const SettingsPage = lazy(() => import("./settings"));
const PaymentProcessorPage = lazy(() => import("./settings/payment-processor"));
const CachePage = lazy(() => import("./cache"));
const UserAvailabilityPage = lazy(() => import("./user-availability"));
const AccountPage = lazy(() => import("./account"));
const ProductPage = lazy(() => import("./products"));
const ProductTypesPage = lazy(() => import("./products/product-types"));
const AttributesPage = lazy(() => import("./products/attributes"));
const AutomationPage = lazy(() => import("./automation"))

const DashboardPage = lazy(() => import("./dashboards/dashboard"));
const SystemDashboardPage = lazy(() => import("./dashboards/system-dashboard"));
const PlatformOwnerDashboardPage = lazy(() => import("./dashboards/platform-dashboard"));
const SuperAdminDashboardPage = lazy(() => import("./dashboards/super-admin-dashboard"));
const MemberDashboardPage = lazy(() => import("./dashboards/member-dashboard"));
const StaffDashboardPage = lazy(() => import("./dashboards/staff-dashboard"));
const SubscriptionPage = lazy(() => import("./subscription"));
const BusinessPage = lazy(() => import("./business"));
const BusinessDetailPage = lazy(() => import("./business/detail"));
const CheckinsPage = lazy(() => import("./checkins"));
const TasksPage = lazy(() => import("./tasks"));
const TicketsPage = lazy(() => import("./tickets"));
const TicketDetailPage = lazy(() => import("./tickets/detail"));
const StaffPage = lazy(() => import("./staff"));
const BannerImagesPage = lazy(() => import("./banner-images"));
const AdvertisementsPage = lazy(() => import("./advertisements"));
const LocationsPage = lazy(() => import("./locations"));
const DeviceReadersPage = lazy(() => import("./device-readers"));
const FacilityInfoPage = lazy(() => import("./facility-info"));
const TrainerServicesPage = lazy(() => import("./trainer-services"));
const ServiceOffersPage = lazy(() => import("./service-offers"));
const ChatPage = lazy(() => import("./chat"));
const NotificationsPage = lazy(() => import("./notifications"));
const EmailTemplatesPage = lazy(() => import("./cms/email-templates"));
const CreateEmailTemplatePage = lazy(() => import("./cms/email-templates/create"));
const EditEmailTemplatePage = lazy(() => import("./cms/email-templates/edit"));
const EmailTemplatePreviewPage = lazy(() => import("./cms/email-templates/preview"));
const PagesPage = lazy(() => import("./cms/pages"));
const CreatePagePage = lazy(() => import("./cms/pages/create"));
const EditPagePage = lazy(() => import("./cms/pages/edit"));
const PagePreviewPage = lazy(() => import("./cms/pages/preview"));
const FaqsPage = lazy(() => import("./cms/faqs"));
const CamerasPage = lazy(() => import("./cameras"));
const EquipmentReservationsPage = lazy(() => import("./equipment-reservations"));
const EquipmentPage = lazy(() => import("./equipment"));
const LinkMembersPage = lazy(() => import("./link-members"));
const LinkMemberDetailPage = lazy(() => import("./link-members/detail"));
const CustomizationPage = lazy(() => import("./customization"));
const StorePage = lazy(() => import("./store"));
const StoreProductDetailPage = lazy(() => import("./store/detail"));
const CartPage = lazy(() => import("./cart"));
const CheckoutPage = lazy(() => import("./checkout"));
const OrdersPage = lazy(() => import("./orders"));
const OrderDetailPage = lazy(() => import("./orders/detail"));
// Helper to create route with component and user level
const createRoute = (
  path: string,
  Component: React.LazyExoticComponent<React.ComponentType<Record<string, never>>>,
  userLevel: string,
  message?: string | string[]
): RouteDefinition => ({
  path,
  element: createRouteElement(Component, userLevel, message),
});

// Common routes (shared across ALL user levels)
const commonRoutes = (userLevel: string): RouteDefinition[] => [
  //createRoute(ADMIN_ROUTES.BILLINGS, BillingsPage, userLevel, ["loading", "billings"]),

  createRoute(ADMIN_ROUTES.SETTINGS, SettingsPage, userLevel, ["loading", "settings"]),
  createRoute(ADMIN_ROUTES.CMS.FAQS, FaqsPage, userLevel, ["loading", "faqs"]),
  createRoute(ADMIN_ROUTES.ACCOUNT, AccountPage, userLevel, ["loading", "account"]),
  createRoute(ADMIN_ROUTES.NOTIFICATIONS, NotificationsPage, 'Admin', ["loading", "notifications"]),

];

const staffAndMemberSharedRoutes = (userLevel: string): RouteDefinition[] => [
  createRoute(ADMIN_ROUTES.USER_AVAILABILITY, UserAvailabilityPage, userLevel, ["loading", "user", "availability"]),
  createRoute(ADMIN_ROUTES.STORE, StorePage, userLevel, ["loading", "store"]),
  createRoute(ADMIN_ROUTES.STORE_PRODUCT, StoreProductDetailPage, userLevel, ["loading", "store", "product"]),
  createRoute(ADMIN_ROUTES.CART, CartPage, userLevel, ["loading", "cart"]),
  createRoute(ADMIN_ROUTES.CHECKOUT, CheckoutPage, userLevel, ["loading", "checkout"]),
  createRoute(ADMIN_ROUTES.ORDERS, OrdersPage, userLevel, ["loading", "orders"]),
  createRoute(ADMIN_ROUTES.ORDER_DETAIL, OrderDetailPage, userLevel, ["loading", "order", "detail"]),
];

const adminAndStaffSharedRoutes = (userLevel: string): RouteDefinition[] => [
  createRoute(ADMIN_ROUTES.TASKS, TasksPage, userLevel, ["loading", "tasks"]),
  createRoute(ADMIN_ROUTES.CHAT, ChatPage, userLevel, ["loading", "chat"]),
  createRoute(ADMIN_ROUTES.SERVICE_OFFERS, ServiceOffersPage, userLevel, ["loading", "service", "offers"]),
];

const adminAndMemberAndStaffSharedRoutes = (userLevel: string): RouteDefinition[] => [
  createRoute(ADMIN_ROUTES.BILLINGS, BillingsPage, userLevel, ["loading", "billings"]),

  createRoute(ADMIN_ROUTES.CHECKINS, CheckinsPage, userLevel, ["loading", "checkins"]),
  createRoute(ADMIN_ROUTES.SESSIONS, SessionsPage, userLevel, ["loading", "sessions"]),
  createRoute(ADMIN_ROUTES.CHAT, ChatPage, userLevel, ["loading", "chat"]),
];

const platformOwnerAndSuperAdminSharedRoutes = (userLevel: string): RouteDefinition[] => [
  createRoute(ADMIN_ROUTES.TICKETS, TicketsPage, userLevel, ["loading", "tickets"]),
  createRoute(ADMIN_ROUTES.TICKET_DETAIL, TicketDetailPage, userLevel, ["loading", "ticket", "detail"]),
  //createRoute(ADMIN_ROUTES.SCHEDULES, SchedulesPage, userLevel, ["loading", "schedules"]),
];

const platformOwnerAndSuperAdminAndAdminSharedRoutes = (userLevel: string): RouteDefinition[] => [
];

const platformOwnerAndAdminSharedRoutes = (userLevel: string): RouteDefinition[] => [
  createRoute(ADMIN_ROUTES.ACTIVITY_LOGS, ActivityLogsPage, userLevel, ["loading", "activity", "logs"]),

 /*  createRoute(ADMIN_ROUTES.CMS.EMAIL_TEMPLATES, EmailTemplatesPage, userLevel, ["loading", "email", "templates"]),
  createRoute(ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_CREATE, CreateEmailTemplatePage, userLevel, ["loading", "email", "template", "create"]),
  createRoute(ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_EDIT, EditEmailTemplatePage, userLevel, ["loading", "email", "template", "edit"]),
  createRoute(ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_PREVIEW, EmailTemplatePreviewPage, userLevel, ["loading", "email", "template", "preview"]),
  */ 
 createRoute(ADMIN_ROUTES.CMS.PAGES, PagesPage, userLevel, ["loading", "pages"]),
  createRoute(ADMIN_ROUTES.CMS.PAGE_CREATE, CreatePagePage, userLevel, ["loading", "page", "create"]),
  createRoute(ADMIN_ROUTES.CMS.PAGE_EDIT, EditPagePage, userLevel, ["loading", "page", "edit"]),
  createRoute(ADMIN_ROUTES.CMS.PAGE_PREVIEW, PagePreviewPage, userLevel, ["loading", "page", "preview"]),
];

const platformOwnerRoutes: RouteDefinition[] = [
  ...commonRoutes("Platform Owner"),
  ...platformOwnerAndAdminSharedRoutes("Platform Owner"),
  ...platformOwnerAndSuperAdminSharedRoutes("Platform Owner"),
  ...platformOwnerAndSuperAdminAndAdminSharedRoutes("Platform Owner"),
  //createRoute(ADMIN_ROUTES.USERS, UsersPage, "Platform Owner", ["loading", "users"]),
  createRoute(ADMIN_ROUTES.SYSTEM_DASHBOARD, SystemDashboardPage, "Super Admin", ["loading", "system", "dashboard"]),
  createRoute(ADMIN_ROUTES.PLATFORM_OWNER_DASHBOARD, PlatformOwnerDashboardPage, "Platform Owner", ["loading", "platform", "owner", "dashboard"]),
  createRoute(ADMIN_ROUTES.SUBSCRIPTION, SubscriptionPage, "Platform Owner", ["loading", "subscription"]),
  createRoute(ADMIN_ROUTES.BUSINESS, BusinessPage, "Platform Owner", ["loading", "business"]),
  createRoute(ADMIN_ROUTES.BUSINESS_DETAIL, BusinessDetailPage, "Platform Owner", ["loading", "business", "detail"]),
  //createRoute(ADMIN_ROUTES.QUEUES, QueuesPage, "Super Admin", ["loading", "queues"]),
  //createRoute(ADMIN_ROUTES.WORKERS, WorkersPage, "Super Admin", ["loading", "workers"]),
  //createRoute(ADMIN_ROUTES.QUEUE_BOARD, QueuesPage, "Super Admin", ["loading", "queue", "board"]),
  //createRoute(ADMIN_ROUTES.CACHE, CachePage, "Super Admin", ["loading", "cache"]),
];

//Admin-only routes
const adminRoutes: RouteDefinition[] = [
  ...commonRoutes(" Admin"),
  ...platformOwnerAndAdminSharedRoutes("Admin"),
  ...adminAndStaffSharedRoutes("Admin"),
  ...adminAndMemberAndStaffSharedRoutes("Admin"),
  ...staffAndMemberSharedRoutes("Admin"),
  ...platformOwnerAndSuperAdminAndAdminSharedRoutes("Admin"),
  createRoute(ADMIN_ROUTES.STAFF_DETAIL, StaffDetailPage, "Admin", ["loading", "staff", "detail"]),
  createRoute(ADMIN_ROUTES.MEMBERSHIPS, MembershipsPage, "Admin", ["loading", "memberships"]),
  createRoute(ADMIN_ROUTES.ROLES, RolesPage, "Admin", ["loading", "roles"]),
  createRoute(ADMIN_ROUTES.PRODCUTS.INDEX, ProductPage, "Admin", ["loading", "product"]),
  createRoute(ADMIN_ROUTES.PRODCUTS.PRODUCT_TYPES, ProductTypesPage, "Admin", ["loading", "product", "types"]),
  createRoute(ADMIN_ROUTES.PRODCUTS.ATTRIBUTES, AttributesPage, "Admin", ["loading", "attributes"]),
  createRoute(ADMIN_ROUTES.TASKS, TasksPage, "Admin", ["loading", "tasks"]),
  createRoute(ADMIN_ROUTES.TRAINER_SERVICES, TrainerServicesPage, "Admin", ["loading", "trainer", "services"]),
  createRoute(ADMIN_ROUTES.STAFF, StaffPage, "Admin", ["loading", "staff"]),
  createRoute(ADMIN_ROUTES.BANNER_IMAGES, BannerImagesPage, "Admin", ["loading", "banner", "images"]),
  createRoute(ADMIN_ROUTES.ADVERTISEMENTS, AdvertisementsPage, "Admin", ["loading", "advertisements"]),
  createRoute(ADMIN_ROUTES.LOCATIONS, LocationsPage, "Admin", ["loading", "locations"]),
  createRoute(ADMIN_ROUTES.DEVICE_READERS, DeviceReadersPage, "Admin", ["loading", "device", "readers"]),
  //createRoute(ADMIN_ROUTES.FACILITY_INFO, FacilityInfoPage, "Admin", ["loading", "facility", "info"]),
  createRoute(ADMIN_ROUTES.EQUIPMENT_RESERVATIONS, EquipmentReservationsPage, "Admin", ["loading", "equipment", "reservations"]),
  createRoute(ADMIN_ROUTES.EQUIPMENT, EquipmentPage, "Admin", ["loading", "equipment"]),
  createRoute(ADMIN_ROUTES.MEMBERS, MembersPage, "Admin", ["loading", "members"]),
  createRoute(ADMIN_ROUTES.MEMBER_DETAIL, MemberDetailPage, "Admin", ["loading", "member", "detail"]),
  createRoute(ADMIN_ROUTES.DASHBOARD, DashboardPage, "Admin", ["loading", "dashboard"]),
  //createRoute(ADMIN_ROUTES.FILES, FilesPage, "Admin", ["loading", "files"]),
  createRoute(ADMIN_ROUTES.AUTOMATION, AutomationPage, 'Admin', ["loading", "automation"]),
  createRoute(ADMIN_ROUTES.CAMERAS, CamerasPage, "Admin", ["loading", "cameras"]),
];

const superAdminRoutes: RouteDefinition[] = [
  ...commonRoutes("Super Admin"),
  ...platformOwnerAndSuperAdminSharedRoutes("Super Admin"),
  ...platformOwnerAndSuperAdminAndAdminSharedRoutes("Super Admin"),
    //createRoute(ADMIN_ROUTES.PAYMENT_PROCESSOR, PaymentProcessorPage, userLevel, ["loading", "payment", "processor"]),

  createRoute(ADMIN_ROUTES.REFERRAL_LINKS, ReferralLinksPage, "Admin", ["loading", "referral", "links"]),
  createRoute(ADMIN_ROUTES.DASHBOARD, SuperAdminDashboardPage, "Super Admin", ["loading", "dashboard"]),
  createRoute(ADMIN_ROUTES.CUSTOMIZATION, CustomizationPage, "Super Admin", ["loading", "customization"]),
];

const memberRoutes: RouteDefinition[] = [
  createRoute(ADMIN_ROUTES.DASHBOARD, MemberDashboardPage, "Member", ["loading", "dashboard"]),
  createRoute(ADMIN_ROUTES.LINK_MEMBERS.INDEX, LinkMembersPage, "Member", ["loading", "link", "members"]),
  createRoute(ADMIN_ROUTES.LINK_MEMBERS.DETAIL, LinkMemberDetailPage, "Member", ["loading", "link", "member", "detail"]),
  ...commonRoutes("Member"),
  ...adminAndMemberAndStaffSharedRoutes("Member"),
  ...staffAndMemberSharedRoutes("Member"),
];


// Base staff routes (will be filtered by permissions at render time)
export const baseStaffRoutes: RouteDefinition[] = [
  createRoute(ADMIN_ROUTES.DASHBOARD, StaffDashboardPage, "Staff", ["loading", "dashboard"]),
  ...commonRoutes("Staff"),
  ...adminAndStaffSharedRoutes("Staff"),
  ...adminAndMemberAndStaffSharedRoutes("Staff"),
  ...staffAndMemberSharedRoutes("Staff"),
];

// Map routes to required subscription features
const routeFeatureMap: Record<string, ESubscriptionFeatures> = {
  [ADMIN_ROUTES.SESSIONS]: ESubscriptionFeatures.SESSIONS,
  [ADMIN_ROUTES.TASKS]: ESubscriptionFeatures.TASKS,
  [ADMIN_ROUTES.CHECKINS]: ESubscriptionFeatures.CHECKINS,
  [ADMIN_ROUTES.CHAT]: ESubscriptionFeatures.CHAT,
  [ADMIN_ROUTES.ROLES]: ESubscriptionFeatures.ROLES,
  [ADMIN_ROUTES.LOCATIONS]: ESubscriptionFeatures.LOCATIONS,
  [ADMIN_ROUTES.CAMERAS]: ESubscriptionFeatures.VIDEO_STREAM,
  [ADMIN_ROUTES.EQUIPMENT_RESERVATIONS]: ESubscriptionFeatures.EQUIPMENT_RESERVATION,
  [ADMIN_ROUTES.ADVERTISEMENTS]: ESubscriptionFeatures.ADVERTISEMENTS,
  [ADMIN_ROUTES.SERVICE_OFFERS]: ESubscriptionFeatures.SERVICE_OFFERS,
  [ADMIN_ROUTES.TRAINER_SERVICES]: ESubscriptionFeatures.SERVICE_OFFERS,
  [ADMIN_ROUTES.STAFF]: ESubscriptionFeatures.STAFF,
  [ADMIN_ROUTES.MEMBERSHIPS]: ESubscriptionFeatures.MEMBERSHIPS,
  [ADMIN_ROUTES.CMS.EMAIL_TEMPLATES]: ESubscriptionFeatures.EMAIL_TEMPLATES,
  [ADMIN_ROUTES.CMS.PAGES]: ESubscriptionFeatures.PAGES,
  [ADMIN_ROUTES.CMS.FAQS]: ESubscriptionFeatures.FAQS,
  [ADMIN_ROUTES.BANNER_IMAGES]: ESubscriptionFeatures.ADVERTISEMENTS,
  [ADMIN_ROUTES.PRODCUTS.INDEX]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.PRODCUTS.PRODUCT_TYPES]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.PRODCUTS.ATTRIBUTES]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.CUSTOMIZATION]: ESubscriptionFeatures.CUSTOMIZATION,
  [ADMIN_ROUTES.LINK_MEMBERS.INDEX]: ESubscriptionFeatures.LINK_MEMBERS,
  [ADMIN_ROUTES.LINK_MEMBERS.DETAIL]: ESubscriptionFeatures.LINK_MEMBERS,
  [ADMIN_ROUTES.LINK_MEMBERS.SESSIONS]: ESubscriptionFeatures.LINK_MEMBERS,
  [ADMIN_ROUTES.LINK_MEMBERS.BILLINGS]: ESubscriptionFeatures.LINK_MEMBERS,
  [ADMIN_ROUTES.DEVICE_READERS]: ESubscriptionFeatures.LOCATIONS,
  [ADMIN_ROUTES.CART]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.CHECKOUT]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.ORDERS]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.ORDER_DETAIL]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.STORE]: ESubscriptionFeatures.E_COMMERCE,
  [ADMIN_ROUTES.STORE_PRODUCT]: ESubscriptionFeatures.E_COMMERCE,
};

// Helper to filter routes by subscription features
export const filterRoutesByFeatures = (
  routes: RouteDefinition[],
  user?: IUser | null,
  subscriptionFeatures?: string[]
): RouteDefinition[] => {
  if (!user) return routes;

  // Platform owner and super admin bypass feature checks
  if (user.level === EUserLevels.PLATFORM_OWNER) {
    return routes;
  }

  // If no subscription features provided, filter out feature-required routes
  if (!subscriptionFeatures || subscriptionFeatures.length === 0) {
    return routes.filter((route) => !routeFeatureMap[route.path]);
  }

  return routes.filter((route) => {
    const requiredFeature = routeFeatureMap[route.path];
    if (requiredFeature) {
      return subscriptionFeatures.includes(requiredFeature);
    }
    // Allow routes without feature mapping
    return true;
  });
};

// Helper to filter routes by permissions for STAFF level
export const filterStaffRoutes = (
  routes: RouteDefinition[],
  user?: IUser | null,
  subscriptionFeatures?: string[]
): RouteDefinition[] => {

  // Map routes to required resources
  const routeResourceMap: Record<string, EResource> = {
    [ADMIN_ROUTES.SESSIONS]: EResource.SESSIONS,
    [ADMIN_ROUTES.TASKS]: EResource.TASKS,
    [ADMIN_ROUTES.CHECKINS]: EResource.CHECKINS,
    [ADMIN_ROUTES.BILLINGS]: EResource.BILLINGS,
    [ADMIN_ROUTES.CHAT]: EResource.CHAT,
    [ADMIN_ROUTES.CMS.FAQS]: EResource.FAQS,
    [ADMIN_ROUTES.MEMBERS]: EResource.MEMBERS,
    [ADMIN_ROUTES.MEMBERSHIPS]: EResource.MEMBERSHIPS,
    [ADMIN_ROUTES.STAFF]: EResource.STAFF,
    [ADMIN_ROUTES.SERVICE_OFFERS]: EResource.SERVICE_OFFERS
  };

  return routes.filter((route) => {
    // First check subscription feature
    const requiredFeature = routeFeatureMap[route.path];
    if (requiredFeature) {
      if (!subscriptionFeatures || !subscriptionFeatures.includes(requiredFeature)) {
        return false;
      }
    }

    // Then check resource permissions
    const requiredResource = routeResourceMap[route.path];
    if (requiredResource) {

      return hasResourcePermission(user, requiredResource);
    }
    // Allow routes without resource mapping (like dashboard, account, settings)
    return true;
  });
};

// Static staff routes for module export (will be filtered dynamically in component)
const staffRoutes: RouteDefinition[] = baseStaffRoutes;

// Helper function to get filtered routes by level with subscription features
const getFilteredRoutesByLevel = (
  level: EUserLevels,
  user?: IUser | null,
  subscriptionFeatures?: string[]
): RouteDefinition[] => {
  let routes: RouteDefinition[] = [];

  switch (level) {
    case EUserLevels.PLATFORM_OWNER:
      routes = platformOwnerRoutes;
      break;
    case EUserLevels.SUPER_ADMIN:
      routes = superAdminRoutes;
      break;
    case EUserLevels.ADMIN:
      routes = adminRoutes;
      break;
    case EUserLevels.STAFF:
      routes = staffRoutes;
      break;
    case EUserLevels.MEMBER:
      routes = memberRoutes;
      break;
    default:
      routes = [];
  }

  // Filter by subscription features (platform owner and super admin bypass)
  if (level !== EUserLevels.PLATFORM_OWNER) {
    return filterRoutesByFeatures(routes, user, subscriptionFeatures);
  }

  return routes;
};

// Export routes organized by user level
// Note: For STAFF level, routes are filtered dynamically in StaffRoutes component
// Note: Routes are now filtered by subscription features for ADMIN, STAFF, and MEMBER levels
export const adminRoutesByLevel = {
  [EUserLevels.PLATFORM_OWNER]: (user?: IUser | null, subscriptionFeatures?: string[]) =>
    getFilteredRoutesByLevel(EUserLevels.PLATFORM_OWNER, user, subscriptionFeatures),
  [EUserLevels.SUPER_ADMIN]: (user?: IUser | null, subscriptionFeatures?: string[]) =>
    getFilteredRoutesByLevel(EUserLevels.SUPER_ADMIN, user, subscriptionFeatures),
  [EUserLevels.ADMIN]: (user?: IUser | null, subscriptionFeatures?: string[]) =>
    getFilteredRoutesByLevel(EUserLevels.ADMIN, user, subscriptionFeatures),
  [EUserLevels.STAFF]: (user?: IUser | null, subscriptionFeatures?: string[]) =>
    getFilteredRoutesByLevel(EUserLevels.STAFF, user, subscriptionFeatures),
  [EUserLevels.MEMBER]: (user?: IUser | null, subscriptionFeatures?: string[]) =>
    getFilteredRoutesByLevel(EUserLevels.MEMBER, user, subscriptionFeatures),
};

// Legacy exports for backward compatibility (will be filtered at usage)
// Note: Routes should be generated dynamically using adminRoutesByLevel for feature-based filtering
export default {
  platformOwnerRoutes,
  superAdminRoutes,
  adminRoutes,
  memberRoutes,
  staffRoutes: baseStaffRoutes,
};

