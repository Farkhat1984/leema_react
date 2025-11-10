/**
 * PhoneInput Component
 * Phone number input with country selection and formatting
 * Wrapper around react-phone-input-2
 *
 * Usage:
 * <PhoneInput
 *   value={phone}
 *   onChange={setPhone}
 *   country="kz"
 * />
 */

import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { cn } from '@/shared/lib/utils';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country?: string; // Default country code (e.g., 'kz' for Kazakhstan)
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}

export const PhoneInput = ({
  value,
  onChange,
  country = 'kz',
  disabled = false,
  placeholder = '+7 (___) ___-__-__',
  className,
  error,
}: PhoneInputProps) => {
  return (
    <div className={cn('phone-input-wrapper', className)}>
      <ReactPhoneInput
        country={country}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        containerClass={cn(
          'phone-input-container',
          error && 'phone-input-error'
        )}
        inputClass={cn(
          'phone-input',
          '!w-full !h-10 !rounded-lg !border-gray-300',
          '!focus:border-primary-500 !focus:ring-primary-500',
          disabled && '!bg-gray-100 !cursor-not-allowed',
          error && '!border-red-500 !focus:border-red-500 !focus:ring-red-500'
        )}
        buttonClass="!border-gray-300 !rounded-l-lg !bg-gray-50 hover:!bg-gray-100"
        dropdownClass="!rounded-lg !shadow-lg"
        enableSearch
        searchPlaceholder="Поиск страны..."
        preferredCountries={['kz']}
        // Formatting
        masks={{ kz: '(...) ...-..-..' }}
        // Disable auto country detection to keep Kazakhstan as default
        disableCountryGuess
        // Only show countries that might be relevant (KZ first)
        onlyCountries={['kz', 'ru', 'uz', 'kg', 'tj', 'by', 'ua', 'ge', 'am', 'az']}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      <style>{`
        .phone-input-wrapper .react-tel-input {
          font-family: inherit;
        }
        .phone-input-wrapper .react-tel-input .form-control {
          width: 100%;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default PhoneInput;
