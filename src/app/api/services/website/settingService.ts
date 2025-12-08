import { poolQuery } from "../../lib/db";
import { getCachedSetting, getSettingDefinition, isSettingsInitialized, setAllSettingsCache, updateCachedSetting, WEBSITE_SETTING_GROUP, WEBSITE_SETTING_KEYS, WEBSITE_SETTING_TYPE, WEBSITE_SETTINGS_DEF } from "@/app/utils/setting";

export async function getSettingFromDB(key: WEBSITE_SETTING_KEYS): Promise<string | null> {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_WEBSITE_SETTING_GET"($1)`, [key]);
    return rows[0]?.VALUE ?? null;
}

export async function setSettingToDB(key: WEBSITE_SETTING_KEYS, value: string, type: WEBSITE_SETTING_TYPE, group: WEBSITE_SETTING_GROUP, userId: number): Promise<boolean> {
    const { rowCount } = await poolQuery(`SELECT * FROM master."SP_MASTER_WEBSITE_SETTING_UPD"($1, $2, $3, $4, $5)`, 
      [key, value, type, group, userId]);
    return rowCount > 0;
}

export async function loadAllSettingsFromDB() {
    const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_WEBSITE_SETTING_GET"()`);
    return rows.map(({ KEY, VALUE }: any) => ({ key: KEY, value: VALUE }));
}

export async function getSettingHistory(key: WEBSITE_SETTING_KEYS, limit: number = 20) {
  const { rows } = await poolQuery(`SELECT * FROM master."SP_MASTER_WEBSITE_SETTING_HISTORY_GET"($1, $2)`, [key, limit]);
  return rows;
}

async function ensureSettingsLoaded() {
  if (isSettingsInitialized()) return;
  const all = await loadAllSettingsFromDB();
  setAllSettingsCache(all);
}

export async function getSettingRaw(key: WEBSITE_SETTING_KEYS): Promise<string> {
  await ensureSettingsLoaded();

  const def = getSettingDefinition(key);
  const cached = getCachedSetting(key);
  if (cached !== null) return cached;

  const dbValue = await getSettingFromDB(key);
  if (dbValue !== null) {
    updateCachedSetting(key, dbValue);
    return dbValue;
  }

  // fallback default
  updateCachedSetting(key, def.default);
  return def.default;
}

/** แปลงค่าตาม TYPE (string/number/boolean/json) */
function parseByType(raw: string, type: WEBSITE_SETTING_TYPE): any {
  switch (type) {
    case "number":
      return Number(raw);
    case "boolean":
      return raw === "True" || raw === "1";
    case "json":
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    case "string":
    case "image":
    default:
      return raw;
  }
}

export async function getSettingTyped<T = unknown>(key: WEBSITE_SETTING_KEYS): Promise<T> {
  const def = getSettingDefinition(key);
  const raw = await getSettingRaw(key);
  return parseByType(raw, def.type) as T;
}

