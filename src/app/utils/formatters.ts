// lib/formatters.ts

/**
 * จัดรูปแบบตัวเลขเป็นสกุลเงินบาท (THB)
 * @param price - ตัวเลขที่ต้องการจัดรูปแบบ
 * @returns string ที่จัดรูปแบบแล้ว (เช่น "฿1,500.00")
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};

/**
 * จัดรูปแบบ ISO date string เป็นวันที่ในรูปแบบไทย (dd-mm-yyyy)
 * @param dateString - วันที่ในรูปแบบ ISO string หรือ null
 * @returns string วันที่ในรูปแบบไทย หรือ '-' ถ้าวันที่ไม่ถูกต้อง
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return '-';
  }
};