'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiEdit3, FiSave, FiX, FiUser, FiMail, FiPhone, 
  FiMapPin, FiPlus, FiTrash2, FiStar, FiCheckCircle, FiBox 
} from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useProfilePage } from '@/app/hooks/useProfilePage';
import { UserSchema, AddressSchema, NewAddressForm } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import AddressModal from '@/app/(main)/components/AddressModal';

export default function ProfilePage() {
  const { 
    loading, 
    userProfile, 
    userAddresses, 
    updateUserProfile, 
    saveAddress, 
    deleteAddress, 
    setDefaultAddress 
  } = useProfilePage();

  const { data: session, update } = useSession();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<Partial<UserSchema>>({});
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressInitialData, setAddressInitialData] = useState<Partial<NewAddressForm>>({});

  useEffect(() => {
    if (userProfile) {
      setProfileFormData({ 
        Full_Name: userProfile.Full_Name, 
        Email: userProfile.Email, 
        Phone: userProfile.Phone 
      });
    }
  }, [userProfile]);
  
  const handleProfileSave = async () => {
    const success = await updateUserProfile(profileFormData);
    if (success && session) {
      await update({ user: { ...session.user, name: profileFormData.Full_Name } });
      setIsEditingProfile(false);
    }
  };
  
  const openNewAddressModal = () => {
    if (!userProfile) return;
    setAddressInitialData({
      Address_ID: null, 
      User_ID: userProfile.User_ID, 
      Address_1: '', Address_2: '', Sub_District: '', District: '', Province: '', Zip_Code: '', 
      Is_Default: false, Phone: userProfile.Phone || ''
    });
    setIsAddressModalOpen(true);
  };
  
  const openEditAddressModal = (address: AddressSchema) => {
    setAddressInitialData({ ...address, Address_2: address.Address_2 || '', Phone: address.Phone || '' });
    setIsAddressModalOpen(true);
  };

  const handleAddressModalSave = async (data: AddressSchema) => {
    const success = await saveAddress(data);
    if (!success) throw new Error("บันทึกข้อมูลไม่สำเร็จ");
  };
  
  if (loading) return <LoadingSpinner />;
  if (!userProfile) return <div className="flex h-[50vh] items-center justify-center text-base-content/60">ไม่สามารถโหลดข้อมูลผู้ใช้ได้</div>;

  return (
    <div className="min-h-screen bg-base-200/50 py-10 px-4 font-sarabun">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-4 px-2">
            <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center text-primary-content shadow-xl ring-4 ring-base-100">
                    <FiUser className="w-10 h-10 md:w-14 md:h-14" />
                </div>
                <div className="absolute bottom-0 right-0 bg-base-100 rounded-full p-1 shadow-md">
                    <div className="bg-success w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-base-100"></div>
                </div>
            </div>
            <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">{userProfile.Full_Name}</h1>
                <p className="text-base-content/60 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                    @{userProfile.Username} <span className="w-1 h-1 bg-base-300 rounded-full"></span> {userProfile.Email}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- Left Column: Profile Card --- */}
            <div className="lg:col-span-4 space-y-6">
                <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-base-200">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FiUser className="text-primary" /> ข้อมูลส่วนตัว
                            </h2>
                            {!isEditingProfile ? (
                                <button onClick={() => setIsEditingProfile(true)} className="btn btn-ghost btn-sm btn-circle text-primary tooltip tooltip-left" data-tip="แก้ไข">
                                    <FiEdit3 className="w-5 h-5" />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingProfile(false)} className="btn btn-ghost btn-xs">ยกเลิก</button>
                                    <button onClick={handleProfileSave} className="btn btn-primary btn-xs">บันทึก</button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }} className="space-y-5">
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold uppercase text-base-content/50">ชื่อ-นามสกุล</span></label>
                                {isEditingProfile ? (
                                    <input type="text" value={profileFormData.Full_Name || ''} onChange={(e) => setProfileFormData(p => ({...p, Full_Name: e.target.value}))} className="input input-bordered input-sm w-full focus:input-primary" />
                                ) : (
                                    <p className="font-medium text-base-content">{userProfile.Full_Name}</p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold uppercase text-base-content/50">อีเมล</span></label>
                                {isEditingProfile ? (
                                    <input type="email" value={profileFormData.Email || ''} onChange={(e) => setProfileFormData(p => ({...p, Email: e.target.value}))} className="input input-bordered input-sm w-full focus:input-primary" />
                                ) : (
                                    <p className="font-medium text-base-content flex items-center gap-2"><FiMail className="opacity-50"/> {userProfile.Email}</p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold uppercase text-base-content/50">เบอร์โทรศัพท์</span></label>
                                {isEditingProfile ? (
                                    <input type="tel" value={profileFormData.Phone || ''} onChange={(e) => setProfileFormData(p => ({...p, Phone: e.target.value}))} className="input input-bordered input-sm w-full focus:input-primary" />
                                ) : (
                                    <p className="font-medium text-base-content flex items-center gap-2"><FiPhone className="opacity-50"/> {userProfile.Phone || '-'}</p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Optional: Stats Card or other info could go here */}
            </div>

            {/* --- Right Column: Address Management --- */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
                            <FiMapPin className="text-primary" /> ที่อยู่สำหรับจัดส่ง
                        </h2>
                        <p className="text-sm text-base-content/60 mt-1">จัดการที่อยู่สำหรับการจัดส่งสินค้าของคุณ</p>
                    </div>
                    <button onClick={openNewAddressModal} className="btn btn-primary shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
                        <FiPlus className="w-5 h-5" /> เพิ่มที่อยู่ใหม่
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userAddresses.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-base-300 rounded-2xl bg-base-50/50 text-base-content/50">
                            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
                                <FiBox className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-lg font-medium">คุณยังไม่มีที่อยู่สำหรับจัดส่ง</p>
                            <p className="text-sm">เพิ่มที่อยู่ใหม่เพื่อความสะดวกรวดเร็วในการสั่งซื้อ</p>
                        </div>
                    ) : (
                        userAddresses.map(address => (
                            <div 
                                key={address.Address_ID} 
                                className={`card relative group transition-all duration-300 hover:-translate-y-1 overflow-hidden
                                    ${address.Is_Default 
                                        ? 'bg-base-100 border-2 border-primary shadow-lg shadow-primary/10' 
                                        : 'bg-base-100 border border-base-200 hover:shadow-lg hover:border-base-300'
                                    }`}
                            >
                                {address.Is_Default && (
                                    <div className="absolute top-0 right-0 bg-primary text-primary-content text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
                                        <FiStar className="fill-current" /> ค่าเริ่มต้น
                                    </div>
                                )}
                                
                                <div className="card-body p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${address.Is_Default ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60'}`}>
                                                <FiMapPin className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-lg text-base-content line-clamp-1">
                                                {address.District}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-base-content/70 space-y-1 mb-4 h-20 overflow-hidden">
                                        <p className="font-medium text-base-content line-clamp-1">{address.Address_1} {address.Address_2}</p>
                                        <p>{address.Sub_District}, {address.District}</p>
                                        <p>{address.Province}, {address.Zip_Code}</p>
                                        <div className="flex items-center gap-2 pt-1 text-base-content/90">
                                            <FiPhone className="w-3 h-3" /> {address.Phone}
                                        </div>
                                    </div>

                                    <div className="card-actions justify-between items-center pt-3 border-t border-base-200/50">
                                        {!address.Is_Default ? (
                                            <button 
                                                onClick={() =>  address.Address_ID && setDefaultAddress(address.Address_ID)} 
                                                className="btn btn-ghost btn-xs text-base-content/50 hover:text-primary gap-1 pl-0"
                                            >
                                                <FiCheckCircle /> ตั้งเป็นค่าเริ่มต้น
                                            </button>
                                        ) : (
                                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                                                <FiCheckCircle /> ใช้เป็นที่อยู่หลักแล้ว
                                            </span>
                                        )}

                                        <div className="flex gap-2">
                                            <button onClick={() => openEditAddressModal(address)} className="btn btn-ghost btn-xs btn-square text-info hover:bg-info/10 tooltip" data-tip="แก้ไข">
                                                <FiEdit3 />
                                            </button>
                                            <button onClick={() => address.Address_ID && deleteAddress(address.Address_ID)} className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10 tooltip" data-tip="ลบ">
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>

        <AddressModal
            isOpen={isAddressModalOpen}
            onClose={() => setIsAddressModalOpen(false)}
            onSave={handleAddressModalSave}
            initialData={addressInitialData}
        />
      </div>
    </div>
  );
}