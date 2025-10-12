'use client';
import React from 'react';

interface SpinnerProps {
  className?: string;
  size?: number;
}

const Spinner: React.FC<SpinnerProps> = ({ className = 'text-primary', size = 48 }) => {
  const stroke = Math.max(2, Math.round(size / 12));
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth={stroke} opacity="0.15" />
      <path
        d="M45 25a20 20 0 00-6.7-15"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};

export default Spinner;
