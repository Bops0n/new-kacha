'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiEdit, FiSave, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiGlobe, FiHash, FiHome, FiPlus, FiTrash2, FiStar } from 'react-icons/fi';

// Import types
import { UserSchema, AddressSchema, UserProfilePageData } from '../../types'; // Adjust path as needed

// Mock Data representing a user and their addresses from the database
const mockUser: UserSchema = {
  User_ID: 101,
  Username: 'somchai.k',
  // Password: 'hashedpassword', // Never include password here
  Full_Name: 'สมชาย คชาโฮม',
  Email: 'somchai.k@example.com',
  Phone: '0812345678', // Phone from User table
  Access_Level: '0',
  // Token: 'dummy_token_abc123', // Never include token here
};

const mockAddresses: AddressSchema[] = [
  {
    Address_ID: 1,
    User_ID: 101,
    Address_1: '123 ถนนสุขุมวิท ซอย 55',
    Address_2: 'ตึกคชาโฮม ชั้น 10',
    Sub_District: 'คลองตันเหนือ',
    District: 'วัฒนา',
    Province: 'กรุงเทพมหานคร',
    Zip_Code: '10110',
    Is_Default: true,
    Phone: '0987654321', // Phone specific to this address
  },
  {
    Address_ID: 2,
    User_ID: 101,
    Address_1: '456 ถนนพหลโยธิน',
    Address_2: 'อาคาร ABC',
    Sub_District: 'สามเสนใน',
    District: 'พญาไท',
    Province: 'กรุงเทพมหานคร',
    Zip_Code: '10400',
    Is_Default: false,
    Phone: '0612345678',
  },
  {
    Address_ID: 3,
    User_ID: 101,
    Address_1: '789 ถนนลาดพร้าว',
    Address_2: 'บ้านเดี่ยว',
    Sub_District: 'ลาดพร้าว',
    District: 'ลาดพร้าว',
    Province: 'กรุงเทพมหานคร',
    Zip_Code: '10230',
    Is_Default: false,
    Phone: '0887776666',
  },
];

// Initial profile data for the page (combined for simplicity)
const initialUserProfileData: UserProfilePageData = {
    user: mockUser,
    addresses: mockAddresses
};

