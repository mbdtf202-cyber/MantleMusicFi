'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  padding = 'md',
  onClick,
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300';

  const variantClasses = {
    default: 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 shadow-lg',
    glass: 'glass backdrop-blur-xl border border-white/20',
    neon: 'bg-dark-900 border border-primary-400 neon-blue',
    gradient: 'bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-300/30',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const hoverClasses = hover ? 'hover-lift cursor-pointer' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { y: -5 } : {}}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

// Card子组件
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={clsx('flex flex-col space-y-1.5 p-6', className)}>
    {children}
  </div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={clsx('text-2xl font-semibold leading-none tracking-tight', className)}>
    {children}
  </h3>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => (
  <p className={clsx('text-sm text-gray-600 dark:text-gray-400', className)}>
    {children}
  </p>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={clsx('p-6 pt-0', className)}>
    {children}
  </div>
);

export { Card };
export default Card;