import districtsContainer from './districts.json';
import provincesContainer from './provinces.json';
import subDistrictsContainer from './subDistricts.json';

// --- 1. กำหนด Type ของข้อมูลให้ตรงกับไฟล์ JSON ---

export interface Province {
  PROVINCE_ID: number;
  PROVINCE_CODE: string;
  PROVINCE_NAME: string;
  GEO_ID: number;
}

export interface District {
  DISTRICT_ID: number;
  DISTRICT_CODE: string;
  DISTRICT_NAME: string;
  GEO_ID: number;
  PROVINCE_ID: number;
}

export interface SubDistrict {
  SUB_DISTRICT_ID: number;
  SUB_DISTRICT_CODE: string;
  SUB_DISTRICT_NAME: string;
  DISTRICT_ID: number;
  PROVINCE_ID: number;
  GEO_ID: number;
}

// --- 2. ฟังก์ชันสำหรับดึงข้อมูล ---

// ดึงรายชื่อจังหวัดทั้งหมด
export function getAllProvinces(): Province[] {
  // เรียงลำดับตามชื่อจังหวัด (ถ้าต้องการ)
  return (provincesContainer as Province[]).sort((a, b) => 
    a.PROVINCE_NAME.localeCompare(b.PROVINCE_NAME)
  );
}

// ดึงอำเภอ ตาม ID ของจังหวัด (provinceId)
export function getDistrictsByProvinceId(provinceId: number): District[] {
  return (districtsContainer as District[]).filter(
    (district) => district.PROVINCE_ID === provinceId
  );
}

// ดึงตำบล ตาม ID ของอำเภอ (districtId)
export function getSubDistrictsByDistrictId(districtId: number): SubDistrict[] {
  return (subDistrictsContainer as SubDistrict[]).filter(
    (subDistrict) => subDistrict.DISTRICT_ID === districtId
  );
}

// (Optional) ฟังก์ชันสำหรับค้นหาตาม ID (เผื่อต้องใช้ตอน Edit)
export function getProvinceById(id: number): Province | undefined {
  return (provincesContainer as Province[]).find(p => p.PROVINCE_ID === id);
}

export function getDistrictById(id: number): District | undefined {
  return (districtsContainer as District[]).find(d => d.DISTRICT_ID === id);
}

export function getSubDistrictById(id: number): SubDistrict | undefined {
  return (subDistrictsContainer as SubDistrict[]).find(s => s.SUB_DISTRICT_ID === id);
}