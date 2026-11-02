'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { countries, Country } from '../../data/countries';
import { CircleFlag } from 'react-circle-flags'
import { ScrollArea } from './scroll-area';
import RiIcon from './icons/RiIcon';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CountrySelect({
  value,
  onChange,
  className = '',
  placeholder = 'Select a country',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find selected country object based on value (name)
  const selectedCountry = useMemo(() => {
    return countries.find(c => c.name === value) || null;
  }, [value]);

  // Filter countries
  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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

  // Focus search
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Country</label>
      <div className="relative z-40" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <RiIcon className="ri-global-line text-slate-400" />
            {selectedCountry ? (
              <span className="flex items-center gap-2">
                <CircleFlag countryCode={selectedCountry.code.toLocaleLowerCase()} className='w-5 h-5' />
                <span className="font-bold tracking-tight">{selectedCountry.name}</span>
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
              {/* Search Box */}
              <div className="p-3 border-b border-slate-50 sticky top-0 bg-white z-10 font-sans">
                <div className="relative">
                  <RiIcon className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Country List */}
              <ScrollArea className="w-full h-40">
                {filteredCountries.length > 0 ? (
                  <div className="p-1">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleSelect(country)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <CircleFlag countryCode={country.code.toLocaleLowerCase()} className='w-8 h-8 rounded-full border border-slate-100' />
                        <span className="flex-1 text-slate-600 group-hover:text-slate-900 text-sm font-bold tracking-tight truncate">{country.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No countries found
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
