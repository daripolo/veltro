'use client'
import { useState } from 'react';
import { CameraIcon } from './icons/CameraIcon';

interface CustomAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  className?: string;
  size?: number;
  rounded?: string;
}

export const CustomAvatar = ({
  src,
  alt = 'Avatar',
  name,
  className = '',
  size = 40,
  rounded = 'rounded-full'
}: CustomAvatarProps) => {
  const [hasError, setHasError] = useState(false);

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // If we have a valid source and no error, show the image
  if (src && !hasError) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className}`} style={{ width: size, height: size }}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback 1: Initials
  if (initials) {
    return (
      <div 
        className={`flex items-center justify-center bg-primary/10 text-primary font-bold ${rounded} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  // Fallback 2: Camera Icon
  return (
    <div 
      className={`flex items-center justify-center bg-white/5 text-gray-500 ${rounded} animate-pulse ${className}`}
      style={{ width: size, height: size }}
    >
      <CameraIcon size={size * 0.5} fill="currentColor" />
    </div>
  );
};
