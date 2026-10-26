import React from 'react';
import { Link } from 'react-router-dom';
import { RazorLogoIcon } from '../common/RazorLogoIcon';

interface LogoProps {
  className?: string;
  light?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  light = false,
  showText = true,
  size = 'md',
}) => {
  const iconPixelSize = size === 'lg' ? 28 : size === 'sm' ? 18 : 22;

  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-2.5 font-display font-black uppercase tracking-tight transition-opacity hover:opacity-90 ${
        size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl'
      } ${light ? 'text-white' : 'text-neutral-950'} ${className}`}
    >
      {/* Brand Icon Box */}
      <div
        className={`flex items-center justify-center rounded-sm p-1.5 transition-all duration-200 group-hover:scale-105 ${
          light
            ? 'bg-white text-black'
            : 'bg-black text-white shadow-xs'
        }`}
      >
        <RazorLogoIcon
          size={iconPixelSize}
          light={!light}
        />
      </div>

      {showText && (
        <span className="tracking-wider font-display font-extrabold select-none">
          IBarbear
        </span>
      )}
    </Link>
  );
};
