type monthStyle = 'numeric' | 'short' | 'long'
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '-';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};

export  const formatDate = (dateStr: string, monthStyle: monthStyle = 'short') => {
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month : monthStyle, year: 'numeric' });
};

export function formatDateTimeLong(date: Date | null): string;
export function formatDateTimeLong(date: string): string;
export function formatDateTimeLong(date: Date | string | null) {
  if (!date) return '-';

  const d = typeof date === 'string'
    ? new Date(date)
    : date;

  return d.toLocaleString('th-TH', {
    dateStyle: 'long',
    timeStyle: 'medium',
  });
};

export function formatDateTimeShort(date: Date | null): string;
export function formatDateTimeShort(date: string): string;
export function formatDateTimeShort(date: Date | string | null) {
  if (!date) return '-';

  const d = typeof date === 'string'
    ? new Date(date)
    : date;

  return d.toLocaleDateString('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
  });
};

export const setCurrentTime = (setState : ( text:string )=>void ) => {
  setState(new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' }));
}

export  const getCurDate = ()=>{
  const date = new Date().toLocaleString('th-TH',{dateStyle: 'long', timeStyle: 'medium'})
  return date
};