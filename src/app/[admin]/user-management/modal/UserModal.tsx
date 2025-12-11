'use client'; // Client Component

import React from 'react';
import {
  FiEdit,
  FiTrash2,
  FiX,
  FiSave,
  FiPlus
} from 'react-icons/fi';
import { AddressSchema, AccessInfo, UserEditForm, UserSchema } from '@/types';

// กำหนด Props สำหรับ UserModal
interface UserModalProps {
  showModal: boolean;
  onClose: () => void;
  selectedUser: UserSchema | null;
  isEditing: boolean;
  toggleEditMode: () => void;
  editFormData: UserEditForm;
  handleUserFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  saveUserDetails: () => void;
  deleteUser: (userId: number) => void;
  getAccessLevelLabel: (accesses: AccessInfo[], level: number) => string;
  handleAddAddressClick: () => void;
  handleEditAddressClick: (address: AddressSchema) => void;
  deleteAddress: (addressId: number, userId: number) => void;
  accesses: AccessInfo[];
}

const UserModal: React.FC<UserModalProps> = ({
  showModal,
  onClose,
  selectedUser,
  isEditing,
  toggleEditMode,
  editFormData,
  handleUserFormChange,
  saveUserDetails,
  deleteUser,
  getAccessLevelLabel,
  handleAddAddressClick,
  handleEditAddressClick,
  deleteAddress,
  accesses
}) => {
  if (!showModal) return null;

  // แทนที่ window.confirm ด้วย Alert Component ของคุณเองใน Production
  const confirmDeleteUser = (userId: number) => {
    // Implement your custom confirmation modal here instead of window.confirm
    // For now, using a placeholder:
    // if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ User ID: ${userId}?`)) {
        deleteUser(userId);
    // }
  };

  const confirmDeleteAddress = (addressId: number, userId: number) => {
    // Implement your custom confirmation modal here instead of window.confirm
    // For now, using a placeholder:
    // if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?')) {
      deleteAddress(addressId, userId);
    // }
  };


  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        <h3 className="font-bold text-lg mb-4">
          {isEditing ? 
            (
              editFormData.User_ID ? 
              `แก้ไขบัญชี ID: ${editFormData.User_ID || ''}` : `เพิ่มบัญชี`
            ) : 
              `รายละเอียดบัญชี ID: ${selectedUser?.User_ID || ''}`
          }
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Information Form / Display */}
          <div>
            <h4 className="font-semibold mb-2">ข้อมูลบัญชีผู้ใช้</h4>
            <div className="bg-base-200 rounded-lg p-4">
              {isEditing ? (
                <>
                  <div className="form-control mb-2">
                    <label className="label"><span className="label-text">ชื่อผู้ใช้</span></label>
                    <input type="text" name="Username" className="input input-bordered w-full" value={editFormData.Username} onChange={handleUserFormChange} />
                  </div>
                  <div className="form-control mb-2">
                    <label className="label"><span className="label-text">รหัสผ่าน (จะถูกเปลี่ยนหากแก้ไข)</span></label>
                    <input type="password" name="Password" className="input input-bordered w-full" value={editFormData.Password} onChange={handleUserFormChange} />
                  </div>
                  <div className="form-control mb-2">
                    <label className="label"><span className="label-text">ชื่อเต็ม</span></label>
                    <input type="text" name="Full_Name" className="input input-bordered w-full" value={editFormData.Full_Name} onChange={handleUserFormChange} />
                  </div>
                  <div className="form-control mb-2">
                    <label className="label"><span className="label-text">อีเมล</span></label>
                    <input type="email" name="Email" className="input input-bordered w-full" value={editFormData.Email || ''} onChange={handleUserFormChange} />
                  </div>
                  <div className="form-control mb-2">
                    <label className="label"><span className="label-text">เบอร์โทร</span></label>
                    <input type="tel" name="Phone" className="input input-bordered w-full" value={editFormData.Phone || ''} onChange={handleUserFormChange} />
                  </div>
                  <div className="form-control mb-2">
                    <label className="label"><span className="label-text">ระดับการเข้าถึง</span></label>
                    <select name="Access_Level" className="select select-bordered w-full" value={editFormData.Access_Level} onChange={handleUserFormChange}>
                      {accesses.map((access : AccessInfo) => (
                        <option key={access.Level} value={access.Level}>{access.Name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                selectedUser && (
                  <>
                    <p><strong>User ID:</strong> {selectedUser.User_ID}</p><br/>
                    <p><strong>ชื่อผู้ใช้:</strong> {selectedUser.Username}</p><br/>
                    <p><strong>ชื่อเต็ม:</strong> {selectedUser.Full_Name}</p><br/>
                    <p><strong>อีเมล:</strong> {selectedUser.Email || '-'}</p><br/>
                    <p><strong>เบอร์โทร:</strong> {selectedUser.Phone || '-'}</p><br/>
                    <p><strong>ระดับการเข้าถึง:</strong> {getAccessLevelLabel(accesses, selectedUser.Access_Level)}</p>
                  </>
                )
              )}
            </div>
          </div>

          {/* User Addresses */}
          <div>
            <h4 className="font-semibold mb-2 flex justify-between items-center">
              ที่อยู่
              {isEditing && editFormData.User_ID && (
                <button className="btn btn-sm btn-primary" onClick={handleAddAddressClick}>
                  <FiPlus className="w-4 h-4" /> เพิ่มที่อยู่
                </button>
              )}
            </h4>
            <div className="bg-base-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              {editFormData.Addresses.length > 0 ? (
                <div className="space-y-4">
                  {editFormData.Addresses.map((address) => (
                    <div key={`${address.User_ID}-${address.Address_ID}`} className="border border-base-300 rounded-lg p-3 relative">
                      {address.Is_Default && (
                        <span className="badge badge-info absolute top-2 right-2">ค่าเริ่มต้น</span>
                      )}
                      <p className="text-sm font-semibold">{address.Address_1} {address.Address_2}</p>
                      <p className="text-xs text-base-content/80">{address.Sub_District}, {address.District}, {address.Province}, {address.Zip_Code}</p>
                      <p className="text-xs text-base-content/80">โทร: {address.Phone}</p>
                      {isEditing && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs btn-square"
                            onClick={() => handleEditAddressClick(address)}
                            title="แก้ไขที่อยู่"
                          >
                            <FiEdit className="w-3 h-3" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square text-error"
                            onClick={() => {
                              if (address.Address_ID !== null) {
                                confirmDeleteAddress(address.Address_ID, address.User_ID)}}
                              }
                            title="ลบที่อยู่"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-base-content/70 py-4">ยังไม่มีที่อยู่</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-action flex-col sm:flex-row mt-6">
          {isEditing ? (
            <>
              <button className="btn btn-ghost w-full sm:w-auto" onClick={editFormData.User_ID ? toggleEditMode : onClose}>
                <FiX className="w-4 h-4" /> ยกเลิก
              </button>
              <button className="btn btn-primary w-full sm:w-auto" onClick={saveUserDetails}>
                <FiSave className="w-4 h-4" /> บันทึก
              </button>
            </>
          ) : (
            <>
              <button className="btn w-full sm:w-auto" onClick={onClose}>
                <FiX className="w-4 h-4" /> ปิด
              </button>
              {selectedUser && (
                <button className="btn btn-primary w-full sm:w-auto" onClick={toggleEditMode}>
                  <FiEdit className="w-4 h-4" /> แก้ไข
                </button>
              )}
              {selectedUser && ( // Add delete button for existing user
                 <button className="btn btn-error w-full sm:w-auto" onClick={() => confirmDeleteUser(selectedUser.User_ID)}>
                    <FiTrash2 className="w-4 h-4" /> ลบผู้ใช้
                 </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserModal;
