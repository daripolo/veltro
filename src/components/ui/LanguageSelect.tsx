'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { languages, Language } from '../../data/languages';
import { ScrollArea } from './scroll-area';
import RiIcon from './icons/RiIcon';

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function LanguageSelect({
  value,
  onChange,
  className = '',
  placeholder = 'Select a language',
}: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected language object based on value (name)
  const selectedLanguage = useMemo(() => {
    return languages.find(l => l.name === value) || null;
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

  const handleSelect = (language: Language) => {
    onChange(language.name);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Language</label>
      <div className="relative z-30" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <RiIcon className="ri-translate-2 text-slate-400" />
            {selectedLanguage ? (
              <span className="flex items-center gap-2">
                <span className="font-bold tracking-tight">{selectedLanguage.name}</span>
                <span className="text-slate-400 text-sm font-medium tracking-tight">({selectedLanguage.nativeName})</span>
              </span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
          <RiIcon className={`ri-arrow-down-s-line text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden max-h-[300px] flex flex-col z-60 shadow-slate-950/5"
            >
              {/* Language List */}
              <ScrollArea className="w-full h-40">
                <div className="p-1">
                  {languages.map((language) => (
                    <button
                      key={language.name}
                      type="button"
                      onClick={() => handleSelect(language)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                    >
                      <span className="flex-1 text-slate-600 group-hover:text-slate-900 text-sm font-bold tracking-tight">{language.name}</span>
                      <span className="text-slate-400 text-xs font-medium">{language.nativeName}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
