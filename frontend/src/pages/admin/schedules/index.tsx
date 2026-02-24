import { useQueryClient } from "@tanstack/react-query";

// Types
import { type ISchedule } from "@shared/interfaces/schedule.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { ScheduleList, ScheduleView } from "@/components/admin";

// Page Components
import { ScheduleForm, type TScheduleExtraProps } from "@/page-components";

// API
import { deleteSchedule, fetchSchedule, fetchSchedules } from "@/services/schedule.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { ScheduleListDto } from "@shared/dtos/schedule-dtos/schedule.dto";

export default function SchedulesPage() {
  const queryClient = useQueryClient();

  const STORE_KEY = "schedule";

  return (
    <PageInnerLayout Header={<Header />}>
      <SingleHandler<ISchedule, TScheduleExtraProps>
        queryFn={fetchSchedule}
        storeKey={STORE_KEY}
        SingleComponent={ScheduleView}
        actionComponents={[
          {
            action: "createOrUpdate",
            comp: ScheduleForm,
          },
        ]}
      />

      <ListHandler<ISchedule, any, any, ISchedule, any>
        queryFn={fetchSchedules}
        ListComponent={ScheduleList}
        dto={ScheduleListDto}
        deleteFn={deleteSchedule}
        onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] })}

        storeKey={STORE_KEY}
      />
    </PageInnerLayout>
  );
}

const Header = () => null;

