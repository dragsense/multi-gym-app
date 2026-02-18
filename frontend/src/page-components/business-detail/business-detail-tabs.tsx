// React
import { useId } from "react";

// Types
import type { IBusiness } from "@shared/interfaces";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  CreditCard, 
  Receipt,
  MessageCircle
} from "lucide-react";

// Page Components
import { BusinessOverviewTab } from "./tabs/business-overview-tab";
import { BusinessSubscriptionTab } from "./tabs/business-subscription-tab";
import { BusinessBillingsTab } from "./tabs/business-billings-tab";

interface IBusinessDetailTabsProps {
  business: IBusiness;
  storeKey: string;
}

export function BusinessDetailTabs({ business, storeKey }: IBusinessDetailTabsProps) {
  const componentId = useId();

  return (
    <Tabs defaultValue="overview" className="w-full" data-component-id={componentId}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </TabsTrigger>
        {/* <TabsTrigger value="subscription" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Subscription
        </TabsTrigger>
        <TabsTrigger value="billings" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Billings & Invoices
        </TabsTrigger> */}
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <BusinessOverviewTab business={business} storeKey={storeKey} />
      </TabsContent>

{/*       <TabsContent value="subscription" className="mt-4">
        <BusinessSubscriptionTab business={business} storeKey={storeKey} />
      </TabsContent> */}
{/* 
      <TabsContent value="billings" className="mt-4">
        <BusinessBillingsTab business={business} storeKey={storeKey} />
      </TabsContent> */}
    </Tabs>
  );
}
