import React from 'react';
import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  country?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = 'Enter phone number',
  disabled = false,
  required = false,
  country = 'kz',
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <ReactPhoneInput
        country={country}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        inputClass={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
