import { getSettingFromDB, setSettingToDB } from "../api/services/website/settingService";

const settingsCache = new Map<WEBSITE_SETTING_KEYS, string>();
let settingsInitialized = false;

export function getCachedSetting(key: WEBSITE_SETTING_KEYS): string | null {
    return settingsCache.get(key) ?? null;
}

export function updateCachedSetting(key: WEBSITE_SETTING_KEYS, value: string): void {
    settingsCache.set(key, value);
}

export async function getSetting(key: WEBSITE_SETTING_KEYS): Promise<string | null> {
    const cached = getCachedSetting(key);
    if (cached !== null) return cached;

    const value = await getSettingFromDB(key);
    if (value !== null) updateCachedSetting(key, value);
    return value;
}

export function setAllSettingsCache(entries: { key: WEBSITE_SETTING_KEYS; value: string }[]): void {
  entries.forEach(e => settingsCache.set(e.key, e.value));
  settingsInitialized = true;
}

export function isSettingsInitialized() {
  return settingsInitialized;
}

export type WEBSITE_SETTING_KEYS =
    | 'WEBSITE_NAME'
    | 'WEBSITE_LOGO_URL'
    | 'WEBSITE_FAVICON_URL'
    | 'WEBSITE_DESCRIPTION'
    | 'WEBSITE_KEYWORDS'
    | 'CONTACT_EMAIL'
    | 'CONTACT_PHONE'
    | 'CONTACT_ADDRESS'
    | 'CONTACT_MAP_EMBED_URL'
    | 'FACEBOOK_URL'
    | 'FACEBOOK_PAGE_NAME'
    | 'LINE_URL'
    | 'LINE_OFFICIAL_NAME'
    | 'COMPANY_NAME'
    | 'COMPANY_ADDRESS'
    | 'COMPANY_TAX_ID'
    | 'VAT_RATE'
    | 'PAYMENT_BANK_NAME'
    | 'PAYMENT_BANK_ACCOUNT_NAME'
    | 'PAYMENT_BANK_ACCOUNT_NUMBER'
    | 'PAYMENT_TIMEOUT_HOURS'
    | 'PAYMENT_COD_FEE'
    | 'SHIPPING_FLAT_RATE'
    | 'SHIPPING_FREE_THRESHOLD'
    | 'MAINTENANCE_MODE'
    | 'MAINTENANCE_MESSAGE'

export type WEBSITE_SETTING_TYPE = "string" | "number" | "boolean" | "json" | "image";

export type WEBSITE_SETTING_GROUP = "general" | "order" | "payment" | "system";

export interface WEBSITE_SETTING_DEFINITION {
    key: WEBSITE_SETTING_KEYS;
    label: string;
    description?: string;
    type: WEBSITE_SETTING_TYPE;
    group: WEBSITE_SETTING_GROUP;
    default: string;
}

