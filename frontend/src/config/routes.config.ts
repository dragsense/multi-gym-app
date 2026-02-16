import { EUserLevels } from "@shared/enums";

// Common base routes
export const ROOT_ROUTE = "/" as const;
export const PLATFORM_OWNER_SEGMENT = "/platform-owner";
export const SUPER_ADMIN_SEGMENT = "/owner";
export const ADMIN_SEGMENT = "/admin";
export const STAFF_SEGMENT = "/staff";
export const MEMBER_SEGMENT = "/member";

export type RootRoute = typeof ROOT_ROUTE;

// Public routes
export const PUBLIC_ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_OTP: "/verify-otp",
  IMPERSONATE: "/auth/impersonate",
  PAGE: "/pages/:slug",
} as const;
export type PublicRoute = keyof typeof PUBLIC_ROUTES;


// Admin-specific routes (relative paths for nested routing)
export const ADMIN_ROUTES = {
  SYSTEM_DASHBOARD: "system-dashboard",
  USERS: "users",
  STAFF: "staff",
  STAFF_DETAIL: "staff/:id",
  MEMBERS: "members",
  MEMBER_DETAIL: "members/:id",
  MEMBERSHIPS: "memberships",
  SESSIONS: "sessions",
  BILLINGS: "billings",
  REFERRAL_LINKS: "referral-links",
  ACTIVITY_LOGS: "activity_logs",
  FILES: "files",
  SCHEDULES: "schedules",
  QUEUES: "queues",
  CACHE: "cache",
  QUEUE_BOARD: "admin/queues",
  DASHBOARD: "dashboard",
  WORKERS: "workers",
  ROLES: "roles",
  SETTINGS: "settings",
  PAYMENT_PROCESSOR: "payment-processor",
  USER_AVAILABILITY: "user-availability",
  ACCOUNT: "account",
  PRODCUTS: {
    INDEX: "products",
    PRODUCT_TYPES: "product-types",
    ATTRIBUTES: "attributes",
  },
  SUBSCRIPTION: "subscription",
  BUSINESS: "business",
  BUSINESS_DETAIL: "business/:id",
  PLATFORM_OWNER_DASHBOARD: "dashboard",
  CHECKINS: "checkins",
  TASKS: "tasks",
  TICKETS: "tickets",
  TICKET_DETAIL: "tickets/:id",
  BANNER_IMAGES: "banner-images",
  ADVERTISEMENTS: "advertisements",
  LOCATIONS: "locations",
  DEVICE_READERS: "device-readers",
  FACILITY_INFO: "facility-info",
  TRAINER_SERVICES: "trainer-services",
  SERVICE_OFFERS: "service-offers",
  CAMERAS: "cameras",
  CHAT: "chat",
  NOTIFICATIONS: "notifications",
  AUTOMATION: "automation",
  EQUIPMENT_RESERVATIONS: "equipment-reservations",
  EQUIPMENT_TYPES: "equipment-types",
  EQUIPMENT: "equipment",
  STORE: "store",
  STORE_PRODUCT: "store/:id",
  CART: "cart",
  CHECKOUT: "checkout",
  ORDERS: "orders",
  ORDER_DETAIL: "orders/:id",
  CUSTOMIZATION: "customization",
  LINK_MEMBERS: {
    INDEX: "link-members",
    DETAIL: "link-members/:id",
    SESSIONS: "link-members/sessions",
    BILLINGS: "link-members/billings",
  },
  CMS: {
    EMAIL_TEMPLATES: "email-templates",
    EMAIL_TEMPLATE_CREATE: "email-templates/create",
    EMAIL_TEMPLATE_EDIT: "email-templates/:id/edit",
    EMAIL_TEMPLATE_PREVIEW: "email-templates/:id/preview",
    PAGES: "pages",
    PAGE_CREATE: "pages/create",
    PAGE_EDIT: "pages/:id/edit",
    PAGE_PREVIEW: "pages/:id/preview",
    FAQS: "faqs",
  },
} as const;
export type AdminRoute = keyof typeof ADMIN_ROUTES;

export const BUSINESS_ONBOARDING_ROUTE = {
  BUSINESS_ONBOARDING: "business-onboarding",
} as const;
export type BusinessOnboardingRoute = keyof typeof BUSINESS_ONBOARDING_ROUTE;

export const MEMBER_ONBOARDING_ROUTE = {
  MEMBER_ONBOARDING: "member-onboarding",
} as const;
export type MemberOnboardingRoute = keyof typeof MEMBER_ONBOARDING_ROUTE;

// Common routes
export const COMMON_ROUTES = {
  NOT_FOUND: "*",
  UNAUTHORIZED: "/unauthorized",
} as const;
export type CommonRoute = keyof typeof COMMON_ROUTES;

