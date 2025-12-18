import React from 'react';
import { OrderStatus, Payment_Type, ShippingMethodType } from './order.types';

export type AlertModalType = 'info' | 'success' | 'warning' | 'error';
export type ModalMode = 'view' | 'edit' | 'add';

export interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: AlertModalType;
  title?: string;
  onConfirm?: () => void;
}


export interface AccessLeveLConfigItem {
  bgColor: string;
  textColor: string;
}

export type AccessLeveLConfig = Record<number, AccessLeveLConfigItem>;

export interface StatusConfigItem {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
}

export type StatusConfig = Record<OrderStatus, StatusConfigItem>;

export interface PaymentConfigItem {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
}

export type PaymentConfig = Record<Payment_Type, PaymentConfigItem>;

export interface ShippingMethodItem {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
}

export type ShippingMethodConfig = Record<ShippingMethodType, ShippingMethodItem>;