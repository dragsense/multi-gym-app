// React & Hooks
import { useId } from "react";

// External libraries
import { MoreHorizontal, Edit, Trash2, Eye, MessageSquare, CheckCircle2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import type { ITicket } from "@shared/interfaces/ticket.interface";
import { ETicketStatus, ETicketPriority, ETicketCategory } from "@shared/enums/ticket.enum";
import type { ColumnDef } from "@tanstack/react-table";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

// Utils
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

interface ITicketItemViewsProps {
  handleEdit: (ticket: ITicket, e?: React.MouseEvent) => void;
  handleDelete: (ticketId: string, e?: React.MouseEvent) => void;
  handleView: (ticket: ITicket, e?: React.MouseEvent) => void;
  handleUpdateStatus?: (ticket: ITicket, e?: React.MouseEvent) => void;
  priorityColors: Record<ETicketPriority, string>;
  statusColors: Record<ETicketStatus, string>;
  settings?: IUserSettings;
  componentId?: string;
}

export function ticketItemViews({
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateStatus,
  priorityColors,
  statusColors,
  settings,
  componentId = "ticket-item-views",
}: ITicketItemViewsProps) {

  const { user } = useAuthUser();

  const columns: ColumnDef<ITicket>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{ticket.title}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        return (
          <Badge variant="outline">
            {category.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={statusColors[status]}>
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge className={priorityColors[priority]}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => {
        const createdBy = row.original.createdBy;
        return createdBy
          ? `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim() || createdBy.email || "Unknown"
          : "Unknown";
      },
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        return assignedTo
          ? `${assignedTo.firstName || ''} ${assignedTo.lastName || ''}`.trim() || assignedTo.email || "Unassigned"
          : "Unassigned";
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        if (!createdAt) return "—";
        return formatDate(createdAt, settings);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => handleView(ticket, e)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {handleUpdateStatus && user?.level === EUserLevels.PLATFORM_OWNER && (
                <DropdownMenuItem onClick={(e) => handleUpdateStatus(ticket, e)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Status
                </DropdownMenuItem>
              )}
              {user?.level === EUserLevels.PLATFORM_OWNER && <DropdownMenuItem onClick={(e) => handleEdit(ticket, e)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>}
              {user?.level === EUserLevels.PLATFORM_OWNER && <DropdownMenuItem
                onClick={(e) => handleDelete(ticket.id, e)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const TicketListItem = ({
    item,
    isSelected,
    handleView,
    handleDelete,
    handleEdit,
    handleUpdateStatus,
  }: {
    item: ITicket;
    isSelected: boolean;
    handleView: (ticket: ITicket, e?: React.MouseEvent) => void;
    handleDelete: (ticketId: string, e?: React.MouseEvent) => void;
    handleEdit: (ticket: ITicket, e?: React.MouseEvent) => void;
    handleUpdateStatus?: (ticket: ITicket, e?: React.MouseEvent) => void;
  }) => {
    const id = useId();
    return (
      <AppCard
        data-component-id={id}
        className={`cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? "bg-muted border-primary" : ""
        }`}
        onClick={() => handleView(item)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={statusColors[item.status]}>
                  {item.status.replace('_', ' ')}
                </Badge>
                <Badge className={priorityColors[item.priority]}>
                  {item.priority}
                </Badge>
                <Badge variant="outline">
                  {item.category.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => handleView(item, e)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {handleUpdateStatus && (
                <DropdownMenuItem onClick={(e) => handleUpdateStatus(item, e)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Status
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => handleEdit(item, e)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleDelete(item.id, e)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </AppCard>
    );
  };

  return {
    columns,
    listItem: (
      item: ITicket,
      isSelected: boolean,
      handleView: (ticket: ITicket) => void,
      handleDelete: (ticketId: string, e?: React.MouseEvent) => void,
      handleEdit: (ticket: ITicket, e?: React.MouseEvent) => void,
      handleUpdateStatus?: (ticket: ITicket, e?: React.MouseEvent) => void,
    ) => (
      <TicketListItem
        item={item}
        isSelected={isSelected}
        handleView={handleView}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        handleUpdateStatus={handleUpdateStatus}
      />
    ),
  };
}
