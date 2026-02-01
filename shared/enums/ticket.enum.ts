export enum ETicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
  PENDING = "pending",
}

export enum ETicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum ETicketCategory {
  TECHNICAL = "technical",
  BILLING = "billing",
  FEATURE_REQUEST = "feature_request",
  BUG_REPORT = "bug_report",
  GENERAL = "general",
  ACCOUNT = "account",
}
