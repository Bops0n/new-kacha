'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiCheckCircle, FiPlus } from 'react-icons/fi';
import { AddressSchema } from '../../../types/user.types'; // Adjust path
import Link from 'next/link';

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: AddressSchema[];
  currentSelectedAddress: AddressSchema | undefined;
  onSelectAddress: (address: AddressSchema) => void;
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  addresses,
  currentSelectedAddress,
  onSelectAddress,
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
      // Potentially alert user to select an address if none is chosen
      alert('กรุณาเลือกที่อยู่จัดส่ง'); // Use custom alert in real app
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

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2"> {/* Added max-h and overflow for scrollable list */}
            {addresses.length === 0 ? (
              <div className="text-center py-6 text-base-content/70">
                <p>คุณยังไม่มีที่อยู่จัดส่ง กรุณาเพิ่มที่อยู่ใหม่</p>
                <Link href="/profile" className="btn btn-secondary btn-sm mt-4">
                  <FiPlus className="w-4 h-4 mr-2" /> เพิ่มที่อยู่ใหม่
                </Link>
              </div>
            ) : (
              addresses.map(address => (
                <div
                  key={address.Address_ID}
                  className={`card border rounded-lg p-4 cursor-pointer transition-all duration-200
                              ${selectedAddressInternal?.Address_ID === address.Address_ID
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-base-300 bg-base-200 hover:border-primary-focus hover:bg-base-300'}
                             `}
                  onClick={() => handleSelect(address)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                      <FiMapPin className={`w-5 h-5 ${selectedAddressInternal?.Address_ID === address.Address_ID ? 'text-primary' : 'text-base-content/70'}`} />
                      {address.Is_Default && <span className="badge badge-primary text-primary-content">เริ่มต้น</span>}
                    </h3>
                    {selectedAddressInternal?.Address_ID === address.Address_ID && (
                      <FiCheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <p className="text-base-content/90 text-sm mt-2">
                    {address.Address_1} {address.Address_2 && `, ${address.Address_2}`}<br />
                    แขวง/ตำบล {address.Sub_District}, เขต/อำเภอ {address.District}<br />
                    จังหวัด {address.Province}, รหัสไปรษณีย์ {address.Zip_Code}<br />
                    เบอร์โทรศัพท์: {address.Phone}
                  </p>
                </div>
              ))
            )}
          </div>

          {addresses.length > 0 && (
            <div className="modal-action mt-6">
              <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmSelection}>ยืนยันการเลือก</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
