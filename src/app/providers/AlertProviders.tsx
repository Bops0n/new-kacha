'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import AlertContext from '../context/AlertModalContext';
import AlertModal from '../components/AlertModal';
import { AlertModalType } from '../../types/types';

interface AlertProviderProps {
  children: ReactNode;
}

/**
 * AlertProvider component manages the state and provides the AlertModal globally.
 * It wraps its children, allowing any descendant component to trigger alerts
 * using the useAlert custom hook.
 *
 * @param {AlertProviderProps} { children } - The child components to be rendered within the provider's scope.
 * @returns {JSX.Element} The AlertProvider component wrapping its children and the AlertModal.
 */
const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertModalType>('info');
  const [title, setTitle] = useState<string | undefined>(undefined); // New state for title
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | undefined>(undefined); // New state for onConfirm callback

  /**
   * Function to show a simple alert modal.
   * @param {string} msg - The message to display in the alert.
   * @param {AlertModalType} alertType - The type of alert (info, success, warning, error).
   * @param {string} [alertTitle] - Optional title for the alert.
   */
  const showAlert = useCallback((msg: string, alertType: AlertModalType = 'info', alertTitle?: string, confirmCallback?: () => void) => {
    setMessage(msg);
    setType(alertType);
    setTitle(alertTitle); // Set title
    setOnConfirmCallback(() => confirmCallback); // Ensure no confirm callback for simple alerts
    setIsOpen(true);
  }, []);

  /**
   * Function to show a confirmation modal.
   * @param {string} msg - The message to display in the confirmation.
   * @param {() => void} confirmCallback - The function to call when 'Confirm' is clicked.
   * @param {AlertModalType} alertType - The type of confirmation (e.g., 'warning' for delete).
   * @param {string} [alertTitle] - Optional title for the confirmation.
   */
  // const showConfirm = useCallback((
  //   msg: string,
  //   confirmCallback: () => void,
  //   alertType: AlertModalType = 'warning', // Default to warning for confirmations
  //   alertTitle?: string
  // ) => {
  //   setMessage(msg);
  //   setType(alertType);
  //   setTitle(alertTitle || 'ยืนยันการดำเนินการ'); // Default title for confirm
  //   setOnConfirmCallback(() => confirmCallback); // Set the confirm callback
  //   setIsOpen(true);
  // }, []);


  /**
   * Function to hide the alert modal.
   */
  const hideAlert = useCallback(() => {
    setIsOpen(false);
    setMessage(''); // Clear message after closing
    setType('info'); // Reset type to default
    setTitle(undefined); // Clear title
    setOnConfirmCallback(undefined); // Clear callback
  }, []);

  // The value provided to the context
  const contextValue = React.useMemo(() => ({
    showAlert, // Include the new showConfirm function
    hideAlert,
  }), [showAlert, hideAlert]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {/* The AlertModal is rendered here, controlled by the provider's state */}
      <AlertModal
        isOpen={isOpen}
        message={message}
        onClose={hideAlert}
        type={type}
        title={title} // Pass title to AlertModal
        onConfirm={onConfirmCallback} // Pass the stored callback to AlertModal
      />
    </AlertContext.Provider>
  );
};

export default AlertProvider;
