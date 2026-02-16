/**
 * Generate a unique invoice reference number
 * Format: INV-YYYYMMDD-XXXXX (e.g., INV-20241218-A3B7C)
 */
export function generateInvoiceRef(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate 5 character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `INV-${dateStr}-${code}`;
}
