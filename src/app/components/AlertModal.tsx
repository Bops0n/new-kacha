'use client';

import React from 'react';
import { AlertModalProps, AlertModalType } from '@/types';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiXCircle, FiImage } from 'react-icons/fi';

/**
 * A reusable Alert Modal component, styled with DaisyUI and Tailwind CSS.
 * This component displays a message to the user with an "OK" button to dismiss it.
 * It supports different alert types (info, success, warning, error) with corresponding icons and button colors.
 *
 * @param {AlertModalProps} props - The props for the AlertModal component.
 * @returns {JSX.Element | null} The AlertModal component, or null if isOpen is false.
 */
const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, onClose, type = 'info' , title, onConfirm }) => {
  // If the modal is not open, return null to not render anything
  if (!isOpen) {
    return null;
  }

  // Define a mapping for alert types to their respective icons, button classes, and icon text colors.
  // This replaces the lengthy switch statement, making the code more concise.
  const alertConfig = {
    info: {
      IconComponent: FiInfo, // Reverted to IconComponent 
      buttonClass: 'btn-info',
      iconTextColor: 'text-blue-500', // Tailwind CSS class for icon color
    },
    success: {
      IconComponent: FiCheckCircle, // Reverted to IconComponent
      buttonClass: 'btn-success',
      iconTextColor: 'text-green-500', // Tailwind CSS class for icon color
    },
    warning: {
      IconComponent: FiAlertTriangle, // Reverted to IconComponent
      buttonClass: 'btn-warning',
      iconTextColor: 'text-yellow-500', // Tailwind CSS class for icon color
    },
    error: {
      IconComponent: FiXCircle, // Reverted to IconComponent
      buttonClass: 'btn-error',
      iconTextColor: 'text-red-500', // Tailwind CSS class for icon color
    },
  };

  // Get the configuration for the current alert type.
  // Use a fallback to 'info' config if the provided type is invalid or undefined.
  const { IconComponent, buttonClass, iconTextColor } = alertConfig[type] || alertConfig.info; // Reverted to IconComponent

  return (
    // DaisyUI modal structure
    // `modal` makes it a modal, `modal-open` forces it to be visible
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`} onClose={onClose}>
      <div className="modal-box w-full max-w-sm rounded-xl shadow-2xl p-6 md:p-8 flex flex-col items-center text-center">
        {/* Title */}
        <h1 className='text-2xl mb-4'>{title || 'แจ้งเตือน'}</h1>
        {/* Icon */}
        <IconComponent className={`text-5xl mb-4 ${iconTextColor}`} /> {/* Reverted to IconComponent */}

        {/* Modal Message */}
        <p className="text-lg text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        {/* Action Button */}
        <div className="modal-action mt-0 justify-center"> {/* modal-action usually flex-end, override to center */}
          {onConfirm &&
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`btn ${buttonClass} w-full max-w-[150px] py-3 rounded-lg text-white font-semibold shadow-md transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-75`}
            aria-label="ปิดการแจ้งเตือน"
          >
            ยืนยัน
          </button>}
          
          <button
            onClick={() => {
              onClose();
            }}
            className={`btn bg-gray-300 w-full max-w-[150px] py-3 rounded-lg text-black font-semibold shadow-md transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-75`}
            aria-label="ปิดการแจ้งเตือน"
          >
            ปิด
          </button>
         
        </div>
      </div>
      {/* Optional: Add a hidden button for closing modal with Escape key or click outside */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default AlertModal;
