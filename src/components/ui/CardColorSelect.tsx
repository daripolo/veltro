'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RiIcon from '@/components/ui/RiIcon';

interface ColorOption {
  value: string;
  label: string;
}

const colorOptions: ColorOption[] = [
  { value: "from-orange-500 to-orange-700", label: "Signal (Orange)" },
  { value: "from-gray-700 to-gray-900", label: "Black (Standard)" },
  { value: "from-blue-600 to-blue-800", label: "Blue (Rewards)" },
  { value: "from-emerald-600 to-teal-800", label: "Green (Eco)" },
];

interface CardColorSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string | null;
}

export default function CardColorSelect({
  value,
  onChange,
  className = '',
  label = 'Card Color Style',
}: CardColorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected option
  const selectedOption = useMemo(() => {
    return colorOptions.find(o => o.value === value) || colorOptions[0];
  }, [value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: ColorOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs text-gray-400 mb-1">{label}</label>}
      <div className="relative z-30" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all hover:bg-white/10`}
        >
          <div className="flex items-center gap-3">
             <div className={`w-6 h-6 rounded-full bg-linear-to-br ${selectedOption.value} shadow-sm border border-white/10`}></div>
             <span className="text-white">{selectedOption.label}</span>
          </div>
          <RiIcon className={`ri-arrow-down-s-line text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full mt-2 bg-charcoal border border-white/10 rounded-xl shadow-xl overflow-hidden z-60"
            >
              <div className="py-1">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-linear-to-br ${option.value} shadow-sm border border-white/10`}></div>
                    <span className="flex-1 text-white text-sm font-medium">{option.label}</span>
                    {value === option.value && (
                      <RiIcon className="ri-check-line text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
