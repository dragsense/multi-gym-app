// External Libraries
import { type JSX } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Eye, Clock } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import type { ICheckin } from "@shared/interfaces/checkin.interface";
import { formatDate, formatDateTime, formatDateTimeWithTimezone } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";
import type { IUser } from "@shared/interfaces";

const CheckinActions = ({
  checkin,
  handleEdit,
  handleDelete,
  handleView,
  handleCheckout,
  componentId,
}: {
  checkin: ICheckin;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleCheckout?: (id: string) => void;
  componentId?: string;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" data-component-id={componentId}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {handleView && (
          <DropdownMenuItem onClick={() => handleView(checkin.id)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        )}
        {handleEdit && (
          <DropdownMenuItem onClick={() => handleEdit(checkin.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {!checkin.checkOutTime && handleCheckout && (
          <DropdownMenuItem onClick={() => handleCheckout(checkin.id)}>
            <Clock className="h-4 w-4 mr-2" />
            Checkout
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {handleDelete && (
          <DropdownMenuItem onClick={() => handleDelete(checkin.id)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const checkinItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handleCheckout,
  componentId,
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleCheckout?: (id: string) => void;
  componentId?: string;
}) => {

  const { user } = useAuthUser();

  const columns: ColumnDef<ICheckin>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const checkin = row.original;
        const user = checkin.user as any;
        if (user?.firstName || user?.lastName) {
          const firstName = user.firstName || "";
          const lastName = user.lastName || "";
          return (
            <div className="font-medium">
              {firstName && lastName ? `${firstName} ${lastName}` : user.email || "-"}
            </div>
          );
        }
        return <div className="font-medium">{user?.email || "-"}</div>;
      },
    },
    {
      accessorKey: "checkInTime",
      header: "Check-In Time",
      cell: ({ row }) => {
        const checkin = row.original;
        return checkin.checkInTime
          ? formatDateTimeWithTimezone(checkin.checkInTime, checkin.timezone)
          : "-";
      },
    },
    {
      accessorKey: "checkOutTime",
      header: "Check-Out Time",
      cell: ({ row }) => {
        const checkin = row.original;
        return checkin.checkOutTime
          ? formatDateTimeWithTimezone(checkin.checkOutTime, checkin.timezone)
          : (
              <Badge variant="secondary">Checked In</Badge>
            );
      },
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
      cell: ({ row }) => {
        const checkin = row.original;
        return (
          <div className="text-muted-foreground">
            {checkin.timezone || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => {
        const checkin = row.original;
        return <div className="text-muted-foreground">{checkin.location?.name || "-"}</div>;
      },
    },
    {
      accessorKey: "door",
      header: "Door",
      cell: ({ row }) => {
        const checkin = row.original;
        return <div className="text-muted-foreground">{checkin.door?.name || "-"}</div>;
      },
    },
    {
      accessorKey: "deviceId",
      header: "Device ID",
      cell: ({ row }) => {
        const checkin = row.original;
        return <div className="text-muted-foreground">{checkin.deviceId || "-"}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const checkin = row.original;
        return (
          <CheckinActions
            checkin={checkin}
            handleEdit={user?.level <= EUserLevels.ADMIN ? handleEdit : undefined}
            handleDelete={user?.level <= EUserLevels.ADMIN ? handleDelete : undefined}
            handleView={handleView}
            handleCheckout={user?.level <= EUserLevels.ADMIN ? handleCheckout : undefined}
            componentId={componentId}
          />
        );
      },
    },
  ];

  const listItem = (checkin: ICheckin, currentUser: IUser): JSX.Element => {
    const user = checkin.user as any;
    const userName = user?.firstName || user?.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
      : user?.email || "-";

    return (
      <AppCard key={checkin.id} className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{userName}</h3>
              {!checkin.checkOutTime && (
                <Badge variant="default">Checked In</Badge>
              )}
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Check-In: {checkin.checkInTime ? formatDateTimeWithTimezone(checkin.checkInTime, checkin.timezone) : "-"}</span>
              {checkin.checkOutTime && (
                <span>Check-Out: {formatDateTimeWithTimezone(checkin.checkOutTime, checkin.timezone)}</span>
              )}
            </div>
            {checkin.location && (
              <p className="text-sm text-muted-foreground">
                Location: {typeof checkin.location === 'string' 
                  ? checkin.location 
                  : checkin.location.name || checkin.location.address || "-"}
              </p>
            )}
            {checkin.deviceId && (
              <p className="text-sm text-muted-foreground">Device: {checkin.deviceId}</p>
            )}
            {checkin.createdAt && (
              <p className="text-xs text-muted-foreground">
                Created: {formatDate(checkin.createdAt)}
              </p>
            )}
          </div>
          <CheckinActions
            checkin={checkin}
            handleEdit={currentUser?.level <= EUserLevels.ADMIN ? handleEdit : undefined}
            handleDelete={currentUser?.level <= EUserLevels.ADMIN ? handleDelete : undefined}
            handleView={handleView}
            handleCheckout={currentUser?.level <= EUserLevels.ADMIN ? handleCheckout : undefined}
            componentId={componentId}
          />
        </div>
      </AppCard>
    );
  };
  return { columns, listItem };
};


