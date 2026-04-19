import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  icon,
  fullWidth = false
}: ButtonProps) {
  const variants = {
    primary: {
      bg: '#1A6B47',
      text: '#ffffff',
      hover: '#15563A'
    },
    secondary: {
      bg: '#C8973A',
      text: '#ffffff',
      hover: '#B3862F'
    },
    accent: {
      bg: '#1B4F72',
      text: '#ffffff',
      hover: '#164061'
    }
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const style = variants[variant];

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${sizes[size]} rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontFamily: 'var(--font-ibm-sans)',
        fontWeight: 500
      }}
    >
      {children}
      {icon && icon}
    </motion.button>
  );
}
