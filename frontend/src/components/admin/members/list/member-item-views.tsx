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
import type { IMember } from "@shared/interfaces/member.interface";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:5000";

const MemberActions = ({
  member,
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateProfile,
}: {
  member: IMember;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string | number) => void;
  handleUpdateProfile?: (id: string) => void;
}) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking the action
    if (handleView) {
      startTransition(() => handleView(member.id));
    }
  };

  const handleUpdateProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking the action
    if (handleUpdateProfile) {
      startTransition(() => handleUpdateProfile(member.user?.id ?? ""));
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking the action
    if (handleEdit) {
      startTransition(() => handleEdit(member.id));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking the action
    if (handleDelete) {
      startTransition(() => handleDelete(member.id));
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

export const memberItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateProfile
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string | number) => void;
  handleUpdateProfile?: (id: string) => void;
}): {
  columns: ColumnDef<IMember>[];
  listItem: (item: IMember) => JSX.Element;
} => {
  const columns: ColumnDef<IMember>[] = [
    {
      accessorKey: "user.firstName",
      header: "Name",
    },
    {
      accessorKey: "user.email",
      header: "Email",
    },
    {
      accessorKey: "user.profile.phoneNumber",
      header: "Phone",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.user?.isActive;
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
        const member = row.original;

        return (
          <MemberActions
            member={member}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleView={handleView}
            handleUpdateProfile={handleUpdateProfile}
          />
        );
      },
    },
  ];

  const listItem = (item: IMember) => {
    // React 19: Essential IDs
    const componentId = useId();

    const firstName = item.user?.firstName;
    const lastName = item.user?.lastName;
    const email = item.user?.email;
    const phoneNumber = item.user?.profile?.phoneNumber;

    // React 19: Memoized badge class for better performance
    const badgeClass = useMemo(() =>
      item.isActive
        ? 'bg-green-100 text-green-800 border-green-200 border text-xs'
        : 'bg-gray-100 text-gray-800 border-gray-200 border text-xs',
      [item.isActive]
    );

    const handleCardClick = () => {
      if (handleView) {
        handleView(item.id);
      }
    };

    return (
      <AppCard
        data-component-id={componentId}
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleCardClick}
      >
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="flex-1 w-full space-y-3">
            {/* Header with Name and Status */}

            <div className="flex items-center gap-1 flex-wrap">
              <Badge className={badgeClass}>
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
                    <span className="truncate">{email}</span>
                  </div>
                  {phoneNumber && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 self-start">
            <MemberActions
              member={item}
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
