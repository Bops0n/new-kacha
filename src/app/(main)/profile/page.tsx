'use client';

import React, { useState, useEffect } from 'react';
import { FiEdit, FiSave, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiHash, FiHome, FiPlus, FiTrash2, FiStar } from 'react-icons/fi';
import { useProfilePage } from '@/app/hooks/useProfilePage'; // << 1. Import Hook
import { UserSchema, AddressSchema, NewAddressForm } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useSession } from 'next-auth/react';

// --- Address Form Modal Component ---
interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewAddressForm) => Promise<boolean>;
  initialData: NewAddressForm;
}
const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(initialData);

    useEffect(() => { setFormData(initialData); }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } : any = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSave(formData);
        if (success) onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="modal modal-open flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="modal-box w-full max-w-xl bg-base-100 rounded-lg shadow-xl p-0">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-base-content text-center mb-6">
                        {initialData.Address_ID ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text flex items-center gap-2"><FiHome />ที่อยู่ (บรรทัด 1)</span></label>
                            <input type="text" name="Address_1" value={formData.Address_1} onChange={handleChange} placeholder="เลขที่, หมู่, ถนน" className="input input-bordered w-full" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text flex items-center gap-2"><FiHome />ที่อยู่ (บรรทัด 2 - ไม่บังคับ)</span></label>
                            <input type="text" name="Address_2" value={formData.Address_2 || ''} onChange={handleChange} placeholder="อาคาร, ชั้น, ห้อง" className="input input-bordered w-full" />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text flex items-center gap-2"><FiMapPin />แขวง/ตำบล</span></label>
                            <input type="text" name="Sub_District" value={formData.Sub_District} onChange={handleChange} placeholder="แขวง/ตำบล" className="input input-bordered w-full" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text flex items-center gap-2"><FiMapPin />เขต/อำเภอ</span></label>
                            <input type="text" name="District" value={formData.District} onChange={handleChange} placeholder="เขต/อำเภอ" className="input input-bordered w-full" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text flex items-center gap-2"><FiMapPin />จังหวัด</span></label>
                            <input type="text" name="Province" value={formData.Province} onChange={handleChange} placeholder="จังหวัด" className="input input-bordered w-full" required />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text flex items-center gap-2"><FiHash />รหัสไปรษณีย์</span></label>
                            <input type="text" name="Zip_Code" value={formData.Zip_Code} onChange={handleChange} placeholder="รหัสไปรษณีย์" className="input input-bordered w-full" required maxLength={5} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text flex items-center gap-2"><FiPhone />เบอร์โทรศัพท์</span></label>
                            <input type="tel" name="Phone" value={formData.Phone} onChange={handleChange} placeholder="08X-XXX-XXXX" className="input input-bordered w-full" required maxLength={10} />
                        </div>
                        <div className="form-control">
                            <label className="label cursor-pointer gap-2"><input type="checkbox" name="Is_Default" checked={formData.Is_Default} onChange={handleChange} className="checkbox checkbox-primary" /><span className="label-text">ตั้งเป็นที่อยู่เริ่มต้น</span></label>
                        </div>
                        <div className="modal-action mt-6">
                            <button type="button" onClick={onClose} className="btn btn-ghost">ยกเลิก</button>
                            <button type="submit" className="btn btn-primary">บันทึก</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- Main Profile Page Component ---
export default function ProfilePage() {
  // 2. เรียกใช้ Hook เพื่อดึง State และฟังก์ชันทั้งหมด
  const { loading, userProfile, userAddresses, updateUserProfile, saveAddress, deleteAddress, setDefaultAddress } = useProfilePage();

  const { data: session, update } = useSession();

  // State สำหรับจัดการ UI ภายในหน้านี้เท่านั้น
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<Partial<UserSchema>>({});
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressInitialData, setAddressInitialData] = useState<NewAddressForm | null>(null);

  // เมื่อข้อมูล userProfile จาก hook เปลี่ยน ให้อัปเดต state ของ form
  useEffect(() => {
    if (userProfile) {
      setProfileFormData({ Full_Name: userProfile.Full_Name, Email: userProfile.Email, Phone: userProfile.Phone });
    }
  }, [userProfile]);
  
  // --- Handlers for UI events ---
  const handleProfileSave = async () => {
    const success = await updateUserProfile(profileFormData);
    if (success && session) {
      await update({
        user: {
          ...session.user,
          name: profileFormData.Full_Name
        },
      });
      setIsEditingProfile(false);
    }
  };
  
  const openNewAddressModal = () => {
    if (!userProfile) return;
    setAddressInitialData({
      Address_ID: null, User_ID: userProfile.User_ID, Address_1: '', Address_2: '',
      Sub_District: '', District: '', Province: '', Zip_Code: '', Is_Default: false, Phone: userProfile.Phone || ''
    });
    setIsAddressModalOpen(true);
  };
  
  const openEditAddressModal = (address: AddressSchema) => {
    setAddressInitialData({ ...address, Address_2: address.Address_2 || '', Phone: address.Phone || '' });
    setIsAddressModalOpen(true);
  };
  
  if (loading) return <LoadingSpinner />;
  if (!userProfile) return <div className="text-center p-8">ไม่สามารถโหลดข้อมูลผู้ใช้ได้</div>;

  // 3. ส่วน JSX ทั้งหมดจะใช้ State และเรียกฟังก์ชันจาก Hook และ UI State
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-xl p-8 flex flex-col lg:flex-row gap-8">
        
        {/* --- User Profile Section (UI เดิม) --- */}
        <div className="flex-1 pb-8 border-b lg:border-b-0 lg:border-r lg:pr-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-base-content">ข้อมูลส่วนตัว</h1>
            {!isEditingProfile ? (
              <button onClick={() => setIsEditingProfile(true)} className="btn btn-primary btn-sm"><FiEdit className="mr-2" />แก้ไขข้อมูล</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingProfile(false)} className="btn btn-ghost btn-sm"><FiX className="mr-2" />ยกเลิก</button>
                <button onClick={handleProfileSave} className="btn btn-success btn-sm"><FiSave className="mr-2" />บันทึก</button>
              </div>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text flex items-center gap-2"><FiUser />ชื่อผู้ใช้งาน</span></label>
              <p className="font-semibold ml-1 text-lg">{userProfile.Username}</p>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text flex items-center gap-2"><FiUser />ชื่อ-นามสกุล</span></label>
              {isEditingProfile ? (<input type="text" value={profileFormData.Full_Name || ''} onChange={(e) => setProfileFormData(p => ({...p, Full_Name: e.target.value}))} className="input input-bordered w-full" />) : (<p className="font-semibold ml-1 text-lg">{userProfile.Full_Name}</p>)}
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text flex items-center gap-2"><FiMail />อีเมล</span></label>
              {isEditingProfile ? (<input type="email" value={profileFormData.Email || ''} onChange={(e) => setProfileFormData(p => ({...p, Email: e.target.value}))} className="input input-bordered w-full" />) : (<p className="font-semibold ml-1 text-lg">{userProfile.Email}</p>)}
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text flex items-center gap-2"><FiPhone />เบอร์โทรศัพท์</span></label>
              {isEditingProfile ? (<input type="tel" value={profileFormData.Phone || ''} onChange={(e) => setProfileFormData(p => ({...p, Phone: e.target.value}))} className="input input-bordered w-full" />) : (<p className="font-semibold ml-1 text-lg">{userProfile.Phone}</p>)}
            </div>
          </form>
        </div>

        {/* --- Address Management Section (UI เดิม) --- */}
        <div className="flex-1 pt-8 lg:pt-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-base-content">ที่อยู่สำหรับจัดส่ง</h2>
            <button onClick={openNewAddressModal} className="btn btn-secondary btn-sm"><FiPlus className="mr-2" />เพิ่มที่อยู่ใหม่</button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {userAddresses.length === 0 ? (<p className="text-center py-6 text-base-content/60">คุณยังไม่มีที่อยู่สำหรับจัดส่ง</p>) : 
            userAddresses.map(address => (
              <div key={address.Address_ID} className={`card border rounded-lg p-6 shadow-sm ${address.Is_Default ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'}`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                      <FiMapPin className={`w-5 h-5 ${address.Is_Default ? 'text-primary' : 'text-base-content/70'}`} />
                      {address.Is_Default && <span className="badge badge-primary text-primary-content">เริ่มต้น</span>}
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={() => openEditAddressModal(address)} className="btn btn-ghost btn-xs"><FiEdit /></button>
                      <button onClick={() => deleteAddress(address.Address_ID)} className="btn btn-ghost btn-xs text-error"><FiTrash2 /></button>
                    </div>
                </div>
                <p className="text-base-content/90">
                  {address.Address_1} {address.Address_2 && `, ${address.Address_2}`}<br />
                  {`แขวง/ตำบล ${address.Sub_District}, เขต/อำเภอ ${address.District}`}<br />
                  {`จังหวัด ${address.Province}, ${address.Zip_Code}`}<br />
                  โทรศัพท์: {address.Phone}
                </p>
                {!address.Is_Default && (
                  <div className="text-right mt-4">
                    <button onClick={() => setDefaultAddress(address.Address_ID)} className="btn btn-sm btn-outline btn-primary">
                      <FiStar className="mr-2"/>ตั้งเป็นที่อยู่เริ่มต้น
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isAddressModalOpen && addressInitialData && (
          <AddressModal
            isOpen={isAddressModalOpen}
            onClose={() => setIsAddressModalOpen(false)}
            onSave={saveAddress}
            initialData={addressInitialData}
          />
      )}
    </div>
  );
}