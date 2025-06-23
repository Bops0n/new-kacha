'use client';

import React, { useState } from 'react';
import AlertModal from '../../components/AlertModal'; // Assuming AlertModal is in the same directory
import ConfirmationModal from '../../components/ConfirmationModal'; // Import the new ConfirmationModal
import { AlertModalType } from '../../../types'; // Import AlertModalType if it's external

/**
 * TestPage component to demonstrate the usage of AlertModal and ConfirmationModal.
 * This page includes buttons to trigger different types of alerts and confirmations,
 * and state management to control their visibility and content.
 */
const TestPage: React.FC = () => {
  // State for AlertModal
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<AlertModalType>('info');

  // State for ConfirmationModal
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState('ยืนยันการดำเนินการ');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationType, setConfirmationType] = useState<'info' | 'warning' | 'error'>('info');

  // State to display confirmation result
  const [confirmationResult, setConfirmationResult] = useState<string | null>(null);

  /**
   * Handles opening the Alert Modal with a specific message and type.
   * @param {string} message - The message to display in the alert.
   * @param {AlertModalType} type - The type of alert (info, success, warning, error).
   */
  const handleOpenAlert = (message: string, type: AlertModalType) => {
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertOpen(true);
  };

  /**
   * Handles closing the Alert Modal.
   */
  const handleCloseAlert = () => {
    setIsAlertOpen(false);
  };

  /**
   * Handles opening the Confirmation Modal with a specific message and type.
   * @param {string} message - The message to display in the confirmation.
   * @param {'info' | 'warning' | 'error'} type - The type of confirmation.
   * @param {string} title - The title for the confirmation modal.
   */
  const handleOpenConfirmation = (message: string, type: 'info' | 'warning' | 'error', title?: string) => {
    setConfirmationMessage(message);
    setConfirmationType(type);
    if (title) setConfirmationTitle(title);
    setIsConfirmationOpen(true);
    setConfirmationResult(null); // Clear previous result
  };

  /**
   * Handles confirming the action in the Confirmation Modal.
   */
  const handleConfirm = () => {
    setIsConfirmationOpen(false);
    setConfirmationResult('ยืนยันแล้ว!');
    console.log('Action confirmed!');
    // Add your confirmation logic here
  };

  /**
   * Handles canceling the action in the Confirmation Modal.
   */
  const handleCancel = () => {
    setIsConfirmationOpen(false);
    setConfirmationResult('ยกเลิกแล้ว!');
    console.log('Action cancelled!');
    // Add your cancellation logic here
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">หน้าทดสอบ Modal</h1>

      {/* Alert Modal Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg mb-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">ทดสอบ Alert Modal</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => handleOpenAlert('นี่คือข้อความข้อมูล!', 'info')}
            className="btn btn-info text-white rounded-lg px-6 py-3 shadow-md hover:opacity-80 transition-all duration-300"
          >
            แสดง Alert (ข้อมูล)
          </button>
          <button
            onClick={() => handleOpenAlert('ดำเนินการสำเร็จแล้ว!', 'success')}
            className="btn btn-success text-white rounded-lg px-6 py-3 shadow-md hover:opacity-80 transition-all duration-300"
          >
            แสดง Alert (สำเร็จ)
          </button>
          <button
            onClick={() => handleOpenAlert('โปรดระวังการดำเนินการนี้!', 'warning')}
            className="btn btn-warning text-white rounded-lg px-6 py-3 shadow-md hover:opacity-80 transition-all duration-300"
          >
            แสดง Alert (คำเตือน)
          </button>
          <button
            onClick={() => handleOpenAlert('เกิดข้อผิดพลาดในการโหลดข้อมูล!', 'error')}
            className="btn btn-error text-white rounded-lg px-6 py-3 shadow-md hover:opacity-80 transition-all duration-300"
          >
            แสดง Alert (ข้อผิดพลาด)
          </button>
        </div>
      </div>

      {/* Confirmation Modal Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">ทดสอบ Confirmation Modal</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => handleOpenConfirmation('คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?', 'info', 'การยืนยันข้อมูล')}
            className="btn btn-info text-white rounded-lg px-6 py-3 shadow-md hover:opacity-80 transition-all duration-300"
          >
            ยืนยัน (ข้อมูล)
          </button>
          <button
            onClick={() => handleOpenConfirmation('คุณต้องการลบรายการนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้!', 'warning', 'คำเตือน: ลบข้อมูล')}
            className="btn btn-warning text-white rounded-lg px-6 py-3 shadow-md hover:opacity-80 transition-all duration-300"
          >
            ยืนยัน (คำเตือน)
          </button>
          <button
            onClick={() => handleOpenConfirmation('การกระทำนี้จะส่งผลกระทบอย่างร้ายแรง คุณยืนยันที่จะทำต่อหรือไม่?', 'error', 'อันตราย: ยืนยันการทำลาย')}
            className="btn btn-error text-white rounded-lg px-6 py-3 shadow-md hover:opacity-80 transition-all duration-300"
          >
            ยืนยัน (ข้อผิดพลาด)
          </button>
        </div>
        {confirmationResult && (
          <p className="mt-6 text-lg font-medium text-green-600">
            ผลลัพธ์การยืนยัน: <span className="font-bold">{confirmationResult}</span>
          </p>
        )}
      </div>


      {/* Render Alert Modal */}
      <AlertModal
        isOpen={isAlertOpen}
        message={alertMessage}
        onClose={handleCloseAlert}
        type={alertType}
      />

      {/* Render Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        title={confirmationTitle}
        message={confirmationMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type={confirmationType}
      />
    </div>
  );
};

export default TestPage;
