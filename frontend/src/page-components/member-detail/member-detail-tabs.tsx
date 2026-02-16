// React
import { useId } from "react";

// Types
import type { IMember } from "@shared/interfaces/member.interface";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  CreditCard, 
  Receipt, 
  Calendar,
  MessageSquare,
  FileText,
  Link2
} from "lucide-react";

// Page Components
import { MemberOverviewTab } from "./tabs/member-overview-tab";
import { MemberMembershipTab } from "./tabs/member-membership-tab";
import { MemberBillingsTab } from "./tabs/member-billings-tab";
import { MemberSessionsTab } from "./tabs/member-sessions-tab";
import { MemberCommunicationsTab } from "./tabs/member-communications-tab";
import { MemberNotesTab } from "./tabs/member-notes-tab";
import { MemberLinkMembersTab } from "./tabs/member-link-members-tab";

interface IMemberDetailTabsProps {
  member: IMember;
  storeKey: string;
}

export function MemberDetailTabs({ member, storeKey }: IMemberDetailTabsProps) {
  const componentId = useId();

  return (
    <Tabs defaultValue="overview" className="w-full" data-component-id={componentId}>
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="membership" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Membership
        </TabsTrigger>
        <TabsTrigger value="billings" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Billings
        </TabsTrigger>
        <TabsTrigger value="sessions" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Sessions
        </TabsTrigger>
        <TabsTrigger value="link-members" className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Link Members
        </TabsTrigger>
        <TabsTrigger value="communications" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Communications
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <MemberOverviewTab member={member} storeKey={storeKey} />
      </TabsContent>

      <TabsContent value="membership" className="mt-4">
        <MemberMembershipTab member={member} storeKey={storeKey} />
      </TabsContent>

      <TabsContent value="billings" className="mt-4">
        <MemberBillingsTab member={member} storeKey={storeKey} />
      </TabsContent>

      <TabsContent value="sessions" className="mt-4">
        <MemberSessionsTab member={member} storeKey={storeKey} />
      </TabsContent>

      <TabsContent value="link-members" className="mt-4">
        <MemberLinkMembersTab member={member} storeKey={storeKey} />
      </TabsContent>

      <TabsContent value="communications" className="mt-4">
        <MemberCommunicationsTab member={member} />
      </TabsContent>

      <TabsContent value="notes" className="mt-4">
        <MemberNotesTab member={member} storeKey={storeKey} />
      </TabsContent>
    </Tabs>
  );
}

