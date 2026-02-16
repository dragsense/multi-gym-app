export enum EBillingStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}

export enum EBillingType {
  SESSION = "SESSION",
  MONTHLY = "MONTHLY",
  PACKAGE = "PACKAGE",
  MEMBERSHIP = "MEMBERSHIP",
  BUSINESS = "BUSINESS",
  PRODUCT = "PRODUCT",
}

/**
 * Get Tailwind CSS classes for billing status badge
 */
export function getBillingStatusColor(status: EBillingStatus): string {
  const colors: Record<EBillingStatus, string> = {
    [EBillingStatus.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
    [EBillingStatus.PAID]: "bg-green-100 text-green-800 border-green-200",
    [EBillingStatus.OVERDUE]: "bg-red-100 text-red-800 border-red-200",
    [EBillingStatus.CANCELLED]: "bg-gray-100 text-gray-800 border-gray-200",
    [EBillingStatus.REFUNDED]: "bg-blue-100 text-blue-800 border-blue-200",
    [EBillingStatus.FAILED]: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}
