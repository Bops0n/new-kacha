// lib/formatters.ts

/**
 * จัดรูปแบบตัวเลขเป็นสกุลเงินบาท (THB)
 * @param price - ตัวเลขที่ต้องการจัดรูปแบบ
 * @returns string ที่จัดรูปแบบแล้ว (เช่น "฿1,500.00")
 * 
 */

type monthStyle = 'numeric' | 'short' | 'long'
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '-';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};

export  const formatDateTimeThai = (dateObj: Date) => {
        return dateObj.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' });
    };

export  const formatDateThai = (dateStr: string, monthStyle: monthStyle = 'numeric') => {
        return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month : monthStyle, day: 'numeric' });
    };
export const setCurrentTime = (setState : ( text:string )=>void ) => {
        setState(new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' }));
}
export  const getCurDate = ()=>{
        const date = new Date().toLocaleString('th-TH',{dateStyle: 'long', timeStyle: 'medium'})
        return date
    };
  