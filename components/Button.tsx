import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  withArrow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  withArrow = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden";
  
  const variants = {
    // Solid architectural blue, slight lift on hover
    primary: "bg-primary text-white hover:bg-[#2A3F5F] shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 rounded-none",
    
    // Outline with thick borders, very technical feel
    secondary: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-none",
    
    // Minimalist
    ghost: "bg-transparent text-neutral-muted hover:text-neutral-text hover:bg-neutral-200/50 rounded-md",
    
    // Terracotta accent
    accent: "bg-secondary text-white hover:bg-[#B94A29] shadow-md rounded-none",
    
    // Clean outline
    outline: "bg-white border border-gray-200 text-neutral-text hover:border-primary/50 hover:shadow-sm rounded-none",

    // Text link style with underline animation
    link: "text-primary p-0 hover:text-secondary bg-transparent !justify-start",
  };

  const sizes = {
    sm: "text-xs tracking-wider uppercase px-4 py-2",
    md: "text-sm tracking-wide px-6 py-3",
    lg: "text-base tracking-wide px-8 py-4 font-semibold",
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center">
        {children}
        {withArrow && <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />}
      </span>
    </button>
  );
};