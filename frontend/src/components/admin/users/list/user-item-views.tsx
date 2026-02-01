// External Libraries
import { type JSX, useId, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Mail, Phone, User } from "lucide-react";

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
import type { IUser } from "@shared/interfaces/user.interface";
import { EUserLevels } from "@shared/enums/user.enum";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { getUserRole } from "@shared/lib/utils";

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:5000";



const UserActions = ({
  user,
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateProfile,
}: {
  user: IUser;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleUpdateProfile?: (id: string) => void;
}) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const handleViewClick = () => {
    if (handleView) {
      startTransition(() => handleView(user.id));
    }
  };

  const handleUpdateProfileClick = () => {
    if (handleUpdateProfile) {
      startTransition(() => handleUpdateProfile(user.id));
    }
  };

  const handleEditClick = () => {
    if (handleEdit) {
      startTransition(() => handleEdit(user.id));
    }
  };

  const handleDeleteClick = () => {
    if (handleDelete) {
      startTransition(() => handleDelete(user.id));
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
     {/*    {handleDelete && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleDeleteClick}
          >
            Delete
          </DropdownMenuItem>
        )} */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const userItemViews = ({
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
  columns: ColumnDef<IUser>[];
  listItem: (item: IUser) => JSX.Element;
} => {
  const columns: ColumnDef<IUser>[] = [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => {
        const firstName = row.original.firstName;
        const lastName = row.original.lastName;
        return `${firstName} ${lastName}`;
      },
    },
    {
      accessorKey: "level",
      header: "Role",
      cell: ({ row }) => {
        const level = row.getValue<number>("level");
        const roleColors = {
          [EUserLevels.SUPER_ADMIN]: "bg-red-100 text-red-800 border-red-200",
          [EUserLevels.STAFF]: "bg-blue-100 text-blue-800 border-blue-200",
          [EUserLevels.MEMBER]: "bg-green-100 text-green-800 border-green-200",
        };
        return (
          <Badge className={`${roleColors[level]} text-xs`}>
            {getUserRole(level)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>("isActive");
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <UserActions
            user={user}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleView={handleView}
            handleUpdateProfile={handleUpdateProfile}
          />
        );
      },
    },
  ];

  const listItem = (item: IUser) => {
    // React 19: Essential IDs
    const componentId = useId();

    const firstName = item.firstName;
    const lastName = item.lastName;
    const name = `${firstName} ${lastName}`;

    // React 19: Memoized badge classes for better performance
    const statusBadgeClass = useMemo(() =>
      item.isActive
        ? 'bg-green-100 text-green-800 border-green-200 border text-xs'
        : 'bg-gray-100 text-gray-800 border-gray-200 border text-xs',
      [item.isActive]
    );

    const roleBadgeClass = useMemo(() => {
      const roleColors = {
        [EUserLevels.SUPER_ADMIN]: 'bg-red-100 text-red-800 border-red-200',
        [EUserLevels.STAFF]: 'bg-blue-100 text-blue-800 border-blue-200',
        [EUserLevels.MEMBER]: 'bg-green-100 text-green-800 border-green-200',
      };
      return `${roleColors[item.level]} text-xs`;
    }, [item.level]);

    return (
      <AppCard data-component-id={componentId}>
        <div className="flex gap-3 justify-between w-full">
          <div className="flex-1 space-y-3">
            {/* Header with Name and Status */}

            <div className="flex items-center gap-1 flex-wrap">
              <Badge className={roleBadgeClass}>
                {getUserRole(item.level)}
              </Badge>
              <Badge className={statusBadgeClass}>
                {item.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>


            {/* Profile Image and Contact Info */}
            <div className="flex items-center gap-2 p-2 rounded bg-primary/5 border border-primary/20">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{firstName} {lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-1 flex justify-end">
            <UserActions
              user={item}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleView={handleView}
              handleUpdateProfile={handleUpdateProfile}
            />
          </div>
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
};