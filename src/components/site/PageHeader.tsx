import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`border-b border-neutral-200 bg-white py-12 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {eyebrow && (
          <span className="mb-2.5 inline-block text-xs font-bold uppercase tracking-widest text-neutral-500">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-5xl">
          {title}
        </h1>
        {children && (
          <p className="mt-3 max-w-2xl text-base text-neutral-600 sm:text-lg">
            {children}
          </p>
        )}
      </div>
    </div>
  );
};
