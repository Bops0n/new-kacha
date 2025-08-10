// types/ui.types.ts
import React from 'react';
import { OrderStatus } from './order.types';

// --- UI Component Props ---

// Props สำหรับ AlertModal
export type AlertModalType = 'info' | 'success' | 'warning' | 'error';

export interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: AlertModalType;
  title?: string;
  onConfirm?: () => void;
}

// +++ START: เพิ่ม Type ใหม่สำหรับ Modal Mode +++
/**
 * กำหนดสถานะที่เป็นไปได้สำหรับ Modal ที่มีการดู, แก้ไข, หรือเพิ่มข้อมูล
 */
export type ModalMode = 'view' | 'edit' | 'add';
// +++ END: เพิ่ม Type ใหม่สำหรับ Modal Mode +++


// --- UI Configuration Objects ---

// Config สำหรับการแสดงผลสถานะ Order
export interface StatusConfig {
  [key: string]: {
    label: string;
    color: string; // Tailwind/DaisyUI color class
    icon: React.ElementType;
    bgColor: string;
  };
}

export interface CategoryFormData {
  id: number | null;
  name: string;
  type: 'main' | 'sub' | 'child';
  // State สำหรับจัดการ Dropdown
  selectedMainCategory: number | null;
  selectedSubCategory: number | null;
}