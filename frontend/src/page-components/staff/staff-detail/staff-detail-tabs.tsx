// React
import { useId } from "react";

// Types
import type { IStaff } from "@shared/interfaces/staff.interface";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Receipt, 
  Calendar,
  MessageSquare
} from "lucide-react";

// Page Components
import { StaffOverviewTab } from "././tabs/staf-overview-tab";
import { StaffBillingsTab } from "./tabs/staff-billings-tab";
import { TrainerSessionsTab } from "./tabs/trainer-sessions-tab";
import { StaffCommunicationsTab } from "./tabs/staff-communications-tab";

interface IStaffDetailTabsProps {
  staff: IStaff;
  storeKey: string;
}

export function StaffDetailTabs({ staff, storeKey }: IStaffDetailTabsProps) {
  const componentId = useId();

  return (
    <Tabs defaultValue="overview" className="w-full" data-component-id={componentId}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="billings" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Billings
        </TabsTrigger>
        <TabsTrigger value="sessions" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Sessions
        </TabsTrigger>
        <TabsTrigger value="communications" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Communications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <StaffOverviewTab staff={staff} storeKey={storeKey} />
      </TabsContent>

      <TabsContent value="billings" className="mt-4">
        <StaffBillingsTab staff={staff} storeKey={storeKey} />
      </TabsContent>

          <TabsContent value="sessions" className="mt-4">
            <TrainerSessionsTab trainer={staff} storeKey={storeKey} />
          </TabsContent>

      <TabsContent value="communications" className="mt-4">
        <StaffCommunicationsTab staff={staff} />
      </TabsContent>
    </Tabs>
  );
}

