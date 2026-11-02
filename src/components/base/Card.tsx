import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  variant?: 'white' | 'glass' | 'dark';
}

export default function Card({
  children,
  className = '',
  hover = false,
  delay,
  variant = 'white',
}: CardProps) {
  const hasEntranceAnimation = typeof delay === "number";

  const variants = {
    white: 'bg-white border-slate-50 shadow-sm',
    glass: 'bg-white/80 backdrop-blur-md border-white/20 shadow-xl',
    dark: 'bg-slate-950 text-white border-white/5'
  };

  return (
    <motion.div
      initial={hasEntranceAnimation ? { opacity: 0, y: 10 } : undefined}
      animate={hasEntranceAnimation ? { opacity: 1, y: 0 } : undefined}
      transition={hasEntranceAnimation ? { delay, duration: 0.4 } : undefined}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`rounded-3xl border p-8 transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </motion.div>
  );
}
