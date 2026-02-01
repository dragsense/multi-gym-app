export enum ESessionStatus {
  SCHEDULED = "SCHEDULED",
  RESCHEDULED = "RESCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  PASSED = "PASSED",
}

// Session status colors - consistent across calendar, list, and view
export const SESSION_STATUS_COLORS = {
  [ESessionStatus.SCHEDULED]: {
    border: "border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-500",
  },
  [ESessionStatus.RESCHEDULED]: {
    border: "border-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-800 border-purple-500",
  },
  [ESessionStatus.IN_PROGRESS]: {
    border: "border-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-500",
  },
  [ESessionStatus.COMPLETED]: {
    border: "border-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800 border-green-500",
  },
  [ESessionStatus.CANCELLED]: {
    border: "border-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800 border-red-500",
  },
} as const;

export function getSessionStatusColor(
  status: ESessionStatus,
  type: "border" | "bg" | "text" | "badge" = "badge"
): string {
  return (
    SESSION_STATUS_COLORS[status]?.[type] ||
    "bg-gray-100 text-gray-800 border-gray-200"
  );
}

export enum ESessionType {
  CUSTOM = "CUSTOM",
  GROUP = "GROUP",
}

export enum EUpdateSessionScope {
  THIS = "this",
  ALL = "all",
  THIS_AND_FOLLOWING = "thisAndFollowing",
}
