import Image from "next/image";
import { FiX } from "react-icons/fi";

export const ImagePreviewModal = ({ imageUrl, onClose }: { imageUrl: string | null, onClose: () => void }) => {
    if (!imageUrl) return null;
    return (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={onClose}>
            <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
                <button className="absolute top-4 right-4 btn btn-circle btn-ghost text-white bg-black/20 hover:bg-red-500 z-20" onClick={onClose}>
                    <FiX className="w-8 h-8" />
                </button>
                <Image 
                    src={imageUrl} 
                    alt="Preview" 
                    width={512}
                    height={512}
                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        </div>
    );
};