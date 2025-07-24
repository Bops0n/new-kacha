'use client';

import { createContext, useContext } from 'react';
import { AlertModalType } from '../../types';

// Define the shape of the context value
interface AlertContextType {
  showAlert: (message: string, type?: AlertModalType, title?: string, onConfirm?: () => void) => void;
  hideAlert: () => void;
}
  
  // New function for confirmation dialogs
// Create the context with a default undefined value
const AlertContext = createContext<AlertContextType | undefined>(undefined);

/**
 * Custom hook to consume the AlertContext.
 * This hook provides a convenient way to access showAlert, showConfirm, and hideAlert functions
 * from any component wrapped by the AlertProvider.
 *
 * @returns {AlertContextType} The context value containing showAlert, showConfirm, and hideAlert functions.
 * @throws {Error} If used outside of an AlertProvider.
 */
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;
