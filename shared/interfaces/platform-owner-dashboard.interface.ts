export interface IPlatformOwnerDashboardOverview {
  activeBusinesses: number;
  totalRevenue: number;
}

export interface IPlatformOwnerDashboardStats {
  dateRange: {
    from: string;
    to: string;
    isDefault: boolean;
  };
  overview: IPlatformOwnerDashboardOverview;
  businessGrowth: Array<{
    period: string;
    businesses: number;
  }>;
  subscriptionDistribution: Array<{
    subscriptionTitle: string;
    count: number;
    revenue: number;
    color?: string;
  }>;
}
