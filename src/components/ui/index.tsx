import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export { default as LiveIndicator } from './LiveIndicator';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Card
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden", className)}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ title: string, subtitle?: string, icon?: React.ElementType, iconColor?: string }> = ({ title, subtitle, icon: Icon, iconColor }) => (
  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
    <div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {Icon && (
      <div className={cn("p-2 rounded-lg", iconColor || "bg-gray-50 text-gray-400")}>
        <Icon className="h-6 w-6" />
      </div>
    )}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={cn("px-6 py-5", className)}>
    {children}
  </div>
);

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  roleColor?: 'escola' | 'sicredi' | 'prefeitura';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  roleColor = 'escola',
  className, 
  ...props 
}) => {
  const variants = {
    primary: {
      escola: 'bg-escola text-white hover:bg-escola-dark',
      sicredi: 'bg-sicredi text-white hover:bg-sicredi-dark',
      prefeitura: 'bg-prefeitura text-white hover:bg-prefeitura-dark',
    },
    secondary: {
      escola: 'bg-escola-light text-escola hover:bg-opacity-80',
      sicredi: 'bg-sicredi-light text-sicredi hover:bg-opacity-80',
      prefeitura: 'bg-prefeitura-light text-prefeitura hover:bg-opacity-80',
    },
    outline: {
      escola: 'border-2 border-escola text-escola hover:bg-escola hover:text-white',
      sicredi: 'border-2 border-sicredi text-sicredi hover:bg-sicredi hover:text-white',
      prefeitura: 'border-2 border-prefeitura text-prefeitura hover:bg-prefeitura hover:text-white',
    },
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClass = typeof variants[variant] === 'string' 
    ? variants[variant] 
    : (variants[variant] as any)[roleColor];

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClass,
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  roleColor?: 'escola' | 'sicredi' | 'prefeitura';
}

export const Input: React.FC<InputProps> = ({ label, error, roleColor = 'escola', className, ...props }) => {
  const ringColors = {
    escola: 'focus:ring-escola focus:border-escola',
    sicredi: 'focus:ring-sicredi focus:border-sicredi',
    prefeitura: 'focus:ring-prefeitura focus:border-prefeitura',
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input 
        className={cn(
          "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm transition-all",
          ringColors[roleColor],
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

// Stats Card
export const StatCard: React.FC<{
  label: string,
  value: string | number,
  icon: React.ElementType,
  roleColor: 'escola' | 'sicredi' | 'prefeitura',
  trend?: string,
  subtitle?: string
}> = ({ label, value, icon: Icon, roleColor, trend, subtitle }) => {
  const configs = {
    escola: { bg: 'bg-escola-light', text: 'text-escola' },
    sicredi: { bg: 'bg-sicredi-light', text: 'text-sicredi' },
    prefeitura: { bg: 'bg-prefeitura-light', text: 'text-prefeitura' },
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-[11px] text-gray-500 mt-1.5 font-medium leading-snug">{subtitle}</p>}
            {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>}
          </div>
          <div className={cn("p-3 rounded-xl shrink-0", configs[roleColor].bg, configs[roleColor].text)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    </Card>
  );
};

// Table
export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      {children}
    </table>
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-gray-50">
    <tr>{children}</tr>
  </thead>
);

export const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="bg-white divide-y divide-gray-200">
    {children}
  </tbody>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <th 
    className={cn("px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider", className)}
    {...props}
  >
    {children}
  </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <td 
    className={cn("px-6 py-4 whitespace-nowrap text-sm text-gray-600", className)}
    {...props}
  >
    {children}
  </td>
);