// Route titles are now translation keys - will be translated in components
export const ROUTE_TITLES: Record<string, string> = {
  [ADMIN_ROUTES.USERS]: "users",
  [ADMIN_ROUTES.STAFF]: "staff",
  [ADMIN_ROUTES.MEMBERS]: "members",
  [ADMIN_ROUTES.MEMBER_DETAIL]: "memberDetail",
  [ADMIN_ROUTES.MEMBERSHIPS]: "memberships",
  [ADMIN_ROUTES.SESSIONS]: "sessions",
  [ADMIN_ROUTES.BILLINGS]: "billings",
  [ADMIN_ROUTES.LINK_MEMBERS.INDEX]: "linkMembers",
  [ADMIN_ROUTES.LINK_MEMBERS.DETAIL]: "linkMemberDetail",
  [ADMIN_ROUTES.LINK_MEMBERS.SESSIONS]: "linkMemberSessions",
  [ADMIN_ROUTES.LINK_MEMBERS.BILLINGS]: "linkMemberBillings",
  [ADMIN_ROUTES.CUSTOMIZATION]: "customization",
  [ADMIN_ROUTES.REFERRAL_LINKS]: "referralLinks",
  [ADMIN_ROUTES.ACTIVITY_LOGS]: "activityLogs",
  [ADMIN_ROUTES.FILES]: "files",
  [ADMIN_ROUTES.SCHEDULES]: "schedules",
  [ADMIN_ROUTES.QUEUES]: "queueManagement",
  [ADMIN_ROUTES.QUEUE_BOARD]: "queueBoard",
  [ADMIN_ROUTES.DASHBOARD]: "dashboard",
  [ADMIN_ROUTES.WORKERS]: "workerManagement",
  [ADMIN_ROUTES.ROLES]: "roles",
  [ADMIN_ROUTES.SETTINGS]: "settings",
  [ADMIN_ROUTES.PAYMENT_PROCESSOR]: "paymentProcessor",
  [ADMIN_ROUTES.USER_AVAILABILITY]: "userAvailability",
  [ADMIN_ROUTES.ACCOUNT]: "account",
  [ADMIN_ROUTES.CACHE]: "cache",
  [ADMIN_ROUTES.SYSTEM_DASHBOARD]: "systemDashboard",
  [ADMIN_ROUTES.PRODCUTS.INDEX]: "products",
  [ADMIN_ROUTES.PRODCUTS.PRODUCT_TYPES]: "productTypes",
  [ADMIN_ROUTES.PRODCUTS.ATTRIBUTES]: "attributes",
  [ADMIN_ROUTES.SUBSCRIPTION]: "Subscription",
  [ADMIN_ROUTES.BUSINESS]: "business",
  [ADMIN_ROUTES.BUSINESS_DETAIL]: "businessDetail",
  [ADMIN_ROUTES.CHECKINS]: "checkins",
  [ADMIN_ROUTES.TASKS]: "tasks",
  [ADMIN_ROUTES.TICKETS]: "tickets",
  [ADMIN_ROUTES.TICKET_DETAIL]: "ticketDetail",
  [ADMIN_ROUTES.BANNER_IMAGES]: "bannerImages",
  [ADMIN_ROUTES.ADVERTISEMENTS]: "advertisements",
  [ADMIN_ROUTES.LOCATIONS]: "locations",
  [ADMIN_ROUTES.DEVICE_READERS]: "deviceReaders",
  [ADMIN_ROUTES.FACILITY_INFO]: "facilityInfo",
  [ADMIN_ROUTES.TRAINER_SERVICES]: "trainerServices",
  [ADMIN_ROUTES.SERVICE_OFFERS]: "serviceOffers",
  [ADMIN_ROUTES.CAMERAS]: "cameras",
  [ADMIN_ROUTES.CHAT]: "chat",
  [ADMIN_ROUTES.NOTIFICATIONS]: "notifications",
  [ADMIN_ROUTES.EQUIPMENT_RESERVATIONS]: "equipmentReservations",
  [ADMIN_ROUTES.EQUIPMENT_TYPES]: "equipmentTypes",
  [ADMIN_ROUTES.EQUIPMENT]: "equipment",
  [ADMIN_ROUTES.STORE]: "store",
  [ADMIN_ROUTES.STORE_PRODUCT]: "productDetail",
  [ADMIN_ROUTES.CART]: "cart",
  [ADMIN_ROUTES.CHECKOUT]: "checkout",
  [ADMIN_ROUTES.ORDERS]: "orders",
  [ADMIN_ROUTES.ORDER_DETAIL]: "orderDetail",
  [ADMIN_ROUTES.CMS.EMAIL_TEMPLATES]: "emailTemplates",
  [ADMIN_ROUTES.CMS.PAGES]: "pages",
  [ADMIN_ROUTES.CMS.PAGE_CREATE]: "pageCreate",
  [ADMIN_ROUTES.CMS.PAGE_EDIT]: "pageEdit",
  [ADMIN_ROUTES.CMS.PAGE_PREVIEW]: "pagePreview",
  [ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_CREATE]: "emailTemplateCreate",
  [ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_EDIT]: "emailTemplateEdit",
  [ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_PREVIEW]: "emailTemplatePreview",
  [ADMIN_ROUTES.CMS.FAQS]: "faqs",
  [PUBLIC_ROUTES.PAGE]: "page",
  [ADMIN_ROUTES.CAMERAS]: "cameras",
  [ADMIN_ROUTES.AUTOMATION]: "automation",
};


export const ROUTES_REDIRECTS = {
  [EUserLevels.PLATFORM_OWNER]: PLATFORM_OWNER_SEGMENT + "/" + ADMIN_ROUTES.PLATFORM_OWNER_DASHBOARD,
  [EUserLevels.SUPER_ADMIN]:
    SUPER_ADMIN_SEGMENT + "/" + ADMIN_ROUTES.DASHBOARD,
  [EUserLevels.ADMIN]: ADMIN_SEGMENT + "/" + ADMIN_ROUTES.DASHBOARD,
  [EUserLevels.STAFF]: STAFF_SEGMENT + "/" + ADMIN_ROUTES.DASHBOARD,
  [EUserLevels.MEMBER]: MEMBER_SEGMENT + "/" + ADMIN_ROUTES.DASHBOARD,
} as const;

export const SEGMENTS = {
  [EUserLevels.PLATFORM_OWNER]: PLATFORM_OWNER_SEGMENT,
  [EUserLevels.SUPER_ADMIN]: SUPER_ADMIN_SEGMENT,
  [EUserLevels.ADMIN]: ADMIN_SEGMENT,
  [EUserLevels.STAFF]: STAFF_SEGMENT,
  [EUserLevels.MEMBER]: MEMBER_SEGMENT,
} as const;
