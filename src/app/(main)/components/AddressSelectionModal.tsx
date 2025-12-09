'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiCheckCircle, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi'; // [NEW] เพิ่มไอคอน
import { AddressSchema } from '../../../types/user.types'; // ตรวจสอบ path ให้ถูกต้อง
import Link from 'next/link';

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: AddressSchema[];
  currentSelectedAddress: AddressSchema | undefined;
  onSelectAddress: (address: AddressSchema) => void;
  // [NEW] เพิ่ม Props สำหรับจัดการแก้ไขและลบ
  onEditAddress: (address: AddressSchema) => void;
  onDeleteAddress: (addressId: number) => void;
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  addresses,
  currentSelectedAddress,
  onSelectAddress,
  onEditAddress,   // [NEW] รับค่า
  onDeleteAddress, // [NEW] รับค่า
}: AddressSelectionModalProps) {
  const [selectedAddressInternal, setSelectedAddressInternal] = useState<AddressSchema | undefined>(currentSelectedAddress);

  useEffect(() => {
    setSelectedAddressInternal(currentSelectedAddress);
  }, [currentSelectedAddress]);

  const handleSelect = (address: AddressSchema) => {
    setSelectedAddressInternal(address);
  };

  const handleConfirmSelection = () => {
    if (selectedAddressInternal) {
      onSelectAddress(selectedAddressInternal);
      onClose();
    } else {
      alert('กรุณาเลือกที่อยู่จัดส่ง');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="modal-box w-full max-w-2xl bg-base-100 rounded-lg shadow-xl p-0">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-base-content text-center mb-6">เลือกที่อยู่จัดส่ง</h2>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {addresses.length === 0 ? (
              <div className="text-center py-6 text-base-content/70">
                <p>คุณยังไม่มีที่อยู่จัดส่ง กรุณาเพิ่มที่อยู่ใหม่</p>
                {/* ปุ่มนี้อาจจะเปลี่ยนไปเรียก Modal เพิ่มที่อยู่แทน Link ได้ถ้าต้องการ */}
                <button 
                    className="btn btn-secondary btn-sm mt-4"
                    onClick={() => {
                        // ถ้าอยากให้ปุ่มนี้เปิด Modal เพิ่มที่อยู่ ให้เรียก prop function แทน Link
                        // แต่ถ้าใช้ Link ก็จะเป็นการเปลี่ยนหน้า
                    }}
                >
                  <FiPlus className="w-4 h-4 mr-2" /> เพิ่มที่อยู่ใหม่
                </button>
              </div>
            ) : (
              addresses.map(address => (
                <div
                  key={address.Address_ID}
                  className={`card border rounded-lg p-4 cursor-pointer transition-all duration-200 group
                             ${selectedAddressInternal?.Address_ID === address.Address_ID
                               ? 'border-primary bg-primary/5 shadow-md'
                               : 'border-base-300 bg-base-100 hover:border-primary-focus hover:bg-base-50'}
                            `}
                  onClick={() => handleSelect(address)}
                >
                  {/* Header & Content */}
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                      <FiMapPin className={`w-5 h-5 ${selectedAddressInternal?.Address_ID === address.Address_ID ? 'text-primary' : 'text-base-content/70'}`} />
                      {address.Is_Default && <span className="badge badge-primary badge-sm text-primary-content">เริ่มต้น</span>}
                    </h3>
                    {selectedAddressInternal?.Address_ID === address.Address_ID && (
                      <FiCheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  <p className="text-base-content/90 text-sm mt-2 pl-7">
                    {address.Address_1} {address.Address_2 && `, ${address.Address_2}`}<br />
                    แขวง/ตำบล {address.Sub_District}, เขต/อำเภอ {address.District}<br />
                    จังหวัด {address.Province}, รหัสไปรษณีย์ {address.Zip_Code}<br />
                    <span className="text-base-content/70 text-xs mt-1 block">เบอร์โทรศัพท์: {address.Phone}</span>
                  </p>

                  {/* [NEW] Action Buttons Row */}
                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-base-content/10">
                    <button 
                        className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 z-20"
                        onClick={(e) => {
                            e.stopPropagation(); // หยุดไม่ให้คลิกทะลุไปเลือกการ์ด
                            onEditAddress(address);
                        }}
                    >
                        <FiEdit /> แก้ไข
                    </button>
                    <button 
                        className="btn btn-xs btn-ghost text-error hover:bg-error/10 z-20"
                        onClick={(e) => {
                            e.stopPropagation(); // หยุดไม่ให้คลิกทะลุไปเลือกการ์ด
                            if(address.Address_ID) onDeleteAddress(address.Address_ID);
                        }}
                    >
                        <FiTrash2 /> ลบ
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

          <div className="modal-action mt-6 flex justify-between items-center">
             {/* [Optional] ปุ่มเพิ่มที่อยู่ใหม่อยู่ตรง Footer ด้วยก็ได้ */}
             <div>
                 {/* พื้นที่ว่าง หรือใส่ปุ่มเพิ่มที่อยู่ตรงนี้ */}
             </div>
             <div className="flex gap-2">
                <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
                <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleConfirmSelection}
                    disabled={!selectedAddressInternal}
                >
                    ยืนยันการเลือก
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}