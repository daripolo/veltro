'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { countries, Country } from '../../data/countries';
import { CircleFlag } from 'react-circle-flags';
import { ScrollArea } from './scroll-area';
import RiIcon from './icons/RiIcon';


interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function PhoneInput({
  value,
  onChange,
  className = '',
  placeholder = '(555) 000-0000',
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideCountryCode, setOverrideCountryCode] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine selected country from value
  const selectedCountry = useMemo(() => {
    // Clean value to just digits and +
    const cleanValue = value ? (value.startsWith('+') ? value : `+${value}`) : '';

    // If we have an override (user explicitly selected a country), check if it still matches the value
    if (overrideCountryCode) {
      const override = countries.find(c => c.code === overrideCountryCode);
      if (override) {
        // If value is empty, we stick to the override (user cleared input but wants to keep country)
        if (!cleanValue || cleanValue === '+') return override;

        // Check if value matches the override's dial code
        const codes = override.dial_code.split(',').map(d => d.trim().replace(/[^\d+]/g, ''));
        // We match if the value starts with the code, OR if the code starts with the value (user is typing the code)
        // Actually, typically value contains the code. 
        // If value is "+1", and code is "+1", it matches.
        if (codes.some(code => cleanValue.startsWith(code))) {
          return override;
        }
      }
    }

    if (!value) return countries.find(c => c.code === 'US') || countries[0];

    // Sort by dial_code length descending to match most specific code first
    const sortedCountries = [...countries].sort((a, b) => {
      const lenA = a.dial_code.replace(/\D/g, '').length;
      const lenB = b.dial_code.replace(/\D/g, '').length;
      if (lenA !== lenB) return lenB - lenA;
      // If lengths are equal (e.g. US +1 vs CA +1), prioritize US
      if (a.code === 'US') return -1;
      if (b.code === 'US') return 1;
      return 0;
    });

    const found = sortedCountries.find(c => {
      const cleanDial = c.dial_code.replace(/[^\d+]/g, ''); // e.g. +1
      // Check if value starts with this dial code
      // Note: dial_code in data might be like "+1-242", we should check base code +1 or full code
      // My data has "+1" for US and "+1-242" for Bahamas.
      // If value is "+1242...", it should match Bahamas first because it's longer.

      // Handle complex dial codes in data (e.g. "+1-809, +1-829")
      const codes = c.dial_code.split(',').map(d => d.trim().replace(/[^\d+]/g, ''));
      return codes.some(code => cleanValue.startsWith(code));
    });

    return found || countries.find(c => c.code === 'US') || countries[0];
  }, [value, overrideCountryCode]);

  // Extract local number
  const localNumber = useMemo(() => {
    if (!value) return '';

    let cleanValue = value.replace(/[^\d]/g, '');
    const cleanDialCode = selectedCountry.dial_code.split(',')[0].replace(/[^\d]/g, '');

    if (cleanValue.startsWith(cleanDialCode)) {
      return cleanValue.slice(cleanDialCode.length);
    }
    // Fallback if mismatch (shouldn't happen if detection is correct)
    return cleanValue;
  }, [value, selectedCountry]);

  // Filter countries
  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.dial_code.includes(query) ||
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

  const handleCountrySelect = (country: Country) => {
    setIsOpen(false);
    setSearchQuery('');
    setOverrideCountryCode(country.code);

    // Construct new value with new country code + existing local number
    const cleanDialCode = country.dial_code.split(',')[0].replace(/[^\d]/g, '');
    onChange(cleanDialCode + localNumber);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocal = e.target.value.replace(/[^\d]/g, '');
    const cleanDialCode = selectedCountry.dial_code.split(',')[0].replace(/[^\d]/g, '');
    onChange(cleanDialCode + newLocal);
  };

  // Format local number for display (simple US-like formatting for now)
  const displayValue = useMemo(() => {
    const clean = localNumber;
    // Apply formatting only if it looks like a standard number?
    // For now, let's just return the raw local number to avoid fighting the cursor
    // If we want masking, we need a library or careful implementation.
    // The design shows formatting. Let's try simple formatting.
    if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') {
      if (clean.length > 6) return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
      if (clean.length > 3) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
      if (clean.length > 0) return `(${clean}`;
    }
    return clean;
  }, [localNumber, selectedCountry]);

  // Handle formatted input change is tricky. 
  // We'll stick to unformatted input for reliability, or just raw digits.
  // Wait, I used `displayValue` in render but `handleInputChange` reads `e.target.value`.
  // If I format the display, I must unformat in `handleInputChange`.

  return (
    <div className={`space-y-2 bg-white ${className}`}>
      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Phone number</label>
      <div className="relative z-50" ref={dropdownRef}>
        <div className="flex border border-slate-100 rounded-2xl transition-all focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 shadow-sm">
          {/* Country Selector Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 pl-4 pr-3 py-3 border-r border-slate-100 hover:bg-slate-100 transition-colors rounded-l-2xl shrink-0 min-w-[120px]"
          >
            <CircleFlag countryCode={selectedCountry.code.toLocaleLowerCase()} className='w-6 h-6 rounded-full border border-slate-200' />
            <span className="text-slate-900 font-bold tracking-tight">{selectedCountry.code}</span>
            <span className="text-slate-400 text-[10px] font-bold">{selectedCountry.dial_code.split(',')[0]}</span>
            <RiIcon className={`ri-arrow-down-s-line text-slate-400 transition-transform duration-200 ml-auto ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Phone Number Input */}
          <input
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full bg-transparent border-none px-4 py-3 text-slate-900 font-bold tracking-tight placeholder-slate-300 focus:outline-none rounded-r-2xl"
          />
        </div>

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
                    placeholder="Search for countries"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Country List */}
              <ScrollArea className="w-full h-40">
                <div className="p-1">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <CircleFlag countryCode={country.code.toLocaleLowerCase()} className='w-8 h-8 rounded-full border border-slate-100' />
                        <span className="flex-1 text-slate-600 group-hover:text-slate-900 text-sm font-bold tracking-tight truncate">{country.name}</span>
                        <span className="text-slate-400 font-mono text-[10px] font-bold">{country.dial_code.split(',')[0]}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      No countries found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
