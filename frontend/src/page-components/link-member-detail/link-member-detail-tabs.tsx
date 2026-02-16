// React
import { useId } from "react";

// Types
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type { IMember } from "@shared/interfaces/member.interface";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Receipt, 
  Calendar,
} from "lucide-react";

// Page Components
import { LinkMemberBillingsTab } from "./tabs/link-member-billings-tab";
import { LinkMemberSessionsTab } from "./tabs/link-member-sessions-tab";

interface ILinkMemberDetailTabsProps {
  linkMember: ILinkMember;
  member: IMember;
  storeKey: string;
}

export function LinkMemberDetailTabs({ linkMember, member, storeKey }: ILinkMemberDetailTabsProps) {
  const componentId = useId();

  // Only show sessions tab if viewSessionCheck is enabled
  const showSessions = linkMember.viewSessionCheck;

  return (
    <Tabs defaultValue="billings" className="w-full" data-component-id={componentId}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="billings" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Billings
        </TabsTrigger>
        {showSessions && (
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="billings" className="mt-4">
        <LinkMemberBillingsTab linkMember={linkMember} member={member} storeKey={storeKey} />
      </TabsContent>

      {showSessions && (
        <TabsContent value="sessions" className="mt-4">
          <LinkMemberSessionsTab linkMember={linkMember} member={member} storeKey={storeKey} />
        </TabsContent>
      )}
    </Tabs>
  );
}
