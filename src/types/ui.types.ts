// types/ui.types.ts
import React from 'react';
import { OrderStatus } from './order.types'; // Import related type

// Configuration for Order Status display
export interface StatusConfig {
  [key: string]: {
    label: string;
    color: string;
    icon: React.ElementType;
    bgColor: string;
  };
}

// Alert Modal Types
export type AlertModalType = 'info' | 'success' | 'warning' | 'error';

export interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: AlertModalType;
  title?: string;
  onConfirm?: () => void;
}