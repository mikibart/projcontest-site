import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10", showText = true }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icona Esagonale PC - Ricostruzione Fedele */}
      <svg 
        viewBox="0 0 100 116" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full w-auto aspect-[100/116] text-secondary"
      >
        {/* Esagono Esterno */}
        <path 
          d="M50 5 L93 30 V86 L50 111 L7 86 V30 Z" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinejoin="miter"
        />
        
        {/* Lettera P */}
        {/* Asta verticale sinistra, diagonale superiore parallela all'esagono, chiusura orizzontale al centro */}
        <path 
          d="M26 82 V36 L46 25 V54 H26" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="butt" 
          strokeLinejoin="miter"
        />

        {/* Lettera C */}
        {/* Diagonale superiore parallela, asta verticale destra, diagonale inferiore parallela */}
        <path 
          d="M54 25 L74 36 V80 L54 91" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="butt" 
          strokeLinejoin="miter"
        />
      </svg>
      
      {/* Testo Logo */}
      {showText && (
        <span 
          className="font-serif tracking-tight leading-none text-neutral-text" 
          style={{ fontSize: '1.75em' }}
        >
          <span className="text-secondary">proj</span>contest
        </span>
      )}
    </div>
  );
};