export const WEBSITE_SETTINGS_DEF: WEBSITE_SETTING_DEFINITION[] = [
  // --------------------
  // GENERAL
  // --------------------
  {
    key: "WEBSITE_NAME",
    label: "ชื่อเว็บไซต์",
    description: "ชื่อที่ใช้แสดงบน Header, Title, อีเมล และเอกสารต่าง ๆ",
    type: "string",
    group: "general",
    default: "My Construction Shop"
  },
  {
    key: "WEBSITE_LOGO_URL",
    label: "โลโก้เว็บไซต์",
    description: "URL ของ Logo ที่ใช้บนเว็บไซต์และอีเมล",
    type: "image",
    group: "general",
    default: ""
  },
  // {
  //   key: "WEBSITE_FAVICON_URL",
  //   label: "ไอคอน Favicon",
  //   description: "URL รูปสำหรับแสดงบนแท็บเบราว์เซอร์",
  //   type: "image",
  //   group: "general",
  //   default: ""
  // },
  {
    key: "WEBSITE_DESCRIPTION",
    label: "คำอธิบายเว็บไซต์",
    description: "ใช้สำหรับ SEO และข้อมูลเมตา",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "WEBSITE_KEYWORDS",
    label: "SEO Keywords",
    description: "คีย์เวิร์ดสำหรับ SEO (คั่นด้วย ,)",
    type: "string",
    group: "general",
    default: ""
  },

  // --------------------
  // CONTACT
  // --------------------
  {
    key: "CONTACT_EMAIL",
    label: "อีเมลติดต่อ",
    description: "ใช้สำหรับให้ลูกค้าติดต่อฝ่ายบริการ",
    type: "string",
    group: "general",
    default: "support@example.com"
  },
  {
    key: "CONTACT_PHONE",
    label: "เบอร์ติดต่อ",
    description: "แสดงบนหน้า Contact และสลิปต่าง ๆ",
    type: "string",
    group: "general",
    default: "098-765-4321"
  },
  {
    key: "CONTACT_ADDRESS",
    label: "ที่อยู่ติดต่อ",
    description: "ที่อยู่หน้าร้านหรือที่อยู่บริษัท",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "CONTACT_MAP_EMBED_URL",
    label: "แผนที่ Google Map",
    description: "URL Embed Map สำหรับหน้า Contact",
    type: "string",
    group: "general",
    default: ""
  },

  // --------------------
  // SOCIAL MEDIA
  // --------------------
  {
    key: "FACEBOOK_URL",
    label: "Facebook Page",
    description: "ลิงก์ Facebook แสดงบน Footer",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "FACEBOOK_PAGE_NAME",
    label: "ชื่อหน้า Facebook",
    description: "ชื่อที่ใช้แสดงบนลิงก์ Facebook ใน Footer",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "LINE_URL",
    label: "LINE Official",
    description: "ลิงก์ LINE OA หรือคิวอาร์โค้ด",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "LINE_OFFICIAL_NAME",
    label: "ชื่อ LINE Official",
    description: "ชื่อที่ใช้แสดงบนลิงก์ LINE ใน Footer",
    type: "string",
    group: "general",
    default: ""
  },

  // --------------------
  // COMPANY
  // --------------------
  {
    key: "COMPANY_NAME",
    label: "ชื่อบริษัท",
    description: "ใช้แสดงบนสลิป ใบเสร็จ และใบกำกับภาษี",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "COMPANY_ADDRESS",
    label: "ที่อยู่บริษัท",
    description: "ใช้บนใบกำกับภาษี/ใบเสร็จ",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "COMPANY_TAX_ID",
    label: "เลขประจำตัวผู้เสียภาษี",
    description: "ใช้กำกับบนใบเสร็จ/ใบกำกับภาษี",
    type: "string",
    group: "general",
    default: ""
  },
  {
    key: "VAT_RATE",
    label: "อัตราภาษีมูลค่าเพิ่ม (%)",
    description: "อัตราภาษีที่ใช้คำนวณในระบบ",
    type: "number",
    group: "general",
    default: "7"
  },

  // --------------------
  // PAYMENT
  // --------------------
  {
    key: "PAYMENT_BANK_NAME",
    label: "ชื่อธนาคาร",
    description: "ชื่อธนาคารที่ใช้รับเงิน",
    type: "string",
    group: "payment",
    default: "กสิกรไทย"
  },
  {
    key: "PAYMENT_BANK_ACCOUNT_NAME",
    label: "ชื่อบัญชี",
    description: "ชื่อเจ้าของบัญชีสำหรับการโอนเงิน",
    type: "string",
    group: "payment",
    default: ""
  },
  {
    key: "PAYMENT_BANK_ACCOUNT_NUMBER",
    label: "เลขที่บัญชี",
    description: "เลขที่บัญชีธนาคารสำหรับโอนเงิน",
    type: "string",
    group: "payment",
    default: ""
  },
  {
    key: "PAYMENT_TIMEOUT_HOURS",
    label: "ระยะเวลาหมดอายุการชำระเงิน (ชั่วโมง)",
    description: "หลังสั่งซื้อ ต้องแนบสลิปภายในกี่ชั่วโมง",
    type: "number",
    group: "payment",
    default: "24"
  },
  // {
  //   key: "PAYMENT_COD_FEE",
  //   label: "ค่าธรรมเนียม COD",
  //   description: "ค่าบริการเก็บเงินปลายทาง",
  //   type: "number",
  //   group: "payment",
  //   default: "0"
  // },

  // --------------------
  // SHIPPING
  // --------------------
  // {
  //   key: "SHIPPING_FLAT_RATE",
  //   label: "ค่าจัดส่งเหมาจ่าย",
  //   description: "ค่าจัดส่งแบบเหมาจ่ายต่อออเดอร์",
  //   type: "number",
  //   group: "order",
  //   default: "50"
  // },
  // {
  //   key: "SHIPPING_FREE_THRESHOLD",
  //   label: "ยอดขั้นต่ำสำหรับส่งฟรี",
  //   description: "หากยอดรวมมากกว่าที่กำหนดจะจัดส่งฟรี",
  //   type: "number",
  //   group: "order",
  //   default: "1500"
  // },

  // --------------------
  // SYSTEM
  // --------------------
  // {
  //   key: "MAINTENANCE_MODE",
  //   label: "โหมดบำรุงรักษา (Maintenance Mode)",
  //   description: "เมื่อเปิด ลูกค้าจะไม่สามารถเข้าใช้งานหน้าเว็บได้",
  //   type: "boolean",
  //   group: "system",
  //   default: "False"
  // },
  // {
  //   key: "MAINTENANCE_MESSAGE",
  //   label: "ข้อความแจ้งปิดปรับปรุง",
  //   description: "ข้อความที่จะแสดงหากเว็บไซต์อยู่ในโหมด Maintenance",
  //   type: "string",
  //   group: "system",
  //   default: "เว็บไซต์กำลังปรับปรุง กรุณากลับมาอีกครั้งในภายหลัง"
  // }
];


export function getSettingDefinition(key: WEBSITE_SETTING_KEYS): WEBSITE_SETTING_DEFINITION {
  const def = WEBSITE_SETTINGS_DEF.find(d => d.key === key);
  if (!def) throw new Error(`Unknown website setting key: ${key}`);
  return def;
}
