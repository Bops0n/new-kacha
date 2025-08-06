'use client'; // Client Component

import React, { useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { Address, NewAddressForm } from '../../../types'; // ต้องปรับ Path ให้ถูกต้องตามโครงสร้างโปรเจกต์ของคุณ
import { AlertModalProps } from '@/types/types';

// กำหนด Props สำหรับ AddressModal
interface AddressModalProps {
  showModal: boolean;
  onClose: () => void;
  addressToEdit: Address | null;
  newAddressForm: NewAddressForm;
  handleAddressFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  saveAddress: () => void;
}


const AddressModal: React.FC<AddressModalProps> = ({
  showModal,
  onClose,
  addressToEdit,
  newAddressForm,
  handleAddressFormChange,
  saveAddress,
}) => {
  if (!showModal) return null;

  // แทนที่ alert ด้วย Alert Component ของคุณเองใน Production
  const showAlert = (message: string) => {
    // Implement your custom alert modal here instead of window.alert
    // For now, using a placeholder:
    // alert(message);
  };

  const handleSave = () => {
    if (!newAddressForm.Address_1 || !newAddressForm.District || !newAddressForm.Province || !newAddressForm.Zip_Code || !newAddressForm.Sub_District || !newAddressForm.Phone) {
      showAlert('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน');
      return;
    }
    saveAddress();
  };

  const [alert, setAlert] = useState<AlertModalProps>({
    isOpen: false,
    message: '',
    type: 'success',
    onClose: () => {
      setAlert({ ...alert, isOpen: false });
  }})


  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-md">
        <h3 className="font-bold text-lg mb-4">
          {addressToEdit ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
        </h3>
        <div className="form-control mb-2">
          <label className="label"><span className="label-text">ที่อยู่ 1</span></label>
          <input type="text" name="Address_1" className="input input-bordered w-full" value={newAddressForm.Address_1} onChange={handleAddressFormChange} />
        </div>
        <div className="form-control mb-2">
          <label className="label"><span className="label-text">ที่อยู่ 2 (ไม่บังคับ)</span></label>
          <input type="text" name="Address_2" className="input input-bordered w-full" value={newAddressForm.Address_2 || ''} onChange={handleAddressFormChange} />
        </div>
        <div className="form-control mb-2">
          <label className="label"><span className="label-text">แขวง/ตำบล</span></label>
          <input type="text" name="Sub_District" className="input input-bordered w-full" value={newAddressForm.Sub_District} onChange={handleAddressFormChange} />
        </div>
        <div className="form-control mb-2">
          <label className="label"><span className="label-text">เขต/อำเภอ</span></label>
          <input type="text" name="District" className="input input-bordered w-full" value={newAddressForm.District} onChange={handleAddressFormChange} />
        </div>
        <div className="form-control mb-2">
          <label className="label"><span className="label-text">จังหวัด</span></label>
          <input type="text" name="Province" className="input input-bordered w-full" value={newAddressForm.Province} onChange={handleAddressFormChange} />
        </div>
        <div className="form-control mb-2">
          <label className="label"><span className="label-text">รหัสไปรษณีย์</span></label>
          <input type="text" name="Zip_Code" className="input input-bordered w-full" value={newAddressForm.Zip_Code} onChange={handleAddressFormChange} maxLength={6} />
        </div>
        <div className="form-control mb-2">
          <label className="label"><span className="label-text">เบอร์โทรศัพท์ (สำหรับที่อยู่นี้)</span></label>
          <input type="tel" name="Phone" className="input input-bordered w-full" value={newAddressForm.Phone} onChange={handleAddressFormChange} maxLength={10} />
        </div>
        <div className="form-control mt-4">
          <label className="label cursor-pointer">
            <span className="label-text">ตั้งเป็นที่อยู่เริ่มต้น</span>
            <input type="checkbox" name="Is_Default" className="checkbox" checked={newAddressForm.Is_Default} onChange={handleAddressFormChange} />
          </label>
        </div>

        <div className="modal-action flex-col sm:flex-row mt-6">
          <button className="btn btn-ghost w-full sm:w-auto" onClick={onClose}>
            <FiX className="w-4 h-4" /> ยกเลิก
          </button>
          <button className="btn btn-primary w-full sm:w-auto" onClick={handleSave}>
            <FiSave className="w-4 h-4" /> {addressToEdit ? 'บันทึกที่อยู่' : 'เพิ่มที่อยู่'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
