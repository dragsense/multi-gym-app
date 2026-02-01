// Types
import { type IActivityLog } from "@shared/interfaces/activity-log.interface";

// Handlers
import { ListHandler } from "@/handlers";

// Custom UI Components
import { ActivityLogList } from "@/components/admin";


// API
import { fetchActivityLogs } from "@/services/activity-log.api";

// Types


// Layouts
import { PageInnerLayout } from "@/layouts";
import { ActivityLogListDto } from "@shared/dtos";


export default function ActivityLogsPage() {

  const STORE_KEY = 'activity-log';

  return (
    <PageInnerLayout Header={<Header />}>
  
      <ListHandler<IActivityLog, any, any>
        queryFn={fetchActivityLogs}
        ListComponent={ActivityLogList}
        dto={ActivityLogListDto}
        storeKey={STORE_KEY}
      />
    </PageInnerLayout>
  );
}



const Header = () => null
