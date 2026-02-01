// External Libraries
import { type ColumnDef } from "@tanstack/react-table";
import { useId, useMemo, useTransition } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Pause, 
  Play, 
  Square, 
  Activity,
  Clock,
} from "lucide-react";

import { type IWorker } from "@shared/interfaces/worker.interface";
import { type TListHandlerStore } from "@/stores";
import type { IUserSettings } from '@shared/interfaces/settings.interface';

// Utils
import { formatDateTime } from '@/lib/utils';

export const itemViews = ({
  store,
  settings,
}: {  
  store: TListHandlerStore<IWorker, any, any>;
  settings?: IUserSettings;
}): {
  columns: ColumnDef<IWorker>[];
} => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const setAction = store.getState().setAction;

  const pauseWorker = (workerId: string) => {
    startTransition(() => setAction('pauseWorker', workerId));
  };

  const resumeWorker = (workerId: string) => {
    startTransition(() => setAction('resumeWorker', workerId));
  };

  const stopWorker = (workerId: string) => {
    startTransition(() => setAction('stopWorker', workerId));
  };

  const columns: ColumnDef<IWorker>[] = [
    {
      accessorKey: "name",
      header: "Worker Name",
      cell: ({ row }) => {
        const name = row.getValue<string>("name");
        return (
          <span className="font-medium">{name}</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status") || 'running';
        
        const statusConfig = {
          running: { variant: "default" as const, icon: Activity, color: "text-green-600" },
          paused: { variant: "secondary" as const, icon: Pause, color: "text-yellow-600" },
          stopped: { variant: "destructive" as const, icon: Square, color: "text-red-600" },
          waiting: { variant: "outline" as const, icon: Clock, color: "text-blue-600" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.running;
        const Icon = config.icon;

        return (
          <Badge variant={config.variant} className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress = row.getValue<number>("progress") || 0;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "startTime",
      header: "Started",
      cell: ({ row }) => {
        const startTime = row.getValue<string>("startTime");
        return (
          <span className="text-sm">
            {formatDateTime(startTime, settings)}
          </span>
        );
      },
    },
    {
      accessorKey: "lastUpdate",
      header: "Last Update",
      cell: ({ row }) => {
        const lastUpdate = row.getValue<string>("lastUpdate");
        return (
          <span className="text-sm">
            {formatDateTime(lastUpdate, settings)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const worker = row.original;
        
        return (
          <div className="flex gap-1" data-component-id={componentId}>
            {worker.status === 'running' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => pauseWorker(worker.id)}
                    >
                      <Pause className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pause Worker</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resumeWorker(worker.id)}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resume Worker</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopWorker(worker.id)}
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stop Worker</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  return { columns };
};
