import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";

interface LogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ showText = true, size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-20 w-20',
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link 
      to="/" 
      className={cn(
        "flex items-center gap-2 hover:opacity-90 transition-all duration-300", 
        className
      )}
    >
      <div className="relative overflow-hidden rounded-lg">
        <img 
          src="/favicon.svg" 
          alt="Rebur Logo" 
          className={`${sizes[size]} transition-all duration-300 hover:scale-105`} 
        />
        <div className="absolute inset-0 bg-black/5 rounded-lg opacity-0 hover:opacity-100 transition-opacity"></div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${textSizes[size]} truncate`}>Rebur</span>
          <span className="text-xs text-neutral-500 -mt-1 truncate max-w-[120px]">AI Agents</span>
        </div>
      )}
    </Link>
  );
};

export default Logo;
