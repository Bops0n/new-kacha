'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiEdit, FiSave, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiGlobe, FiHash, FiHome, FiPlus, FiTrash2, FiStar } from 'react-icons/fi';
import { useSession } from 'next-auth/react'; // Import useSession
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAlert } from '@/app/context/AlertModalContext'; // Import useAlert

// Import types
import { UserSchema, AddressSchema, UserProfilePageData, NewAddressForm } from '../../types'; // Adjust path as needed

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [isEditingUserProfile, setIsEditingUserProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserSchema | null>(null); // Initialize as null
  const [userAddresses, setUserAddresses] = useState<AddressSchema[]>([]);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressSchema | null>(null);

  const [modalAddressFormData, setModalAddressFormData] = useState<NewAddressForm>({ // Use NewAddressForm
    Address_ID: null, // Null for new address
    User_ID: 0, // Placeholder, will be set from session
    Address_1: '',
    Address_2: '',
    Sub_District: '',
    District: '',
    Province: '',
    Zip_Code: '',
    Is_Default: false,
    Phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect สำหรับ Redirect ถ้าไมได้ Authenticate
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // --- Fetch User Profile ---
  const fetchUserProfile = useCallback(async () => {
    // ไม่ต้อง redirect ในนี้แล้ว เพราะ useEffect ด้านบนจะจัดการให้
    if (!session?.user?.id) { // ตรวจสอบ userId ก่อนเรียก API
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user profile.');
      }
      const data = await response.json();
      setUserProfile(data.user);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      showAlert(err.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error');
    } finally {
      setLoading(false);
    }
  }, [session, showAlert]); // เพิ่ม session ใน dependencies

  // --- Fetch User Addresses ---
  const fetchUserAddresses = useCallback(async () => {
    // ไม่ต้อง redirect ในนี้แล้ว
    if (!session?.user?.id) { // ตรวจสอบ userId ก่อนเรียก API
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/address'); // GET /api/address (collection)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch addresses.');
      }
      const data = await response.json();
      setUserAddresses(data.addresses || []);
    } catch (err: any) {
      console.error('Error fetching addresses:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลที่อยู่ได้');
      showAlert(err.message || 'ไม่สามารถโหลดข้อมูลที่อยู่ได้', 'error');
    } finally {
      setLoading(false);
    }
  }, [session, showAlert]); // เพิ่ม session ใน dependencies

  // Initial data fetch - จะทำงานเมื่อ session.status เปลี่ยนเป็น 'authenticated' และ session.user.id มีค่า
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserProfile();
      fetchUserAddresses();
    }
  }, [status, fetchUserProfile, fetchUserAddresses]);


  // Effect to reset modal form data when modal opens or editingAddress changes
  useEffect(() => {
    if (showAddressModal && userProfile) {
      if (editingAddress) {
        setModalAddressFormData({
          Address_ID: editingAddress.Address_ID,
          User_ID: editingAddress.User_ID,
          Address_1: editingAddress.Address_1,
          Address_2: editingAddress.Address_2 || '',
          Sub_District: editingAddress.Sub_District,
          District: editingAddress.District,
          Province: editingAddress.Province,
          Zip_Code: editingAddress.Zip_Code,
          Is_Default: editingAddress.Is_Default,
          Phone: editingAddress.Phone || '',
        });
      } else {
        setModalAddressFormData({
          Address_ID: null,
          User_ID: userProfile.User_ID, // Use actual user's ID
          Address_1: '',
          Address_2: '',
          Sub_District: '',
          District: '',
          Province: '',
          Zip_Code: '',
          Is_Default: false,
          Phone: userProfile.Phone || '', // Default phone from user profile
        });
      }
    }
  }, [showAddressModal, editingAddress, userProfile]);

  // --- User Profile (General Info) Handlers ---
  const handleUserProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserProfile(prevData => prevData ? ({
      ...prevData,
      [name]: value,
    }) : null);
  };

  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    showAlert('คุณแน่ใจหรือไม่ที่จะบันทึกการเปลี่ยนแปลงโปรไฟล์?', 'info', 'ยืนยันการบันทึก', async () => {
      try {
        const payload = {
          Full_Name: userProfile.Full_Name,
          Email: userProfile.Email,
          Phone: userProfile.Phone,
        };
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to save user profile.');
        }

        showAlert('บันทึกข้อมูลส่วนตัวสำเร็จ!', 'success');
        setIsEditingUserProfile(false);
        fetchUserProfile(); // Re-fetch to ensure latest data consistency
      } catch (error: any) {
        console.error('Failed to save user profile:', error);
        showAlert(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนตัว', 'error');
      }
    });
  };

  const handleCancelUserProfileEdit = () => {
    fetchUserProfile(); // Revert to last fetched data
    setIsEditingUserProfile(false);
  };

  // --- Address Modal Form Handlers ---
  const handleModalAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setModalAddressFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    showAlert('คุณแน่ใจหรือไม่ที่จะบันทึกที่อยู่นี้?', 'info', 'ยืนยันการบันทึกที่อยู่', async () => {
      try {
        const payload: NewAddressForm = {
          ...modalAddressFormData,
          User_ID: userProfile.User_ID,
          Address_2: modalAddressFormData.Address_2 === '' ? null : modalAddressFormData.Address_2,
          Phone: modalAddressFormData.Phone === '' ? null : modalAddressFormData.Phone,
          Is_Default: modalAddressFormData.Is_Default, // Ensure boolean value
        };

        let response;
        if (editingAddress) {
          // Update existing address: Call PUT /api/address/[addressId]
          response = await fetch(`/api/address/${editingAddress.Address_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          // Add new address: Call POST /api/address
          response = await fetch('/api/address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || (editingAddress ? 'Failed to update address.' : 'Failed to add address.'));
        }

        showAlert(result.message || (editingAddress ? 'แก้ไขที่อยู่สำเร็จ!' : 'เพิ่มที่อยู่สำเร็จ!'), 'success');
        setShowAddressModal(false);
        setEditingAddress(null);
        fetchUserAddresses(); // Re-fetch addresses to update the list
      } catch (error: any) {
        console.error('Failed to save address:', error);
        showAlert(error.message || 'เกิดข้อผิดพลาดในการบันทึกที่อยู่', 'error');
      }
    });
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null); // Clear editing state
  };

  // --- Address Actions (Add, Edit, Delete, Set Default) ---
  const handleAddAddressClick = () => {
    setEditingAddress(null); // Clear for new address
    setShowAddressModal(true);
  };

  const handleEditAddressClick = (address: AddressSchema) => {
    setEditingAddress(address); // Set address to be edited
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    showAlert('คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?', 'warning', 'ยืนยันการลบที่อยู่', async () => {
      try {
        // Delete address: Call DELETE /api/address/[addressId]
        const response = await fetch(`/api/address/${addressId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to delete address.');
        }

        showAlert(result.message || 'ลบที่อยู่สำเร็จ!', 'success');
        fetchUserAddresses(); // Re-fetch addresses to update the list
      } catch (error: any) {
        console.error('Failed to delete address:', error);
        showAlert(error.message || 'เกิดข้อผิดพลาดในการลบที่อยู่', 'error');
      }
    });
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    if (!userProfile) return;

    showAlert('คุณแน่ใจหรือไม่ที่จะตั้งค่าที่อยู่นี้เป็นค่าเริ่มต้น?', 'info', 'ยืนยันที่อยู่เริ่มต้น', async () => {
      try {
        // Set default address: Call PUT /api/address/[addressId] to update Is_Default
        // The backend /api/address/[addressId] PUT handler will handle unsetting other defaults.
        const response = await fetch(`/api/address/${addressId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Is_Default: true, User_ID: userProfile.User_ID }), // User_ID for backend security check
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to set default address.');
        }

        showAlert(result.message || 'ตั้งที่อยู่เริ่มต้นสำเร็จ!', 'success');
        fetchUserAddresses(); // Re-fetch addresses to update the list
      } catch (error: any) {
        console.error('Failed to set default address:', error);
        showAlert(error.message || 'เกิดข้อผิดพลาดในการตั้งที่อยู่เริ่มต้น', 'error');
      }
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="ml-4 text-base-content">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // Redirect handled by useEffect, just return null here to prevent flashing content
    return null; 
  }

  if (!userProfile) { // Authenticated but userProfile is null (e.g., initial fetch failed)
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
        <p className="text-error text-lg mb-4">ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ อาจมีข้อผิดพลาดเกิดขึ้น</p>
        <button className="btn btn-primary" onClick={() => {
          setError(null);
          fetchUserProfile();
          fetchUserAddresses();
        }}>ลองอีกครั้ง</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-xl p-8 flex flex-col lg:flex-row gap-8">
        {/* User Profile Section */}
        <div className="flex-1 pb-8 border-b border-base-300 lg:pb-0 lg:border-b-0 lg:pr-8 lg:border-r">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-base-content">ข้อมูลส่วนตัว</h1>
            {!isEditingUserProfile ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsEditingUserProfile(true)}
              >
                <FiEdit className="w-4 h-4 mr-2" />
                แก้ไขข้อมูลผู้ใช้
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleCancelUserProfileEdit}
                >
                  <FiX className="w-4 h-4 mr-2" />
                  ยกเลิก
                </button>
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleSaveUserProfile}
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  บันทึก
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveUserProfile} className="space-y-4">
            {/* User ID - Display only */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2 text-base-content"><FiHash /> รหัสผู้ใช้</span>
              </label>
              <p className="text-lg font-semibold text-base-content ml-1">{userProfile.User_ID}</p>
            </div>

            {/* Username - Display only */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2 text-base-content"><FiUser /> ชื่อผู้ใช้งาน</span>
              </label>
              <p className="text-lg font-semibold text-base-content ml-1">{userProfile.Username}</p>
            </div>

            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2 text-base-content"><FiUser /> ชื่อ-นามสกุล</span>
              </label>
              {isEditingUserProfile ? (
                <input
                  type="text"
                  name="Full_Name"
                  placeholder="ชื่อ-นามสกุลของคุณ"
                  className="input input-bordered w-full"
                  value={userProfile.Full_Name}
                  onChange={handleUserProfileChange}
                  required
                />
              ) : (
                <p className="text-lg font-semibold text-base-content ml-1">{userProfile.Full_Name}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2 text-base-content"><FiMail /> อีเมล</span>
              </label>
              {isEditingUserProfile ? (
                <input
                  type="email"
                  name="Email"
                  placeholder="your.email@example.com"
                  className="input input-bordered w-full"
                  value={userProfile.Email || ''}
                  onChange={handleUserProfileChange}
                  required
                />
              ) : (
                <p className="text-lg font-semibold text-base-content ml-1">{userProfile.Email || '-'}</p>
              )}
            </div>

            {/* Phone Number (from User table) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2 text-base-content"><FiPhone /> เบอร์โทรศัพท์ (หลัก)</span>
              </label>
              {isEditingUserProfile ? (
                <input
                  type="tel"
                  name="Phone"
                  placeholder="08X-XXX-XXXX"
                  className="input input-bordered w-full"
                  value={userProfile.Phone || ''}
                  onChange={handleUserProfileChange}
                  required
                  maxLength={10}
                />
              ) : (
                <p className="text-lg font-semibold text-base-content ml-1">{userProfile.Phone || '-'}</p>
              )}
            </div>

            {!isEditingUserProfile && (
              <div className="text-center mt-8">
                <Link href="#" className="link link-hover text-primary">
                  เปลี่ยนรหัสผ่าน
                </Link>
              </div>
            )}
          </form>
        </div>

        {/* Address Management Section */}
        <div className="flex-1 pt-8 lg:pt-0 lg:pl-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-base-content">ที่อยู่สำหรับจัดส่ง</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleAddAddressClick}
            >
              <FiPlus className="w-4 h-4 mr-2" />
              เพิ่มที่อยู่ใหม่
            </button>
          </div>

          <div className="space-y-4">
            {userAddresses.length === 0 ? (
              <div className="text-center py-6 text-base-content/70">
                <p>คุณยังไม่มีที่อยู่สำหรับจัดส่ง</p>
              </div>
            ) : (
              userAddresses.map(address => (
                <div key={address.Address_ID} className={`card border rounded-lg p-6 shadow-sm ${address.Is_Default ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                      <FiMapPin className={`w-5 h-5 ${address.Is_Default ? 'text-primary' : 'text-base-content/70'}`} />
                      {address.Is_Default && <span className="badge badge-primary text-primary-content">เริ่มต้น</span>}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content"
                        onClick={() => handleEditAddressClick(address)}
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error/70 hover:text-error"
                        onClick={() => handleDeleteAddress(address.Address_ID)}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-base-content/90">
                    {address.Address_1} {address.Address_2 && `, ${address.Address_2}`}<br />
                    แขวง/ตำบล {address.Sub_District}, เขต/อำเภอ {address.District}<br />
                    จังหวัด {address.Province}, รหัสไปรษณีย์ {address.Zip_Code}<br />
                    เบอร์โทรศัพท์: {address.Phone}
                  </p>
                  {!address.Is_Default && (
                    <div className="text-right mt-4">
                      <button
                        className="btn btn-sm btn-outline btn-primary"
                        onClick={() => handleSetDefaultAddress(address.Address_ID)}
                      >
                        <FiStar className="w-4 h-4 mr-2" /> ตั้งเป็นที่อยู่เริ่มต้น
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- Address Form Modal (Moved here) --- */}
        {showAddressModal && (
          <div className="modal modal-open flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="modal-box w-full max-w-xl bg-base-100 rounded-lg shadow-xl p-0">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
                onClick={handleCloseAddressModal}
              >
                ✕
              </button>

              <div className="p-8">
                <h2 className="text-2xl font-bold text-base-content text-center mb-6">
                  {editingAddress ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
                </h2>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  {/* Address 1 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 text-base-content"><FiHome /> ที่อยู่ (บรรทัด 1)</span>
                    </label>
                    <input
                      type="text"
                      name="Address_1"
                      placeholder="เลขที่, หมู่, ถนน"
                      className="input input-bordered w-full"
                      value={modalAddressFormData.Address_1}
                      onChange={handleModalAddressInputChange}
                      required
                    />
                  </div>

                  {/* Address 2 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 text-base-content"><FiHome /> ที่อยู่ (บรรทัด 2 - ไม่บังคับ)</span>
                    </label>
                    <input
                      type="text"
                      name="Address_2"
                      placeholder="อาคาร, ชั้น, ห้อง"
                      className="input input-bordered w-full"
                      value={modalAddressFormData.Address_2 || ''}
                      onChange={handleModalAddressInputChange}
                    />
                  </div>

                  {/* Sub_District */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 text-base-content"><FiMapPin /> แขวง/ตำบล</span>
                    </label>
                    <input
                      type="text"
                      name="Sub_District"
                      placeholder="แขวง/ตำบล"
                      className="input input-bordered w-full"
                      value={modalAddressFormData.Sub_District}
                      onChange={handleModalAddressInputChange}
                      required
                    />
                  </div>

                  {/* District */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 text-base-content"><FiMapPin /> เขต/อำเภอ</span>
                    </label>
                    <input
                      type="text"
                      name="District"
                      placeholder="เขต/อำเภอ"
                      className="input input-bordered w-full"
                      value={modalAddressFormData.District}
                      onChange={handleModalAddressInputChange}
                      required
                    />
                  </div>

                  {/* Province */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 text-base-content"><FiGlobe /> จังหวัด</span>
                    </label>
                    <input
                      type="text"
                      name="Province"
                      placeholder="จังหวัด"
                      className="input input-bordered w-full"
                      value={modalAddressFormData.Province}
                      onChange={handleModalAddressInputChange}
                      required
                    />
                  </div>

                  {/* Zip_Code */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 text-base-content"><FiHash /> รหัสไปรษณีย์</span>
                    </label>
                    <input
                      type="text"
                      name="Zip_Code"
                      placeholder="รหัสไปรษณีย์"
                      className="input input-bordered w-full"
                      value={modalAddressFormData.Zip_Code}
                      onChange={handleModalAddressInputChange}
                      required
                      maxLength={6}
                    />
                  </div>

                  {/* Phone (for this address) */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2 text-base-content"><FiPhone /> เบอร์โทรศัพท์ (สำหรับที่อยู่)</span>
                    </label>
                    <input
                      type="tel"
                      name="Phone"
                      placeholder="08X-XXX-XXXX"
                      className="input input-bordered w-full"
                      value={modalAddressFormData.Phone}
                      onChange={handleModalAddressInputChange}
                      required
                      maxLength={10}
                    />
                  </div>

                  {/* Is_Default Checkbox */}
                  <div className="form-control">
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        name="Is_Default"
                        checked={modalAddressFormData.Is_Default}
                        onChange={handleModalAddressInputChange}
                        className="checkbox checkbox-primary"
                      />
                      <span className="label-text text-base-content">ตั้งเป็นที่อยู่เริ่มต้น</span>
                    </label>
                  </div>

                  <div className="modal-action mt-6">
                    <button type="button" className="btn btn-ghost" onClick={handleCloseAddressModal}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">บันทึก</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}