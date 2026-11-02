'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { type } from 'arktype';
import { useMutation, useAction, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { useForm } from '@tanstack/react-form'
import RiIcon from '@/src/components/ui/RiIcon';
import { BrandLockup } from '@/src/components/auth/AuthShell';
import PhoneInput from '@/src/components/ui/PhoneInput';
import CountrySelect from '@/src/components/ui/CountrySelect';
import CurrencySelect from '@/src/components/ui/CurrencySelect';
import LanguageSelect from '@/src/components/ui/LanguageSelect';

const NameSchema = type('string >= 1').and(type('string <= 40'));
const PhoneSchema = type(/^\d{7,15}$/);
const DobSchema = type(/^\d{4}-\d{2}-\d{2}$/);
const CountrySchema = type('string >= 2').and(type('string <= 56'));
const CitySchema = type('string >= 1').and(type('string <= 56'));
const AddressSchema = type('string >= 3').and(type('string <= 120'));
const ZipSchema = type('string >= 3').and(type('string <= 16'));
const OccupationSchema = type('string >= 2').and(type('string <= 60'));
const CurrencySchema = type(/^(USD|EUR|GBP|JPY|CNY|INR|CAD|AUD|CHF|NGN|BRL|RUB|KRW|ZAR|SEK|NOK|DKK|SGD|HKD|NZD|MXN|ARS|TRY|AED|SAR)$/);
const LanguageSchema = type(/^(English|Spanish|French|German|Chinese|Japanese|Korean|Italian|Portuguese|Russian|Arabic|Hindi|Turkish|Dutch|Swedish|Indonesian|Vietnamese|Thai)$/);

const normalizePhone = (value: string) => value.replace(/[^\d]/g, '').slice(0, 15);

const getStringError = (result: unknown, fallback: string) => {
  if (result instanceof type.errors) {
    return result.summary.split('\n')[0]?.replace(/^◦\s*/, '').trim() || fallback;
  }
  return null;
};


export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [showStepErrors, setShowStepErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const identity = useQuery(api.auth.getCurrentUser);
  const createUser = useMutation(api.user.createUser);
  const ensureUserAccounts = useMutation(api.accounts.ensureUserAccounts);
  const ensureDefaultCard = useMutation(api.creditCards.ensureDefaultCard);
  const provisionUserCryptoVault = useAction(api.actions.wallet.generate.provisionUserCryptoVault);

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dob: '2004-04-04',
      country: '',
      city: '',
      address: '',
      zipCode: '',
      occupation: '',
      currency: 'USD',
      language: 'English',
    },
    onSubmit: async ({ value }) => {
      if (!identity?.email) return;
      const phoneDigits = normalizePhone(value.phoneNumber);
      const phonenumber = phoneDigits ? Number(phoneDigits) : undefined;
      await createUser({
        email: identity?.email,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        phonenumber,
        dob: value.dob,
        country: value.country.trim(),
        city: value.city.trim(),
        address: value.address.trim(),
        zipCode: value.zipCode.trim(),
        occupation: value.occupation.trim(),
        currency: value.currency,
        language: value.language,
      });
      await Promise.all([
        ensureUserAccounts({}),
        ensureDefaultCard({}),
        provisionUserCryptoVault({}),
      ]);
      router.push('/home')
    },
  });

  const validateStep = (nextStep: number) => {
    const v = form.state.values;
    if (nextStep === 2) {
      const phoneDigits = normalizePhone(v.phoneNumber);
      const phoneError = phoneDigits
        ? getStringError(PhoneSchema(phoneDigits), 'Enter a valid phone number')
        : 'Phone number is required';
      const errors = [
        getStringError(NameSchema(v.firstName.trim()), 'First name is required'),
        getStringError(NameSchema(v.lastName.trim()), 'Last name is required'),
        phoneError,
        getStringError(DobSchema(v.dob), 'Enter a valid date of birth'),
        getStringError(OccupationSchema(v.occupation.trim()), 'Occupation is required'),
      ].filter(Boolean);
      return errors.length === 0;
    }
    if (nextStep === 3) {
      const errors = [
        getStringError(CountrySchema(v.country.trim()), 'Country is required'),
        getStringError(CitySchema(v.city.trim()), 'City is required'),
        getStringError(ZipSchema(v.zipCode.trim()), 'Zip code is required'),
        getStringError(AddressSchema(v.address.trim()), 'Address is required'),
      ].filter(Boolean);
      return errors.length === 0;
    }
    if (nextStep === 4) {
      const errors = [
        getStringError(CurrencySchema(v.currency), 'Select a currency'),
        getStringError(LanguageSchema(v.language), 'Select a language'),
      ].filter(Boolean);
      return errors.length === 0;
    }
    return true;
  };

  const handleNext = () => {
    const nextStep = step + 1;
    const ok = validateStep(nextStep);

    if (!ok) {
      setShowStepErrors(true);
      return;
    }

    setShowStepErrors(false);

    if (step < totalSteps) {
      setStep(nextStep);
    } else if (step === totalSteps) {
      setLoading(true)
      void form.handleSubmit();
    }
    else {
      return;
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setShowStepErrors(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field
                name="firstName"
                children={(field) => {
                  const error = getStringError(NameSchema(field.state.value.trim()), 'First name is required');
                  const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                  return (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-night/60">First Name</label>
                      <div className="relative">
                        <RiIcon className="ri-user-line absolute left-4 top-1/2 -translate-y-1/2 text-night/40" />
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="John"
                          className="w-full pl-11 px-4 py-3 bg-white border border-night/15 rounded-2xl text-sm font-medium text-night placeholder:text-night/40 focus:outline-none focus:ring-2 focus:ring-signal/25 focus:border-signal transition-all shadow-sm"
                        />
                      </div>
                      {showError && error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                  );
                }}
              />
              <form.Field
                name="lastName"
                children={(field) => {
                  const error = getStringError(NameSchema(field.state.value.trim()), 'Last name is required');
                  const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                  return (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-night/60">Last Name</label>
                      <div className="relative">
                        <RiIcon className="ri-user-line absolute left-4 top-1/2 -translate-y-1/2 text-night/40" />
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Doe"
                          className="w-full pl-11 px-4 py-3 bg-white border border-night/15 rounded-2xl text-sm font-medium text-night placeholder:text-night/40 focus:outline-none focus:ring-2 focus:ring-signal/25 focus:border-signal transition-all shadow-sm"
                        />
                      </div>
                      {showError && error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                  );
                }}
              />
            </div>

            <form.Field
              name="phoneNumber"
              children={(field) => {
                const digits = normalizePhone(field.state.value);
                const error = digits
                  ? getStringError(PhoneSchema(digits), 'Enter a valid phone number')
                  : 'Phone number is required';
                const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                return (
                  <div>
                    <PhoneInput
                      className="bg-white"
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                    />
                    {
                      showError && error && <p className="text-xs text-red-500">{error}</p>
                    }
                  </div>
                );
              }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field
                name="dob"
                children={(field) => {
                  const error = getStringError(DobSchema(field.state.value), 'Enter a valid date of birth');
                  const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                  return (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-night/60">Date of Birth</label>
                      <div className="relative">
                        <RiIcon className="ri-calendar-line absolute left-4 top-1/2 -translate-y-1/2 text-night/40" />
                        <input
                          type="date"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="w-full pl-11 px-4 py-3 bg-white border border-night/15 rounded-2xl text-sm font-medium text-night placeholder:text-night/40 focus:outline-none focus:ring-2 focus:ring-signal/25 focus:border-signal transition-all shadow-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        />
                      </div>
                      {showError && error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                  );
                }}
              />

              <form.Field
                name="occupation"
                children={(field) => {
                  const error = getStringError(
                    OccupationSchema(field.state.value.trim()),
                    'Occupation is required',
                  );
                  const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                  return (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-night/60">Occupation</label>
                      <div className="relative">
                        <RiIcon className="ri-briefcase-line absolute left-4 top-1/2 -translate-y-1/2 text-night/40" />
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Software Engineer"
                          className="w-full pl-11 px-4 py-3 bg-white border border-night/15 rounded-2xl text-sm font-medium text-night placeholder:text-night/40 focus:outline-none focus:ring-2 focus:ring-signal/25 focus:border-signal transition-all shadow-sm"
                        />
                      </div>
                      {showError && error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                  );
                }}
              />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-5"
          >
            <form.Field
              name="country"
              children={(field) => {
                const error = getStringError(CountrySchema(field.state.value.trim()), 'Country is required');
                const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                return (
                  <div>
                    <CountrySelect
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                    />
                    {showError && error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                );
              }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field
                name="city"
                children={(field) => {
                  const error = getStringError(CitySchema(field.state.value.trim()), 'City is required');
                  const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                  return (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-night/60">City</label>
                      <div className="relative">
                        <RiIcon className="ri-building-line absolute left-4 top-1/2 -translate-y-1/2 text-night/40" />
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="New York"
                          className="w-full pl-11 px-4 py-3 bg-white border border-night/15 rounded-2xl text-sm font-medium text-night placeholder:text-night/40 focus:outline-none focus:ring-2 focus:ring-signal/25 focus:border-signal transition-all shadow-sm"
                        />
                      </div>
                      {showError && error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                  );
                }}
              />
              <form.Field
                name="zipCode"
                children={(field) => {
                  const error = getStringError(ZipSchema(field.state.value.trim()), 'Zip code is required');
                  const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                  return (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-night/60">Zip Code</label>
                      <div className="relative">
                        <RiIcon className="ri-map-pin-line absolute left-4 top-1/2 -translate-y-1/2 text-night/40" />
                        <input
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="10001"
                          className="w-full pl-11 px-4 py-3 bg-white border border-night/15 rounded-2xl text-sm font-medium text-night placeholder:text-night/40 focus:outline-none focus:ring-2 focus:ring-signal/25 focus:border-signal transition-all shadow-sm"
                        />
                      </div>
                      {showError && error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                  );
                }}
              />
            </div>

            <form.Field
              name="address"
              children={(field) => {
                const error = getStringError(AddressSchema(field.state.value.trim()), 'Address is required');
                const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-night/60">Address</label>
                    <div className="relative">
                      <RiIcon className="ri-home-line absolute left-4 top-1/2 -translate-y-1/2 text-night/40" />
                      <input
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="123 Main St, Apt 4B"
                        className="w-full pl-11 px-4 py-3 bg-white border border-night/15 rounded-2xl text-sm font-medium text-night placeholder:text-night/40 focus:outline-none focus:ring-2 focus:ring-signal/25 focus:border-signal transition-all shadow-sm"
                      />
                    </div>
                    {showError && error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                );
              }}
            />
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-5"
          >
            <form.Field
              name="currency"
              children={(field) => {
                const error = getStringError(CurrencySchema(field.state.value), 'Select a currency');
                const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                return (
                  <div>
                    <CurrencySelect
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                    />
                    {showError && error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                );
              }}
            />

            <form.Field
              name="language"
              children={(field) => {
                const error = getStringError(LanguageSchema(field.state.value), 'Select a language');
                const showError = showStepErrors || Boolean(field.state.meta.isTouched);
                return (
                  <div>
                    <LanguageSelect
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                    />
                    {showError && error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                );
              }}
            />

            <div className="p-4 rounded-xl bg-signal/10 border border-signal/20 flex gap-3 items-start mt-6">
              <RiIcon className="ri-shield-check-line text-signal text-xl mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-night">Data Privacy</h4>
                <p className="text-night/60 text-xs mt-1">
                  Your information is securely stored and used only for account verification purposes in compliance with financial regulations.
                </p>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const stepLabels = ["Identity", "Address", "Preferences"] as const;
  const currentStepLabel = stepLabels[step - 1] ?? "Preferences";

  return (
    <main className="auth-shell min-h-dvh w-full overflow-y-auto bg-paper-deep font-sans text-night">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="relative overflow-hidden rounded-[2rem] border border-night/10 bg-paper p-6 shadow-[0_24px_80px_-48px_rgba(11,11,11,0.45)] sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-signal/15 blur-[90px]"
          />

          <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <BrandLockup />
              <span className="rounded-full border border-night/10 bg-white/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-night/60">
                Secure onboarding
              </span>
            </div>

            <header className="flex flex-col items-center gap-2 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                Step {step} of {totalSteps} · {currentStepLabel}
              </p>
              <h1 className="text-[clamp(1.9rem,4vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.035em] text-night">
                Complete your profile
              </h1>
              <p className="mx-auto max-w-md text-sm leading-6 text-night/60">
                Tell us a bit about yourself so we can finish setting up your Veltro account.
              </p>
            </header>

            <div
              role="progressbar"
              aria-label="Onboarding progress"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={step}
              className="h-1.5 w-full overflow-hidden rounded-full bg-night/10"
            >
              <motion.div
                className="h-full rounded-full bg-signal"
                initial={{ width: `${((step - 1) / totalSteps) * 100}%` }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

            <div className="flex flex-col gap-3 border-t border-night/10 pt-5 sm:flex-row sm:gap-4 sm:pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 rounded-2xl border border-night/15 bg-white px-4 py-3 text-sm font-semibold text-night/70 shadow-sm outline-none transition-colors hover:border-night/30 hover:bg-paper-deep/50 focus-visible:ring-2 focus-visible:ring-signal"
                >
                  Back
                </button>
              )}
              {step === totalSteps ? (
                <button
                  type="button"
                  onClick={() => handleNext()}
                  disabled={form.state.isSubmitting}
                  className="flex-1 rounded-2xl bg-signal px-4 py-3 text-sm font-semibold text-night outline-none transition-colors hover:bg-signal-bright focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Finish setup'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNext()}
                  className="flex-1 rounded-2xl bg-signal px-4 py-3 text-sm font-semibold text-night outline-none transition-colors hover:bg-signal-bright focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  Continue
                </button>
              )}
            </div>

            <p className="text-center text-xs leading-5 text-night/60">
              By continuing, you agree to our{' '}
              <Link
                href="/terms"
                className="font-medium text-night underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:text-signal"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="font-medium text-night underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:text-signal"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
