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
        className="block text-sm font-medium text-[#1F2F34] mb-1.5"
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
        className={`w-full h-11 px-3.5 rounded-xl bg-white text-sm text-[#1F2F34] placeholder:text-[#68797C]/60 border transition-colors ${
          error
            ? "border-[#C53030] bg-[#FDF0F0] focus:border-[#C53030]"
            : "border-[#DAE7E7] hover:border-[#C2D4D4] focus:border-[#24989A] focus:ring-1 focus:ring-[#24989A]"
        } disabled:bg-[#F3F8F8] disabled:text-[#68797C] ${className}`}
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
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-[#68797C]">
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
        className="block text-sm font-medium text-[#1F2F34] mb-1.5"
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
        className={`w-full h-11 px-3.5 rounded-xl bg-white text-sm text-[#1F2F34] border transition-colors ${
          error
            ? "border-[#C53030] bg-[#FDF0F0] focus:border-[#C53030]"
            : "border-[#DAE7E7] hover:border-[#C2D4D4] focus:border-[#24989A] focus:ring-1 focus:ring-[#24989A]"
        } disabled:bg-[#F3F8F8] disabled:text-[#68797C] ${className}`}
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
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-[#68797C]">
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
        className="block text-sm font-medium text-[#1F2F34] mb-1.5"
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
        className={`w-full p-3.5 rounded-xl bg-white text-sm text-[#1F2F34] placeholder:text-[#68797C]/60 border transition-colors ${
          error
            ? "border-[#C53030] bg-[#FDF0F0] focus:border-[#C53030]"
            : "border-[#DAE7E7] hover:border-[#C2D4D4] focus:border-[#24989A] focus:ring-1 focus:ring-[#24989A]"
        } disabled:bg-[#F3F8F8] disabled:text-[#68797C] ${className}`}
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
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-[#68797C]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
