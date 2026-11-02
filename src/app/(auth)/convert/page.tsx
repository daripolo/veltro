'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import CurrencySelect from '@/components/ui/CurrencySelect';
import { fetchCurrencies } from '@/services/currencyService';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

import { currencies } from '@/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

export default function ConvertPage() {
  const accounts = useQuery(api.accounts.getAccounts);
  const convertMutation = useMutation(api.accounts.convertCurrency);
  const createNotification = useMutation(api.notifications.createNotification);

  const [amount, setAmount] = useState<string>('2140');
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeRange, setTimeRange] = useState<'1D' | '5D' | '1M' | '1Y'>('1M');

  const availableCurrencies = useMemo(() => {
    if (!accounts) return [];
    return accounts.map(a => a.currency).filter(Boolean) as string[];
  }, [accounts]);

  const fromBalance = useMemo(() => {
    if (!accounts) return 0;
    const account = accounts.find(a => a.currency === fromCurrency);
    return account ? account.balance : 0;
  }, [accounts, fromCurrency]);

  const fromCurrencySymbol = useMemo(() => {
    return currencies.find((c) => c.code === fromCurrency)?.symbol ?? "";
  }, [fromCurrency]);

  // Enforce valid selection and strict pairing
  useEffect(() => {
    if (availableCurrencies.length === 2) {
      const [c1, c2] = availableCurrencies;

      // Initialize if needed
      if (!availableCurrencies.includes(fromCurrency)) setFromCurrency(c1);
      if (!availableCurrencies.includes(toCurrency)) setToCurrency(c2);

      // Enforce pairing: if From is C1, To must be C2 (and vice versa)
      if (fromCurrency === c1 && toCurrency !== c2) setToCurrency(c2);
      if (fromCurrency === c2 && toCurrency !== c1) setToCurrency(c1);
    }
  }, [availableCurrencies, fromCurrency, toCurrency]);

  const handleFromChange = (value: string) => {
    setFromCurrency(value);
    // Auto-swap the other one if we only have 2 options
    if (availableCurrencies.length === 2) {
      const other = availableCurrencies.find(c => c !== value);
      if (other) setToCurrency(other);
    }
  };

  const handleToChange = (value: string) => {
    setToCurrency(value);
    // Auto-swap the other one if we only have 2 options
    if (availableCurrencies.length === 2) {
      const other = availableCurrencies.find(c => c !== value);
      if (other) setFromCurrency(other);
    }
  };

  useEffect(() => {
    const loadRates = async () => {
      try {
        const data = await fetchCurrencies();
        if (data?.data?.conversion_rates) {
          setRates(data.data.conversion_rates);
        }
      } catch (error) {
        console.error('Failed to fetch rates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRates();
  }, []);

  const conversionRate = useMemo(() => {
    if (!rates[fromCurrency] || !rates[toCurrency]) return 0;
    return rates[toCurrency] / rates[fromCurrency];
  }, [rates, fromCurrency, toCurrency]);

  const fee = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    return numAmount * 0.005; // 0.5% fee
  }, [amount]);

  const totalToConvert = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    return numAmount - fee;
  }, [amount, fee]);

  const finalAmount = useMemo(() => {
    return totalToConvert * conversionRate;
  }, [totalToConvert, conversionRate]);

  // Mock chart data generation
  const chartData = useMemo(() => {
    const data = [];
    let points = 50;

    switch (timeRange) {
      case '1D': points = 24; break;
      case '5D': points = 60; break;
      case '1M': points = 30; break;
      case '1Y': points = 52; break;
    }

    const baseValue = conversionRate;
    const volatility = 0.005;

    for (let i = 0; i < points; i++) {
      const date = new Date();
      if (timeRange === '1D') {
        date.setHours(date.getHours() - (points - i));
      } else if (timeRange === '1Y') {
        date.setDate(date.getDate() - (points - i) * 7);
      } else {
        date.setDate(date.getDate() - (points - i));
      }

      const randomChange = (Math.random() - 0.5) * volatility * baseValue;
      const trend = Math.sin(i / 5) * 0.002 * baseValue;

      data.push({
        date: date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: timeRange === '1D' ? 'numeric' : undefined
        }),
        value: baseValue + randomChange + trend
      });
    }
    if (data.length > 0) {
      data[data.length - 1].value = conversionRate;
    }
    return data;
  }, [conversionRate, timeRange]);

  const rateChange = useMemo(() => {
    if (chartData.length < 2) return { percent: 0, value: 0 };

    const firstValue = chartData[0]?.value ?? 0;
    const lastValue = chartData[chartData.length - 1]?.value ?? 0;
    const valueChange = lastValue - firstValue;
    const percentChange = firstValue === 0 ? 0 : (valueChange / firstValue) * 100;

    return { percent: percentChange, value: valueChange };
  }, [chartData]);

  const isRateDown = rateChange.percent < 0;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleConvert = async () => {
    setError('');
    setSuccess('');
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount > fromBalance) {
      setError('Insufficient balance');
      return;
    }

    setIsConverting(true);
    try {
      await convertMutation({
        fromCurrency,
        toCurrency,
        amount: numAmount,
        finalAmount
      });

      await createNotification({
        title: "Currency Converted",
        message: `Converted ${numAmount.toLocaleString()} ${fromCurrency} to ${finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCurrency}`,
        type: "alert",
        icon: "ri-exchange-dollar-line",
      });

      setSuccess(`Successfully converted ${numAmount} ${fromCurrency} to ${finalAmount.toFixed(2)} ${toCurrency}`);
      setAmount('');
    } catch (err) {
      console.error(err);
      setError('Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const getCurrencyName = (code: string) => {
    return currencies.find(c => c.code === code)?.name || code;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (accounts === undefined) {
    return (
      <div className="w-full">
       
        
          <div className="p-6 md:p-12 max-w-7xl mx-auto w-full animate-pulse">
              <div className="mb-8">
                <div className="h-9 w-96 max-w-full rounded bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl">
                    <div className="h-24 w-full bg-slate-100 rounded-2xl mb-4" />
                    <div className="h-16 w-full bg-slate-100 rounded-2xl mb-6" />
                    <div className="h-12 w-full bg-slate-100 rounded-2xl" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl">
                    <div className="h-4 w-32 bg-slate-100 rounded mb-4" />
                    <div className="h-36 w-full bg-slate-100 rounded-2xl" />
                  </div>
                </div>
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl">
                    <div className="h-5 w-56 bg-slate-100 rounded mb-4" />
                    <div className="h-64 w-full bg-slate-100 rounded-2xl" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl">
                    <div className="h-5 w-40 bg-slate-100 rounded mb-4" />
                    <div className="h-16 w-full bg-slate-100 rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>
        
       
      </div>
    );
  }

  return (
      <div className="w-full">
          <div className="p-2 md:p-6 max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">How much do you want to convert?</h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                {/* Left Column: Conversion Input */}
                <div className="lg:col-span-5 space-y-6">

                  {/* Main Input Card */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-4 md:p-6 shadow-xl">

                    {/* FROM Input */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all focus-within:border-primary/50 relative group">
                      <label className="text-slate-500 text-xs font-medium absolute top-4 left-4">Convert</label>
                      <div className="flex items-center justify-between mt-4">
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*\.?\d*$/.test(val)) setAmount(val);
                          }}
                          className="bg-transparent text-3xl font-bold text-slate-900 outline-none w-full placeholder-slate-400 tracking-tight"
                          placeholder="0.00"
                        />
                        <div className="w-27.5 shrink-0">
                          <CurrencySelect
                            value={fromCurrency}
                            onChange={handleFromChange}
                            showLabel={false}
                            variant="minimal"
                            restrictTo={availableCurrencies}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Balance Info */}
                    <div className="mt-3 mb-6 px-1">
                      <p className="text-slate-500 text-sm">
                        You have <span className="text-slate-600 font-medium border-b border-slate-300">{fromCurrencySymbol}{fromBalance.toLocaleString()}</span> available balance
                      </p>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-3 mb-6 px-2 relative">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <RiIcon className="ri-subtract-line" />
                          </div>
                          <span className="text-slate-600 font-medium">{fromCurrencySymbol}{fee.toFixed(2)}</span>
                        </div>
                        <span className="text-slate-500">Our fee</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <RiIcon className="ri-equal-line" />
                          </div>
                          <span className="text-slate-600 font-medium">{fromCurrencySymbol}{totalToConvert.toFixed(2)}</span>
                        </div>
                        <span className="text-slate-500">Total amount we'll convert</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <RiIcon className="ri-close-line" />
                          </div>
                          <span className="text-primary font-bold">{conversionRate.toFixed(6)}</span>
                        </div>
                        <span className="text-slate-500">Live rate</span>
                      </div>

                      {/* Swap Button (Absolute centered) */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden">
                        <button
                          onClick={handleSwap}
                          className="w-8 h-8 rounded-full bg-white border-slate-100 border flex items-center justify-center hover:border-primary hover:text-primary transition-colors z-10"
                        >
                          <RiIcon className="ri-arrow-up-down-line" />
                        </button>
                      </div>
                    </div>

                    {/* TO Input */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all hover:border-slate-200 relative">
                      <div className="absolute left-1/2 -top-3 -translate-x-1/2">
                        <button
                          onClick={handleSwap}
                          className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:border-primary hover:text-primary transition-colors shadow-lg"
                        >
                          <RiIcon className="ri-arrow-down-line text-sm" />
                        </button>
                      </div>

                      <label className="text-slate-500 text-xs font-medium absolute top-4 left-4">To</label>
                      <div className="flex items-center justify-between mt-4">
                        <input
                          type="text"
                          readOnly
                          value={finalAmount.toFixed(2)}
                          className="bg-transparent text-3xl font-bold text-slate-900 outline-none w-full placeholder-slate-400 tracking-tight"
                        />
                        <div className="w-27.5 shrink-0">
                          <CurrencySelect
                            value={toCurrency}
                            onChange={handleToChange}
                            showLabel={false}
                            variant="minimal"
                            restrictTo={availableCurrencies}
                          />
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-8">
                      {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                      {success && <p className="text-green-500 text-sm mb-2 text-center">{success}</p>}
                      <button
                        onClick={handleConvert}
                        disabled={isConverting || isLoading}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl text-lg hover:bg-orange-500 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          'Continue'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Chart & Info */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="h-full flex flex-col justify-center">
                    <div className="mb-8">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
                        {getCurrencyName(fromCurrency)} to {getCurrencyName(toCurrency)}
                      </h2>

                      <div className="flex items-baseline gap-4 mb-2">
                        <span className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
                          {conversionRate.toFixed(4)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`${isRateDown ? 'text-red-500' : 'text-green-600'} text-sm font-medium flex items-center gap-1`}
                          >
                            <RiIcon className={`ri-arrow-${isRateDown ? 'down' : 'up'}-fill`} />{' '}
                            {Math.abs(rateChange.percent).toFixed(2)}%
                          </span>
                          <span className={`${isRateDown ? 'text-red-500' : 'text-green-600'} text-sm`}>
                            {isRateDown ? '-' : '+'}
                            {Math.abs(rateChange.value).toFixed(4)} {timeRange}
                          </span>
                        </div>
                      </div>

                      <div className="text-slate-500 text-sm flex gap-2">
                        <span>{new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })} UTC</span>
                        <span>•</span>
                        <span className="underline cursor-pointer hover:text-slate-500">Disclaimer</span>
                      </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex gap-1 mb-8">
                      {['1D', '5D', '1M', '1Y'].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range as any)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                            timeRange === range
                              ? "bg-primary text-white"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </div>

                    {/* Chart */}
                    <div className="flex-1 min-h-87.5 w-full relative border border-slate-100 rounded-3xl p-4 bg-slate-50">
                      {/* Hover Tooltip (Mock) */}
                      <div className="absolute top-4 left-4 z-10 bg-white text-black px-3 py-1.5 rounded-lg shadow-lg hidden">
                        <span className="font-bold text-sm">0.743</span>
                        <div className="text-xs text-slate-500">Feb 24, 2024</div>
                      </div>

                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '12px', padding: '12px' }}
                            itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
                            formatter={(value: number) => [value.toFixed(4), '']}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                            minTickGap={30}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            hide
                          />
                          <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="5 5" />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#ea580c"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
      
     
    </div>
  );
}
