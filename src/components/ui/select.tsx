'use client';

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={selectRef} className={clsx('relative', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className,
}) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-dark-600',
        'bg-white dark:bg-dark-800 px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
      <ChevronDown className={clsx('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className,
}) => {
  const { isOpen } = React.useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        'absolute top-full left-0 z-50 w-full mt-1',
        'bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600',
        'rounded-md shadow-lg max-h-60 overflow-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className,
}) => {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext);

  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-700',
        'focus:outline-none focus:bg-gray-100 dark:focus:bg-dark-700',
        selectedValue === value && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
        className
      )}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  className,
}) => {
  const { value } = React.useContext(SelectContext);

  return (
    <span className={clsx('block truncate', !value && 'text-gray-500', className)}>
      {value || placeholder}
    </span>
  );
};