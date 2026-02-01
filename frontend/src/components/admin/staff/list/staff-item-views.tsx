// External Libraries
import { type JSX, useId, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Mail, User } from "lucide-react";

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

// Types
import type { IStaff } from "@shared/interfaces/staff.interface";
import { EUserLevels } from "@shared/enums/user.enum";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { getUserRole } from "@shared/lib/utils";
import type { IRole } from "@shared/interfaces/role/role.interface";

const StaffActions = ({
  staff,
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateProfile,
}: {
  staff: IStaff;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleUpdateProfile?: (id: string) => void;
}) => {
  const componentId = useId();
  const [, startTransition] = useTransition();

  const handleViewClick = () => {
    if (handleView) {
      startTransition(() => handleView(staff.id));
    }
  };

  const handleUpdateProfileClick = () => {
    if (handleUpdateProfile) {
      startTransition(() => handleUpdateProfile(staff.id));
    }
  };

  const handleEditClick = () => {
    if (handleEdit) {
      startTransition(() => handleEdit(staff.id));
    }
  };

  const handleDeleteClick = () => {
    if (handleDelete) {
      startTransition(() => handleDelete(staff.id));
    }
  };

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
          <DropdownMenuItem onClick={handleViewClick}>
            View Details
          </DropdownMenuItem>
        )}
        {handleUpdateProfile && (
          <DropdownMenuItem onClick={handleUpdateProfileClick}>
            Update Profile
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {handleEdit && (
          <DropdownMenuItem onClick={handleEditClick}>
            Edit
          </DropdownMenuItem>
        )}
        {handleDelete && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleDeleteClick}
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const staffItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateProfile
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleUpdateProfile?: (id: string) => void;
}): {
  columns: ColumnDef<IStaff>[];
  listItem: (item:  IStaff) => JSX.Element;
} => {
  const columns: ColumnDef<IStaff>[] = [
    {
      id: "email",
      header: "Email",
      accessorFn: (row) => {
        const staff = row as IStaff;
        return staff.user?.email;
      },
    },
    {
      header: "Name",
      id: "name",
      cell: ({ row }) => {
        const staff = row.original as IStaff;
        return `${staff.user?.firstName ?? ""} ${staff.user?.lastName ?? ""}`.trim();
      },
    },

    {
      id: "type",
      header: "Type",
      cell: ({ row }) => {
        const staff = row.original;
        const isTrainer = staff.isTrainer;
        return (
          <Badge variant={isTrainer ? "default" : "secondary"}>
            {isTrainer ? "Trainer" : "Staff"}
          </Badge>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const staff = row.original as IStaff;
        const name = staff.location?.name;
        return name ? <span className="text-sm">{name}</span> : <span className="text-muted-foreground text-sm">—</span>;
      },
    },
    {
      id: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const staff = row.original as IStaff;
        const userRoles = staff.user?.roles as { role: IRole }[] | undefined;
        const text = userRoles?.map((ur) => ur.role?.name).filter(Boolean).join(", ");
        return text ? <Badge>{text}</Badge> : <span className="text-muted-foreground text-sm">—</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const staff = row.original as IStaff;
        const isActive = !!staff.user?.isActive;
        return (
          <Badge
            className={
              isActive
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <StaffActions
            staff={staff}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleView={handleView}
            handleUpdateProfile={handleUpdateProfile}
          />
        );
      },
    },
  ];

  const listItem = (item: IStaff): JSX.Element => {
    const componentId = useId();
    const roleColors = {
      [EUserLevels.STAFF]: "bg-blue-100 text-blue-800 border-blue-200",
    };
    const isTrainer = item.isTrainer;

    const user = item.user;

    return (
      <AppCard
        key={item.id}
        data-component-id={componentId}
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleView?.(item.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {user?.firstName} {user?.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${roleColors[user?.level]} text-xs`}>
                  {getUserRole(user?.level)}
                </Badge>
                <Badge variant={isTrainer ? "default" : "secondary"}>
                  {isTrainer ? "Trainer" : "Staff"}
                </Badge>
                <Badge
                  className={
                    user?.isActive
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {user?.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <StaffActions
            staff={item}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleView={handleView}
            handleUpdateProfile={handleUpdateProfile}
          />
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
};