/** ใช้ในที่ที่อยากได้ object รวม settings ทั้งหมดแบบ typed บางส่วน */
export async function getWebsiteSettings() {
  return {
    // ---------------------
    // GENERAL
    // ---------------------
    siteName: await getSettingTyped<string>("WEBSITE_NAME"),
    logoURL: await getSettingTyped<string>("WEBSITE_LOGO_URL"),
    // faviconURL: await getSettingTyped<string>("WEBSITE_FAVICON_URL"),
    siteDescription: await getSettingTyped<string>("WEBSITE_DESCRIPTION"),
    siteKeywords: await getSettingTyped<string>("WEBSITE_KEYWORDS"),

    // ---------------------
    // CONTACT
    // ---------------------
    contactEmail: await getSettingTyped<string>("CONTACT_EMAIL"),
    contactPhone: await getSettingTyped<string>("CONTACT_PHONE"),
    contactAddress: await getSettingTyped<string>("CONTACT_ADDRESS"),
    contactMapEmbedURL: await getSettingTyped<string>("CONTACT_MAP_EMBED_URL"),

    // ---------------------
    // SOCIAL
    // ---------------------
    facebookURL: await getSettingTyped<string>("FACEBOOK_URL"),
    facebookPageName: await getSettingTyped<string>("FACEBOOK_PAGE_NAME"),
    lineURL: await getSettingTyped<string>("LINE_URL"),
    lineOfficialName: await getSettingTyped<string>("LINE_OFFICIAL_NAME"),

    // ---------------------
    // COMPANY INFO
    // ---------------------
    companyName: await getSettingTyped<string>("COMPANY_NAME"),
    companyAddress: await getSettingTyped<string>("COMPANY_ADDRESS"),
    companyTaxId: await getSettingTyped<string>("COMPANY_TAX_ID"),
    vatRate: await getSettingTyped<number>("VAT_RATE"),

    // ---------------------
    // PAYMENT SETTINGS
    // ---------------------
    paymentBankName: await getSettingTyped<string>("PAYMENT_BANK_NAME"),
    paymentBankAccountName: await getSettingTyped<string>("PAYMENT_BANK_ACCOUNT_NAME"),
    paymentBankAccountNumber: await getSettingTyped<string>("PAYMENT_BANK_ACCOUNT_NUMBER"),
    paymentQRScanImage: await await getSettingTyped<string>("PAYMENT_QR_SCAN_IMAGE"),
    paymentTimeoutHours: await getSettingTyped<number>("PAYMENT_TIMEOUT_HOURS"),
    // paymentCODFee: await getSettingTyped<number>("PAYMENT_COD_FEE"),

    // ---------------------
    // SHIPPING SETTINGS
    // ---------------------
    // shippingFlatRate: await getSettingTyped<number>("SHIPPING_FLAT_RATE"),
    // shippingFreeThreshold: await getSettingTyped<number>("SHIPPING_FREE_THRESHOLD"),

    // ---------------------
    // SYSTEM
    // ---------------------
    // maintenanceMode: await getSettingTyped<boolean>("MAINTENANCE_MODE"),
    // maintenanceMessage: await getSettingTyped<string>("MAINTENANCE_MESSAGE")
  };
}

/** Save + History + Cache */
export async function updateSetting(key: WEBSITE_SETTING_KEYS, value: string, type: WEBSITE_SETTING_TYPE, group: WEBSITE_SETTING_GROUP, userId: number) {
  await ensureSettingsLoaded();

  const def = getSettingDefinition(key);

  // validation basic ตาม type
  if (def.type !== type) {
    throw new Error(`ประเภทของค่า ${def.label} ไม่ถูกต้อง (Expected: ${def.type}, Actual: ${type})`);
  }

  if (def.type === "number" && isNaN(Number(value))) {
    throw new Error(`ค่า '${def.label}' ต้องเป็นตัวเลข`);
  }
  if (def.type === "boolean" && !["True", "False", "1", "0"].includes(value)) {
    throw new Error(`ค่า '${def.label}' ต้องเป็น True/False หรือ 1/0`);
  }

  const result = await setSettingToDB(key, value, type, group, userId);
  if (!result) {
    throw new Error(`ไม่สามารถบันทึกค่า ${def.label} ได้`);
  }
  updateCachedSetting(key, value);
}

/** ใช้ตอน server start (optional) */
export async function initializeWebsiteSettingsOnStart() {
  if (!isSettingsInitialized()) {
    const all = await loadAllSettingsFromDB();
    setAllSettingsCache(all);
  }
}

/** ใช้ให้ Admin UI ดึง list ทั้งหมด */
export async function getAllSettingsForAdmin() {
    const all = await loadAllSettingsFromDB();
    setAllSettingsCache(all);
    return WEBSITE_SETTINGS_DEF.map(def => {
        const entry = all.find(({ key } : any) => key === def.key);
        return {
            ...def,
            value: entry?.value ?? def.default
        };
    });
}