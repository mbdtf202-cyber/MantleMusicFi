'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'neon' | 'glass';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, variant = 'default', className, ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default: 'bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500',
      neon: 'bg-dark-900 border border-primary-400 text-primary-400 focus:ring-primary-400 focus:border-primary-300 neon-blue',
      glass: 'glass backdrop-blur-xl border border-white/20 text-white placeholder-white/60 focus:ring-white/50 focus:border-white/50',
    };

    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <input
              ref={ref}
              className={clsx(
                baseClasses,
                variantClasses[variant],
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
                className
              )}
              {...props}
            />
          </motion.div>
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;