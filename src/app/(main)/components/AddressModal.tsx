'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiHome, FiMapPin, FiHash, FiPhone, FiSave, FiAlertCircle } from 'react-icons/fi';
import { AddressSchema } from '@/types';
import {
  getAllProvinces,
  getDistrictsByProvinceId,
  getSubDistrictsByDistrictId,
  Province,
  District,
  SubDistrict
} from '@/app/utils/AddressList'; // ตรวจสอบ path ให้ถูกต้อง

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressSchema) => Promise<boolean|undefined|void> | void;
  initialData?: Partial<AddressSchema> | null;
}

const defaultFormData: AddressSchema = {
  Address_ID: null,
  User_ID: 0,
  Address_1: '',
  Address_2: '',
  Sub_District: '', // ตำบล
  District: '',     // อำเภอ
  Province: '',     // จังหวัด
  Zip_Code: '',
  Is_Default: false,
  Phone: '',
};

export default function AddressModal({ isOpen, onClose, onSave, initialData }: AddressModalProps) {
  const [formData, setFormData] = useState<AddressSchema>(defaultFormData);
  const [loading, setLoading] = useState(false);

  // --- States สำหรับ Dropdown ---
  const [provinceList, setProvinceList] = useState<Province[]>([]);
  const [districtList, setDistrictList] = useState<District[]>([]);
  const [subDistrictList, setSubDistrictList] = useState<SubDistrict[]>([]);

  // เก็บ ID ที่ถูกเลือกเพื่อใช้ filter ขั้นต่อไป (แยกจาก formData ที่เก็บเป็นชื่อ)
  const [selectedProvId, setSelectedProvId] = useState<number | null>(null);
  const [selectedDistId, setSelectedDistId] = useState<number | null>(null);

  // --- 1. Init: โหลดจังหวัดทั้งหมดเมื่อเปิด Modal ---
  useEffect(() => {
    if (isOpen) {
      const provinces = getAllProvinces();
      setProvinceList(provinces);

      // ถ้าเป็นการแก้ไข (มี initialData)
      if (initialData && initialData.Address_ID) {
        setFormData({ ...defaultFormData, ...initialData });

        // Logic การคืนค่า Dropdown จากชื่อ (Re-hydrate dropdowns)
        const provName = initialData.Province;
        const distName = initialData.District;
        // const subName = initialData.Sub_District;

        // หา Province ID จากชื่อ
        const foundProv = provinces.find(p => p.PROVINCE_NAME === provName);
        if (foundProv) {
          setSelectedProvId(foundProv.PROVINCE_ID);
          const districts = getDistrictsByProvinceId(foundProv.PROVINCE_ID);
          setDistrictList(districts);

          // หา District ID จากชื่อ
          const foundDist = districts.find(d => d.DISTRICT_NAME === distName);
          if (foundDist) {
            setSelectedDistId(foundDist.DISTRICT_ID);
            const subDistricts = getSubDistrictsByDistrictId(foundDist.DISTRICT_ID);
            setSubDistrictList(subDistricts);
          }
        }
      } else {
        // ถ้าเป็นการเพิ่มใหม่ ให้เคลียร์ค่า
        setFormData(defaultFormData);
        setSelectedProvId(null);
        setSelectedDistId(null);
        setDistrictList([]);
        setSubDistrictList([]);
      }
    }
  }, [isOpen, initialData]);

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // เลือกจังหวัด -> โหลดอำเภอ
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = parseInt(e.target.value);
    const selectedProv = provinceList.find(p => p.PROVINCE_ID === provId);

    if (selectedProv) {
      // 1. อัปเดต State ภายใน
      setSelectedProvId(provId);
      // 2. อัปเดต Form Data (เก็บชื่อ)
      setFormData(prev => ({ ...prev, Province: selectedProv.PROVINCE_NAME, District: '', Sub_District: '', Zip_Code: '' }));
      // 3. โหลดอำเภอใหม่ & เคลียร์ตำบล
      setDistrictList(getDistrictsByProvinceId(provId));
      setSubDistrictList([]);
      setSelectedDistId(null);
    } else {
      // กรณีเลือกค่าว่าง
      setSelectedProvId(null);
      setDistrictList([]);
      setSubDistrictList([]);
      setFormData(prev => ({ ...prev, Province: '', District: '', Sub_District: '', Zip_Code: '' }));
    }
  };

  // เลือกอำเภอ -> โหลดตำบล
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = parseInt(e.target.value);
    const selectedDist = districtList.find(d => d.DISTRICT_ID === distId);

    if (selectedDist) {
      setSelectedDistId(distId);
      setFormData(prev => ({ ...prev, District: selectedDist.DISTRICT_NAME, Sub_District: '', Zip_Code: '' }));
      setSubDistrictList(getSubDistrictsByDistrictId(distId));
    } else {
      setSelectedDistId(null);
      setSubDistrictList([]);
      setFormData(prev => ({ ...prev, District: '', Sub_District: '', Zip_Code: '' }));
    }
  };

  // เลือกตำบล -> (ถ้ามี ZipCode ใน DB ก็ Auto-fill ได้)
  const handleSubDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // เนื่องจาก subDistricts.json ที่เห็นไม่มี field ZIP_CODE เราจึงบันทึกแค่ชื่อ
    // แต่ถ้าในอนาคตมี เราสามารถ auto-fill ได้ตรงนี้
    const subDistName = e.target.value; 
    setFormData(prev => ({ ...prev, Sub_District: subDistName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.Province || !formData.District || !formData.Sub_District) {
        alert("กรุณาเลือกข้อมูลที่อยู่ให้ครบถ้วน");
        return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999]">
      <div className="modal-box w-full max-w-2xl bg-base-100 rounded-2xl shadow-2xl p-0 overflow-hidden">
        
        {/* Header */}
        <div className=" px-6 py-4 border-b border-primary/20 flex justify-between items-center">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
                <div className="p-2 bg-primary text-white rounded-lg shadow-sm">
                    <FiHome className="w-5 h-5" />
                </div>
                {formData.Address_ID ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
            </h3>
            <button 
                onClick={onClose} 
                className="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:text-error hover:bg-error/10 transition-colors"
            >
                <FiX className="w-5 h-5" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
            
                {/* 1. ข้อมูลติดต่อ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text font-medium flex gap-1"><FiPhone/> เบอร์โทรศัพท์ <span className="text-error">*</span></span></label>
                        <input 
                        type="tel" 
                        name="Phone" 
                        value={formData.Phone? formData.Phone : '-'} 
                        onChange={handleChange} 
                        placeholder="08X-XXX-XXXX" 
                        className="input input-bordered w-full focus:input-primary bg-base-50" 
                        required 
                        maxLength={10}
                        />
                    </div>
                    {/* Placeholder for Name if needed later */}
                </div>

                <div className="divider text-xs text-base-content/40 my-0">รายละเอียดที่อยู่</div>

                {/* 2. ที่อยู่บรรทัด 1-2 */}
                <div className="space-y-3">
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text font-medium">บ้านเลขที่, หมู่, ซอย, ถนน <span className="text-error">*</span></span></label>
                        <input 
                        type="text" 
                        name="Address_1" 
                        value={formData.Address_1} 
                        onChange={handleChange} 
                        placeholder="เช่น 123/45 หมู่ 6 ซ.สุขใจ ถ.พหลโยธิน" 
                        className="input input-bordered w-full focus:input-primary bg-base-50" 
                        required 
                        />
                    </div>

                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text font-medium">รายละเอียดเพิ่มเติม (เช่น ชื่ออาคาร/คอนโด)</span></label>
                        <input 
                        type="text" 
                        name="Address_2" 
                        value={formData.Address_2 || ''} 
                        onChange={handleChange} 
                        placeholder="เช่น อาคาร A ชั้น 5 ห้อง 502" 
                        className="input input-bordered w-full focus:input-primary bg-base-50" 
                        />
                    </div>
                </div>

                {/* 3. เลือกจังหวัด/อำเภอ/ตำบล (Cascading Dropdown) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200/50 p-4 rounded-xl border border-base-300">
                    
                    {/* จังหวัด */}
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text font-medium flex gap-1"><FiMapPin/> จังหวัด <span className="text-error">*</span></span></label>
                        <select 
                            className="select select-bordered w-full focus:select-primary" 
                            value={selectedProvId || ''} 
                            onChange={handleProvinceChange}
                            required
                        >
                            <option value="" disabled>-- เลือกจังหวัด --</option>
                            {provinceList.map(p => (
                                <option key={p.PROVINCE_ID} value={p.PROVINCE_ID}>{p.PROVINCE_NAME}</option>
                            ))}
                        </select>
                    </div>

                    {/* อำเภอ */}
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text font-medium flex gap-1"><FiMapPin/> เขต/อำเภอ <span className="text-error">*</span></span></label>
                        <select 
                            className="select select-bordered w-full focus:select-primary"
                            value={selectedDistId || ''}
                            onChange={handleDistrictChange}
                            disabled={!selectedProvId} // ปิดถ้ายังไม่เลือกจังหวัด
                            required
                        >
                            <option value="" disabled>-- เลือกเขต/อำเภอ --</option>
                            {districtList.map(d => (
                                <option key={d.DISTRICT_ID} value={d.DISTRICT_ID}>{d.DISTRICT_NAME}</option>
                            ))}
                        </select>
                    </div>

                    {/* ตำบล */}
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text font-medium flex gap-1"><FiMapPin/> แขวง/ตำบล <span className="text-error">*</span></span></label>
                        <select 
                            className="select select-bordered w-full focus:select-primary"
                            value={formData.Sub_District} // ใช้ชื่อในการ match value เพราะตำบลไม่มี ID ใน formData
                            onChange={handleSubDistrictChange}
                            disabled={!selectedDistId} // ปิดถ้ายังไม่เลือกอำเภอ
                            required
                        >
                            <option value="" disabled>-- เลือกแขวง/ตำบล --</option>
                            {subDistrictList.map(s => (
                                <option key={s.SUB_DISTRICT_ID} value={s.SUB_DISTRICT_NAME}>{s.SUB_DISTRICT_NAME}</option>
                            ))}
                        </select>
                    </div>

                    {/* รหัสไปรษณีย์ */}
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text font-medium flex gap-1"><FiHash/> รหัสไปรษณีย์ <span className="text-error">*</span></span></label>
                        <input 
                            type="text" 
                            name="Zip_Code" 
                            value={formData.Zip_Code} 
                            onChange={handleChange} 
                            className="input input-bordered w-full focus:input-primary" 
                            required 
                            maxLength={5}
                            placeholder="รหัสไปรษณีย์"
                        />
                        {/* Note: ถ้าข้อมูลตำบลมี zip code ให้เพิ่ม logic auto-fill ใน handleSubDistrictChange ได้ */}
                    </div>
                </div>

                {/* 4. ค่าเริ่มต้น */}
                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 p-0 hover:opacity-80 transition-opacity">
                        <input 
                        type="checkbox" 
                        name="Is_Default" 
                        checked={formData.Is_Default} 
                        onChange={handleChange} 
                        className="checkbox checkbox-primary checkbox-sm" 
                        />
                        <span className="label-text font-medium">ตั้งเป็นที่อยู่เริ่มต้นในการจัดส่ง</span>
                    </label>
                </div>

                {/* Warning / Error Area (Optional) */}
                <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 p-3 rounded-lg">
                    <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>กรุณาตรวจสอบความถูกต้องของที่อยู่ เพื่อความรวดเร็วในการจัดส่ง</span>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
                        ยกเลิก
                    </button>
                    <button type="submit" className="btn btn-primary min-w-[140px] shadow-lg shadow-primary/30" disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : <><FiSave className="mr-1"/> บันทึกข้อมูล</>}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
}