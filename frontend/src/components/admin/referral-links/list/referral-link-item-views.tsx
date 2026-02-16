import { useState, useId } from "react";
import { Clock, Users, Edit, Trash2, Eye, Link, Copy, ExternalLink, BarChart3, Check } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import { type IReferralLink } from "@shared/interfaces/referral-link.interface";
import { EReferralLinkStatus, EReferralLinkType } from "@shared/enums/referral-link.enum";
import type { ColumnDef } from "@tanstack/react-table";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

// Utils
import { formatDateTime, formatDate } from "@/lib/utils";

interface IReferralItemViewsProps {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  settings?: IUserSettings;
  componentId?: string;
}

// Component for link cell with copy functionality
function LinkCell({ linkUrl }: { linkUrl: string }) {
  const [copied, setCopied] = useState(false);

  // Helper function to shorten URL for display
  const shortenUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, maxLength - 3);
    return `${start}...`;
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      return false;
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(linkUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate"
          title={linkUrl}
        >
          {shortenUrl(linkUrl)}
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 hover:bg-gray-100"
          title="Copy link"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function referralLinkItemViews({ handleEdit, handleDelete, handleView, settings, componentId = "referral-link-item-views" }: IReferralItemViewsProps) {

  // Table columns
  const columns: ColumnDef<IReferralLink>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: 'linkUrl',
      header: 'Link',
      cell: ({ row }) => <LinkCell linkUrl={row.original.linkUrl} />,
    },
    {
      accessorKey: 'expiresAt',
      header: "Expired At",
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDateTime(row.original.expiresAt, settings)}
        </span>
      )
    },
    {
      accessorKey: 'maxUses',
      header: "Max Uses",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.maxUses}
        </span>
      )
    },
    {
      accessorKey: 'currentUses',
      header: "Current Uses",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.currentUses}
        </span>
      )
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const typeColors = {
          [EReferralLinkType.CLIENT]: 'bg-blue-100 text-blue-800',
          [EReferralLinkType.STAFF]: 'bg-green-100 text-green-800',
          [EReferralLinkType.ADMIN]: 'bg-red-100 text-red-800',
        };

        return (
          <Badge className={typeColors[row.original.type] || 'bg-gray-100 text-gray-800'}>
            {row.original.type.toLowerCase()}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const referralLink = row.original;
        const statusColors = {
          [EReferralLinkStatus.ACTIVE]: 'bg-green-100 text-green-800',
          [EReferralLinkStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
          [EReferralLinkStatus.EXPIRED]: 'bg-red-100 text-red-800',
          [EReferralLinkStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
        };

        return (
          <Badge className={statusColors[referralLink.status] || 'bg-gray-100 text-gray-800'}>
            {referralLink.status.toLowerCase()}
          </Badge>
        );
      },
    },


    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(row.original.linkUrl)}
            data-component-id={componentId}
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original.id)}
            data-component-id={componentId}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            data-component-id={componentId}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // List item renderer
  const listItem = (referralLink: IReferralLink) => {
    const statusColors = {
      [EReferralLinkStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [EReferralLinkStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
      [EReferralLinkStatus.EXPIRED]: 'bg-red-100 text-red-800',
      [EReferralLinkStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
    };

    const typeColors = {
      [EReferralLinkType.CLIENT]: 'bg-blue-100 text-blue-800',
      [EReferralLinkType.STAFF]: 'bg-green-100 text-green-800',
      [EReferralLinkType.ADMIN]: 'bg-purple-100 text-purple-800',
    };

    return (
      <AppCard className="p-4 hover:shadow-md transition-shadow" data-component-id={componentId}>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">{referralLink.title}</h3>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={typeColors[referralLink.type] || 'bg-gray-100 text-gray-800'}>
                {referralLink.type.toLowerCase()}
              </Badge>
              <Badge className={statusColors[referralLink.status] || 'bg-gray-100 text-gray-800'}>
                {referralLink.status.toLowerCase()}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span><strong>Referrals:</strong> {referralLink.referralCount}</span>
              </div>

              {referralLink.expiresAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span><strong>Expires:</strong> {formatDate(referralLink.expiresAt, settings)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <LinkCell linkUrl={referralLink.linkUrl} />
              </div>
            </div>

            {referralLink.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {referralLink.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(referralLink.linkUrl)}
              data-component-id={componentId}
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </Button>


            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(referralLink.id)}
              data-component-id={componentId}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(referralLink.id)}
              data-component-id={componentId}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
}
