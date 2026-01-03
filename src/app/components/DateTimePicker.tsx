import { SetStateAction, useRef } from "react";
import { BiCalendar } from "react-icons/bi";

export const DateTimePicker = ({ value, min, onChange, className = "", readOnly, disabled, formatDisplay} : { value: string, min?: string, onChange: (setStateAction: SetStateAction<string>) => void, className:string, readOnly?: boolean, disabled?: boolean, formatDisplay: (isoDate: string) => string} ) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); 
    
    if (inputRef.current) {
        try {
            inputRef.current.showPicker(); 
        } catch (error) {
            inputRef.current.click();
        }
    }
  };

  return (
    <div 
        className={`relative flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors w-fit select-none group min-w-[140px] ${className}`}
        onClick={openDatePicker}
    >
        <span className="text-base font-medium text-gray-700">
            {formatDisplay(value)}
        </span>

        <BiCalendar size={18} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />

        <input
            ref={inputRef}
            type="datetime-local"
            value={value}
            min={min}
            onChange={(e) => onChange(e.target.value)}
            onClick={openDatePicker} 
            readOnly={readOnly}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
    </div>
  );
};