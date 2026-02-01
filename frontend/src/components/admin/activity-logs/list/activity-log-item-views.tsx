// External Libraries
import { useState, type JSX } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useId, useMemo, useTransition } from "react";

// Components
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Clock, Database, FileKey } from "lucide-react";

// Types
import type { IActivityLog } from "@shared/interfaces/activity-log.interface";


export const itemViews = (): {
  columns: ColumnDef<IActivityLog>[];
  listItem: (item: IActivityLog) => JSX.Element;
} => {
  // React 19: Essential IDs
  const componentId = useId();
  const columns: ColumnDef<IActivityLog>[] = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue<string>("description");
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="max-w-40 truncate cursor-help">
                  {description}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
    },
    {
      accessorKey: "userAgent",
      header: "User Agent",
      cell: ({ row }) => {
        const userAgent = row.getValue<string>("userAgent");
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="max-w-30 truncate cursor-help">
                  {userAgent || 'N/A'}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-md">{userAgent || 'No user agent'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      accessorKey: "endpoint",
      header: "End Point",
    },
    {
      accessorKey: "method",
      header: "Method",
    },
    {
      accessorKey: "statusCode",
      header: "Status Code",
    },
    {
      accessorKey: "errorMessage",
      header: "Error Message",
      cell: ({ row }) => {
        const errorMessage = row.getValue<string>("errorMessage") || '';

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="max-w-50 truncate cursor-help text-red-600">
                  {errorMessage || ''}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="whitespace-pre-wrap break-words">{errorMessage || 'No error message'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "user.email",
      header: "User",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <Badge variant={"secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "metadata",
      header: "Metadata",
      cell: ({ row }) => {
        const metadata = row.getValue<any>("metadata") || {};

        if (!metadata) return <span className="text-muted-foreground">-</span>;

        const { duration, responseSize, bodyKeys } = metadata;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">View</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-2">
                  {duration !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        Duration: <strong>{duration}ms</strong>
                      </span>
                    </div>
                  )}
                  {responseSize !== undefined && (
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3" />
                      <span className="text-xs">
                        Response: <strong>{(responseSize / 1024).toFixed(2)} KB</strong>
                      </span>
                    </div>
                  )}
                  {bodyKeys && bodyKeys.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FileKey className="h-3 w-3 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-semibold mb-1">Body Fields:</div>
                        <div className="flex flex-wrap gap-1">
                          {bodyKeys.map((key: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs text-background">
                              {key}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },

  ];

  const listItem = (item: IActivityLog) => {
    return <div data-component-id={componentId}>Not Provided</div>;
  };

  return { columns, listItem };
};