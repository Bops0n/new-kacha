'use client';

import React from 'react';
import { FiHelpCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi'; // Import necessary icons

/**
 * Props interface for the ConfirmationModal component.
 */
interface ConfirmationModalProps {
  isOpen: boolean; // Controls the visibility of the modal
  title?: string; // Optional title for the confirmation modal
  message: string; // The message to display to the user
  onConfirm: () => void; // Function to call when the "Confirm" button is clicked
  onCancel: () => void; // Function to call when the "Cancel" button is clicked
  type?: 'info' | 'warning' | 'error'; // Optional type for styling (e.g., color, icon)
}

/**
 * A reusable Confirmation Modal component, styled with DaisyUI and Tailwind CSS.
 * This component prompts the user for confirmation with "Confirm" and "Cancel" buttons.
 * It supports different types (info, warning, error) with corresponding icons and button colors.
 *
 * @param {ConfirmationModalProps} props - The props for the ConfirmationModal component.
 * @returns {JSX.Element | null} The ConfirmationModal component, or null if isOpen is false.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title = 'ยืนยันการดำเนินการ', // Default title
  message,
  onConfirm,
  onCancel,
  type = 'info', // Default type
}) => {
  // If the modal is not open, return null to not render anything
  if (!isOpen) {
    return null;
  }

  // Define a mapping for confirmation types to their respective icons, button classes, and icon text colors.
  const confirmationConfig = {
    info: {
      IconComponent: FiHelpCircle, // Info icon for general confirmation
      confirmButtonClass: 'btn-info',
      iconTextColor: 'text-blue-500',
    },
    warning: {
      IconComponent: FiAlertTriangle, // Warning icon for important actions
      confirmButtonClass: 'btn-warning',
      iconTextColor: 'text-yellow-500',
    },
    error: {
      IconComponent: FiXCircle, // Error icon for destructive actions
      confirmButtonClass: 'btn-error',
      iconTextColor: 'text-red-500',
    },
  };

  // Get the configuration for the current confirmation type.
  // Use a fallback to 'info' config if the provided type is invalid or undefined.
  const { IconComponent, confirmButtonClass, iconTextColor } = confirmationConfig[type] || confirmationConfig.info;

  return (
    // DaisyUI modal structure
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`} onClose={onCancel}>
      <div className="modal-box w-full max-w-sm rounded-xl shadow-2xl p-6 md:p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <IconComponent className={`text-5xl mb-4 ${iconTextColor}`} />

        {/* Modal Title */}
        <h3 className="font-bold text-xl text-gray-800 mb-3">{title}</h3>

        {/* Modal Message */}
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="modal-action mt-0 justify-center gap-4">
          <button
            onClick={onConfirm}
            className={`btn ${confirmButtonClass} w-full max-w-[120px] py-3 rounded-lg text-white font-semibold shadow-md transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-75`}
            aria-label="ยืนยัน"
          >
            ยืนยัน
          </button>
          <button
            onClick={onCancel}
            className="btn btn-ghost w-full max-w-[120px] py-3 rounded-lg text-gray-700 font-semibold shadow-md transition-all duration-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-75"
            aria-label="ยกเลิก"
          >
            ยกเลิก
          </button>
        </div>
      </div>
      {/* Optional: Add a hidden button for closing modal with Escape key or click outside */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
};

export default ConfirmationModal;
