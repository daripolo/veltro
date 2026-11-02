'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currencies as staticCurrencies, Currency } from '../../data/currencies';
import { ScrollArea } from './scroll-area';
import { CircleFlag } from 'react-circle-flags';
import { fetchCurrencies } from '@/src/lib/currencyService';
import { cn } from '@/src/lib/utils';
import RiIcon from './icons/RiIcon';


interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'minimal';
  restrictTo?: string[];
  disabled?: boolean;
}

export default function CurrencySelect({
  value,
  onChange,
  className = '',
  placeholder = 'Select a currency',
  showLabel = true,
  label = 'Preferred Currency',
  variant = 'default',
  restrictTo,
  disabled = false,
}: CurrencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyList, setCurrencyList] = useState<Currency[]>(staticCurrencies);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchCurrencies();
        if (response && response.data && response.data.conversion_rates) {
          const rates = response.data.conversion_rates;
          const codes = Object.keys(rates);

          const newCurrencies: Currency[] = codes.map(code => {
            // Check if we have static data
            const staticData = staticCurrencies.find(c => c.code === code);
            if (staticData) return staticData;

            // Generate dynamic data
            let name = code;
            try {
              name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code;
            } catch (e) { }

            let symbol = '';
            try {
              const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code }).formatToParts(0);
              const sym = parts.find(p => p.type === 'currency')?.value;
              if (sym) symbol = sym;
            } catch (e) { }

            // Flag guess
            let flag = '🌐';
            if (code === 'EUR') flag = '🇪🇺';
            else if (!code.startsWith('X')) {
              const countryCode = code.slice(0, 2);
              flag = countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
            }
            let countryCode = code.slice(0, 2).toLowerCase();
            return {
              code,
              name,
              symbol,
              countryCode,
              flag
            };
          });

          setCurrencyList(newCurrencies.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error) {
        console.error("Failed to load currencies", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we haven't already (or simple check)
    // Actually, we should just fetch on mount.
    loadData();
  }, []);

  // Find selected currency object based on value (code)
  const selectedCurrency = useMemo(() => {
    return currencyList.find(c => c.code === value) || null;
  }, [value, currencyList]);

  // Filter currencies
  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let filtered = currencyList;

    if (restrictTo) {
      filtered = filtered.filter(c => restrictTo.includes(c.code));
    }

    return filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery, currencyList, restrictTo]);

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

  const handleSelect = (currency: Currency) => {
    onChange(currency.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn("relative", className)}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {label}
        </label>
      )}

      <div className="relative z-40" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between transition-all outline-none",
            variant === 'default' && "bg-white border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm",
            variant === 'minimal' && "bg-transparent text-slate-900 hover:bg-slate-50 rounded-xl px-2 py-2 gap-2 border border-transparent hover:border-slate-100",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            {variant === 'default' && <RiIcon className="ri-money-dollar-circle-line text-slate-400" />}

            {selectedCurrency ? (
              <span className="flex items-center gap-2 md:gap-3">
                <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-100">
                  <CircleFlag countryCode={selectedCurrency.countryCode?.toLocaleLowerCase()} className='w-full h-full object-cover' />
                </div>
                <span className="font-bold tracking-tight text-slate-900">{selectedCurrency.code}</span>
                {variant === 'default' && (
                  <span className="text-slate-400 text-sm truncate hidden sm:inline-block">- {selectedCurrency.name}</span>
                )}
              </span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
          <RiIcon className={cn(
            "ri-arrow-down-s-line text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden max-h-[400px] flex flex-col z-50 origin-top-right shadow-slate-950/5"
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
                    placeholder="Search currencies..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Currency List */}
              <ScrollArea className="flex-1 w-full">
                {isLoading && currencyList.length === staticCurrencies.length ? (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading currencies...
                  </div>
                ) : null}

                {filteredCurrencies.length > 0 ? (
                  <div className="p-1">
                    {filteredCurrencies.map((currency) => (
                      <button
                        key={currency.code}
                        type="button"
                        onClick={() => handleSelect(currency)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group",
                          value === currency.code ? "bg-primary/5 text-primary" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                        )}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-100 relative">
                          <CircleFlag countryCode={currency.countryCode?.toLocaleLowerCase()} className='w-full h-full object-cover' />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{currency.code}</span>
                            <span className="text-[10px] uppercase font-bold opacity-30">{currency.symbol}</span>
                          </div>
                          <div className="text-[10px] font-bold truncate opacity-50 group-hover:opacity-100 transition-opacity uppercase tracking-tight">{currency.name}</div>
                        </div>
                        {value === currency.code && (
                          <RiIcon className="ri-check-line text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
                    <RiIcon className="ri-emotion-unhappy-line text-2xl mb-2 opacity-50" />
                    No currencies found
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
