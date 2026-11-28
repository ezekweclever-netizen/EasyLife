import React from "react";

export interface BaseFieldProps {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export interface InputProps
  extends BaseFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {}

export function Input({
  id,
  label,
  helperText,
  error,
  required,
  className = "",
  ...rest
}: InputProps) {
  const descriptionId = error
    ? `${id}-error`
    : helperText
      ? `${id}-helper`
      : undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
      >
        {label}
        {required && (
          <span className="text-[#C53030] ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={`w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] placeholder:text-[#4A525C]/60 dark:placeholder:text-[#C3C8CF]/60 border transition-colors ${
          error
            ? "border-[#C53030] bg-[#FDE8E8] dark:bg-[#C53030]/10 focus:border-[#C53030]"
            : "border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#C3C8CF] focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C] dark:focus:border-[#F06A1F] dark:focus:ring-[#F06A1F]"
        } disabled:bg-[#FAF7F3] dark:disabled:bg-[#15181C] disabled:text-[#4A525C] dark:disabled:text-[#C3C8CF] ${className}`}
        {...rest}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-[#C53030]"
        >
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-[#4A525C] dark:text-[#C3C8CF]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends BaseFieldProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  options: readonly SelectOption[];
  placeholder?: string;
}

export function Select({
  id,
  label,
  options,
  placeholder,
  helperText,
  error,
  required,
  className = "",
  ...rest
}: SelectProps) {
  const descriptionId = error
    ? `${id}-error`
    : helperText
      ? `${id}-helper`
      : undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
      >
        {label}
        {required && (
          <span className="text-[#C53030] ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={`w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] border transition-colors ${
          error
            ? "border-[#C53030] bg-[#FDE8E8] dark:bg-[#C53030]/10 focus:border-[#C53030]"
            : "border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#C3C8CF] focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C] dark:focus:border-[#F06A1F] dark:focus:ring-[#F06A1F]"
        } disabled:bg-[#FAF7F3] dark:disabled:bg-[#15181C] disabled:text-[#4A525C] dark:disabled:text-[#C3C8CF] ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-[#C53030]"
        >
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-[#4A525C] dark:text-[#C3C8CF]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export interface TextareaProps
  extends BaseFieldProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {}

export function Textarea({
  id,
  label,
  helperText,
  error,
  required,
  rows = 4,
  className = "",
  ...rest
}: TextareaProps) {
  const descriptionId = error
    ? `${id}-error`
    : helperText
      ? `${id}-helper`
      : undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
      >
        {label}
        {required && (
          <span className="text-[#C53030] ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={`w-full p-3.5 rounded-xl bg-white dark:bg-[#1F2328] text-sm text-[#1F2328] dark:text-[#FAF7F3] placeholder:text-[#4A525C]/60 dark:placeholder:text-[#C3C8CF]/60 border transition-colors ${
          error
            ? "border-[#C53030] bg-[#FDE8E8] dark:bg-[#C53030]/10 focus:border-[#C53030]"
            : "border-[#E6E0D8] dark:border-[#2E343B] hover:border-[#C3C8CF] focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C] dark:focus:border-[#F06A1F] dark:focus:ring-[#F06A1F]"
        } disabled:bg-[#FAF7F3] dark:disabled:bg-[#15181C] disabled:text-[#4A525C] dark:disabled:text-[#C3C8CF] ${className}`}
        {...rest}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-[#C53030]"
        >
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-[#4A525C] dark:text-[#C3C8CF]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
