'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { UserSchema, AddressSchema, NewAddressForm } from '@/types';

export function useProfilePage() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [userProfile, setUserProfile] = useState<UserSchema | null>(null);
  const [userAddresses, setUserAddresses] = useState<AddressSchema[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    // if (sessionStatus !== 'authenticated') {
    //   if (sessionStatus === 'unauthenticated') router.push('/login');
    //   return;
    // }
    setLoading(true);
    try {
      const [profileRes, addressesRes] = await Promise.all([
        fetch('/api/main/profile'),
        fetch('/api/main/address')
      ]);
      if (!profileRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');

      if (!addressesRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลที่อยู่ได้');
      
      const profileData = await profileRes.json();
      const addressesData = await addressesRes.json();
      
      setUserProfile(profileData.user);
      setUserAddresses(addressesData.addresses || []);
    } catch (err: any) {
      showAlert(err.message, 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, router, showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Profile Actions ---
  const updateUserProfile = async (updatedData: Partial<UserSchema>) => {
    try {
      const response = await fetch('/api/main/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      await updateSession({ user: { ...session?.user, name: updatedData.Full_Name } });
      await fetchData(); // Re-fetch data to get the latest profile
      
      showAlert('อัปเดตข้อมูลส่วนตัวสำเร็จ', 'success');
      return true;
    } catch (err: any) {
      showAlert(err.message, 'error');
      return false;
    }
  };

  // --- Address Actions ---
  const saveAddress = async (addressData: AddressSchema) => {
    const isEditing = !!addressData.Address_ID;
    console.log(addressData, isEditing)
    // return
    const url = isEditing ? `/api/main/address/${addressData.Address_ID}` : '/api/main/address';
    const method = isEditing ? 'PUT' : 'POST';
    console.log(addressData)
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      await fetchData();   // Re-fetch addresses
      showAlert(isEditing ? 'แก้ไขที่อยู่สำเร็จ' : 'เพิ่มที่อยู่สำเร็จ', 'success');
      // window.location.reload();
      return true;
    } catch (err: any) {
      showAlert(err.message, 'error');
      return false;
    }
  };
  
  const deleteAddress = async (addressId: number) => {
    showAlert('คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?', 'warning', 'ยืนยันการลบ', async () => {
        try {
            const response = await fetch(`/api/main/address/${addressId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            await fetchData(); // Re-fetch addresses
            showAlert('ลบที่อยู่สำเร็จ', 'success');
            window.location.reload();
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  };

  const setDefaultAddress = async (addressId: number) => {
    try {
        const response = await fetch(`/api/main/address/${addressId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Is_Default: true }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        await fetchData(); // Re-fetch to update default status on all addresses
        showAlert('ตั้งเป็นที่อยู่เริ่มต้นสำเร็จ', 'success');
    } catch (err: any) {
        showAlert(err.message, 'error');
    }
  };

  return {
    loading: loading || sessionStatus === 'loading',
    userProfile,
    userAddresses,
    fetchData,
    updateUserProfile,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
  };
}