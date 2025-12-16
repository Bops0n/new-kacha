'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModalMode, ProductFormData } from '@/types';
import { useCategoryData } from '../useCategoryData';
import { useAlert } from '@/app/context/AlertModalContext';

interface UseProductModalProps {
  onSave: (productData: ProductFormData) => Promise<boolean>;
}

export function useProductModal({ onSave }: UseProductModalProps) {
  const { showAlert } = useAlert();
  const { childSubCategories } = useCategoryData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [selectedProduct, setSelectedProduct] = useState<ProductFormData | null>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      const initialFormState = selectedProduct || { Visibility: true, Unit: 'ชิ้น', Quantity: 0, Sale_Cost: 0, Sale_Price: 0, Discount_Price: null, Reorder_Point: 0 };
      setFormData({...initialFormState,
        Selected_Category_ID : selectedProduct?.Child_ID ? childSubCategories.find(sub => sub.Child_ID === selectedProduct.Child_ID)?.Category_ID : null,
        Selected_Sub_Category_ID : selectedProduct?.Child_ID ? childSubCategories.find(sub => sub.Child_ID === selectedProduct.Child_ID)?.Sub_Category_ID : null,
      });
      setImageFile(null);
    }
  }, [selectedProduct, isModalOpen, childSubCategories]);


  const openModal = useCallback((product: ProductFormData | null, mode: ModalMode) => {
    setSelectedProduct({
        ...product,
        Selected_Category_ID : product?.Child_ID ? childSubCategories.find(sub => sub.Child_ID === product.Child_ID)?.Category_ID : null,
        Selected_Sub_Category_ID : product?.Child_ID ? childSubCategories.find(sub => sub.Child_ID === product.Child_ID)?.Sub_Category_ID : null,
    });
    setModalMode(mode);
    setIsModalOpen(true);
  }, [childSubCategories]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleToggleEditMode = useCallback(() => {
    if (modalMode === 'view') {
      setModalMode('edit');
    }
  }, [modalMode]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    let finalValue: string | number | boolean | null = value;

    if (type === 'checkbox') finalValue = checked;
    else if (type === 'number' || e.target.tagName === 'SELECT') finalValue = value === '' ? null : Number(value);

    if (name === 'Selected_Category_ID') { 
        setFormData(prev => ({...prev, Selected_Sub_Category_ID : null, Child_ID : null }))
        // return
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const finalFormData = { ...formData };

    if (imageFile) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        const response = await fetch('/api/admin/products/upload', { method: 'POST', body: uploadFormData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Image upload failed');
        finalFormData.Image_URL = result.imageUrl;
      } catch {
        showAlert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'error');
        setIsUploading(false);
        return;
      }
    }
    
    const success = await onSave(finalFormData);
    setIsUploading(false);
    if (success) {
      closeModal();
    }
  }, [formData, imageFile, onSave, closeModal, showAlert]);

  const imagePreviewUrl = imageFile 
    ? URL.createObjectURL(imageFile) 
    : formData.Image_URL || 'https://placehold.co/300x200?text=Image';

  return {
    openModal,
    modalProps: {
      isOpen: isModalOpen,
      onClose: closeModal,
      product: selectedProduct,
      isEditing: modalMode !== 'view',
      onToggleEditMode: handleToggleEditMode,
      handleSubmit,
      formData,
      handleFormChange,
      imageFile,
      handleImageChange,
      isUploading,
      imagePreviewUrl,
    }
  };
}