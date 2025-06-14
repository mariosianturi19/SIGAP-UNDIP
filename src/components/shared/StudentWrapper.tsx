"use client";

import { useEffect } from 'react';

interface StudentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function StudentWrapper({ children, className = "" }: StudentWrapperProps) {
  useEffect(() => {
    // Force light mode for student components
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Set data attribute for consistent theming
    root.setAttribute('data-theme', 'light');
    
    return () => {
      // Cleanup is handled by ThemeProvider for admin routes
    };
  }, []);

  return (
    <div className={`${className}`} data-theme="light">
      {children}
    </div>
  );
}
