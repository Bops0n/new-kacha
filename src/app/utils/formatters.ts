// lib/formatters.ts

/**
 * จัดรูปแบบตัวเลขเป็นสกุลเงินบาท (THB)
 * @param price - ตัวเลขที่ต้องการจัดรูปแบบ
 * @returns string ที่จัดรูปแบบแล้ว (เช่น "฿1,500.00")
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '-';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};