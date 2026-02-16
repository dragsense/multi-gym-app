// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchActiveAdvertisements } from "@/services/advertisement.api";

// Types
import type { IAdvertisement } from "@shared/interfaces/advertisement.interface";

// Components
import { AdvertisementsBanner } from "@/components/admin/dashboard/member/advertisements-banner";

/**
 * Page Component that fetches advertisements and passes to UI component
 * Handles data fetching logic at page-component level
 * Uses /advertisements/active endpoint which filters by:
 * - status = ACTIVE
 * - startDate <= now
 * - endDate >= now
 */
export function AdvertisementsBannerHandler() {
  // Fetch active advertisements using the new endpoint
  const { data: advertisements, isLoading } = useQuery<IAdvertisement[]>({
    queryKey: ["member-dashboard-active-advertisements"],
    queryFn: () => fetchActiveAdvertisements(10),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <AdvertisementsBanner
      advertisements={advertisements || []}
      isLoading={isLoading}
    />
  );
}
