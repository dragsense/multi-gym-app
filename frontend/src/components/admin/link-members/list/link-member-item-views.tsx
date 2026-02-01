// External Libraries
import { type JSX, useId, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Link2, User, CheckCircle2, XCircle } from "lucide-react";

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
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

const LinkMemberActions = ({
    linkMember,
}: {
    linkMember: ILinkMember;
}) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  

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
     
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const linkMemberItemViews = () => {
  const { t } = useI18n();

  const columns: ColumnDef<ILinkMember>[] = useMemo(
    () => [
      {
        accessorKey: "primaryMember",
        header: buildSentence(t, "primary", "member"),
        cell: ({ row }) => {
          const member = row.original.primaryMember;
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {member?.user?.firstName} {member?.user?.lastName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "linkedMember",
        header: buildSentence(t, "linked", "member"),
        cell: ({ row }) => {
          const member = row.original.linkedMember;
          return (
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span>
                {member?.user?.firstName} {member?.user?.lastName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "viewSessionCheck",
        header: buildSentence(t, "session", "check"),
        cell: ({ row }) => {
          const enabled = row.original.viewSessionCheck;
          return (
            <Badge variant={enabled ? "default" : "outline"} className="gap-1">
              {enabled ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  {buildSentence(t, "enabled")}
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  {buildSentence(t, "disabled")}
                </>
              )}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const linkMember = row.original;
          return (
            <LinkMemberActions
              linkMember={linkMember}
            />
          );
        },
      },
    ],
    [t]
  );

  const listItem = (linkMember: ILinkMember): JSX.Element => {
    const linkedMember =
      linkMember.primaryMemberId === linkMember.primaryMember?.id
        ? linkMember.linkedMember
        : linkMember.primaryMember;

    return (
      <AppCard
        key={linkMember.id}
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {linkedMember?.user?.firstName} {linkedMember?.user?.lastName}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {linkedMember?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {linkMember.viewSessionCheck ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {buildSentence(t, "session", "check", "enabled")}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {buildSentence(t, "session", "check", "disabled")}
                </Badge>
              )}
            </div>
            {linkMember.notes && (
              <p className="text-sm text-muted-foreground">{linkMember.notes}</p>
            )}
          </div>
          <LinkMemberActions
            linkMember={linkMember}
          />
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
};
