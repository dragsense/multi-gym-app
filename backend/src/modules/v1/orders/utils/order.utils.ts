/**
 * Generate a unique order reference number
 * Format: ORD-YYYYMMDD-XXXXX (e.g., ORD-20240204-A1B2C)
 */
export function generateOrderRef(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORD-${dateStr}-${code}`;
}
