// Types
import { type IWorker } from "@shared/interfaces/worker.interface";

// Handlers
import { ListHandler } from "@/handlers";

// Custom UI Components
import { WorkerList } from "@/components/admin";

// API
import { fetchWorkerTasks } from "@/services/worker.api";
import type { TWorkerListData } from "@shared/types";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { WorkerListDto } from "@shared/dtos/worker-dtos/worker.dto";

// Components
import { PauseWorker, ResumeWorker, StopWorker } from "@/page-components";

export default function WorkerManagementPage() {

  const WORKER_STORE_KEY = 'worker';

  return (
    <PageInnerLayout Header={<Header />}>
      <ListHandler<IWorker, TWorkerListData>
        queryFn={fetchWorkerTasks}
        ListComponent={WorkerList}
        dto={WorkerListDto}
        storeKey={WORKER_STORE_KEY}
        actionComponents={[
          {
            action: "pauseWorker",
            comp: PauseWorker,
          },
          {
            action: "resumeWorker",
            comp: ResumeWorker,
          },
          {
            action: 'stopWorker',
            comp: StopWorker,
          }
        ]}
      />
    </PageInnerLayout>
  );
}

const Header = () => null;