export default function ProfilePage() {
  const [isEditingUserProfile, setIsEditingUserProfile] = useState(false); // State for user general info editing
  const [userProfile, setUserProfile] = useState<UserSchema>(initialUserProfileData.user);
  const [userAddresses, setUserAddresses] = useState<AddressSchema[]>(initialUserProfileData.addresses);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressSchema | null>(null); // For add/edit in modal

  // State for the modal's form data (for adding/editing addresses)
  const [modalAddressFormData, setModalAddressFormData] = useState<AddressSchema>({
    Address_ID: 0,
    User_ID: userProfile.User_ID, // Use the actual user's ID from state
    Address_1: '',
    Address_2: '',
    Sub_District: '',
    District: '',
    Province: '',
    Zip_Code: '',
    Is_Default: false,
    Phone: '',
  });

  // Effect to load initial data (mocked for now, but would be fetched from API)
  useEffect(() => {
    setUserProfile(mockUser);
    setUserAddresses(mockAddresses);
  }, []);

  // Effect to reset modal form data when modal opens or editingAddress changes
  useEffect(() => {
    if (showAddressModal) {
      if (editingAddress) {
        setModalAddressFormData(editingAddress);
      } else {
        setModalAddressFormData({
          Address_ID: 0,
          User_ID: userProfile.User_ID,
          Address_1: '',
          Address_2: '',
          Sub_District: '',
          District: '',
          Province: '',
          Zip_Code: '',
          Is_Default: false,
          Phone: '',
        });
      }
    }
  }, [showAddressModal, editingAddress, userProfile.User_ID]); // Add userProfile.User_ID to dependencies

  // --- User Profile (General Info) Handlers ---
  const handleUserProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserProfile(prevData => ({
      ...prevData,
      [name as keyof UserSchema]: value,
    }));
  };

  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving user profile:', userProfile);
    // Simulate API call to update user table
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      alert('บันทึกข้อมูลส่วนตัวสำเร็จ!');
      setIsEditingUserProfile(false);
      // In real app: refresh data or update global user state
    } catch (error) {
      console.error('Failed to save user profile:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนตัว');
    }
  };

  const handleCancelUserProfileEdit = () => {
    setUserProfile(mockUser); // Revert to original mock data
    setIsEditingUserProfile(false);
  };

  // --- Address Modal Form Handlers (now inside ProfilePage) ---
  const handleModalAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setModalAddressFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOrUpdatedAddress = modalAddressFormData;

    // Basic validation
    if (!newOrUpdatedAddress.Address_1 || !newOrUpdatedAddress.Sub_District || !newOrUpdatedAddress.District || !newOrUpdatedAddress.Province || !newOrUpdatedAddress.Zip_Code || !newOrUpdatedAddress.Phone) {
      alert('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน');
      return;
    }

    if (editingAddress) {
      // Update existing address
      setUserAddresses(prevAddresses =>
        prevAddresses.map(addr =>
          addr.Address_ID === newOrUpdatedAddress.Address_ID ? newOrUpdatedAddress : addr
        ).map(addr => ({ // Ensure only one default address
            ...addr,
            Is_Default: newOrUpdatedAddress.Is_Default && addr.Address_ID !== newOrUpdatedAddress.Address_ID ? false : addr.Is_Default
        }))
      );
      console.log('Updating address:', newOrUpdatedAddress);
      alert('แก้ไขที่อยู่สำเร็จ!');
      // In real app: call API to update address
    } else {
      // Add new address
      const newAddressId = Math.max(...userAddresses.map(a => a.Address_ID || 0), 0) + 1; // Generate new ID for mock, handling case of no addresses
      const addressToAdd = { ...newOrUpdatedAddress, Address_ID: newAddressId, User_ID: userProfile.User_ID };

      setUserAddresses(prevAddresses => {
        const updatedAddresses = [...prevAddresses];
        if (addressToAdd.Is_Default) {
            // If new address is default, set all others to false
            return [...updatedAddresses.map(addr => ({ ...addr, Is_Default: false })), addressToAdd];
        } else {
            return [...updatedAddresses, addressToAdd];
        }
      });
      console.log('Adding new address:', addressToAdd);
      alert('เพิ่มที่อยู่สำเร็จ!');
      // In real app: call API to add address
    }

    // After saving, ensure correct default status across all addresses
    setUserAddresses(prev => {
        if (newOrUpdatedAddress.Is_Default) {
            return prev.map(addr => ({
                ...addr,
                Is_Default: addr.Address_ID === newOrUpdatedAddress.Address_ID // Only the saved/new address is default
            }));
        } else {
            // If the saved address is not default, and if there's no other default,
            // make sure *some* address is default if any exist.
            const hasDefault = prev.some(addr => addr.Is_Default);
            if (!hasDefault && prev.length > 0) {
                const newPrev = [...prev];
                newPrev[0] = { ...newPrev[0], Is_Default: true }; // Set first as default
                return newPrev;
            }
        }
        return prev;
    });

    setShowAddressModal(false);
    setEditingAddress(null);
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
    // DaisyUI modal confirmation (or custom component for better UX)
    const confirmation = window.confirm('คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?');
    if (!confirmation) {
        return;
    }

    console.log('Deleting address with ID:', addressId);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

      setUserAddresses(prevAddresses => {
        const updatedAddresses = prevAddresses.filter(addr => addr.Address_ID !== addressId);
        // If the deleted address was the default, and there are other addresses, set a new default
        if (prevAddresses.find(addr => addr.Address_ID === addressId)?.Is_Default && updatedAddresses.length > 0) {
            updatedAddresses[0] = { ...updatedAddresses[0], Is_Default: true };
        }
        return updatedAddresses;
      });
      alert('ลบที่อยู่สำเร็จ!');
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('เกิดข้อผิดพลาดในการลบที่อยู่');
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    console.log('Setting default address to ID:', addressId);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      setUserAddresses(prevAddresses =>
        prevAddresses.map(addr => ({
          ...addr,
          Is_Default: addr.Address_ID === addressId,
        }))
      );
      alert('ตั้งที่อยู่เริ่มต้นสำเร็จ!');
    } catch (error) {
      console.error('Failed to set default address:', error);
      alert('เกิดข้อผิดพลาดในการตั้งที่อยู่เริ่มต้น');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-base-100 rounded-lg shadow-xl p-8 flex flex-col lg:flex-row gap-8"> {/* Adjusted flex classes */}
        {/* User Profile Section */}
        <div className="flex-1 pb-8 border-b border-base-300 lg:pb-0 lg:border-b-0 lg:pr-8 lg:border-r"> {/* Adjusted borders and padding */}
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

          <form onSubmit={handleSaveUserProfile} className="space-y-4"> {/* Adjusted spacing */}
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
        <div className="flex-1 pt-8 lg:pt-0 lg:pl-8"> {/* Adjusted padding */}
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
                      <FiMapPin className="w-5 h-5 text-primary" />
                      ที่อยู่ {address.Is_Default && <span className="badge badge-primary text-primary-content">เริ่มต้น</span>}
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
