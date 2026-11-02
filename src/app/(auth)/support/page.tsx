'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { type } from 'arktype';
import { motion, AnimatePresence } from 'framer-motion';

import SmartsuppTrigger from '@/components/smartsupp/SmartsuppTrigger';
import RiIcon from '@/components/ui/RiIcon';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';


const SupportNameSchema = type("string >= 2").and(type("string <= 80"));
const SupportEmailSchema = type("string.email");
const SupportSubjectSchema = type("string >= 1").and(type("string <= 80"));
const SupportMessageSchema = type("string >= 10").and(type("string <= 2000"));

const SUPPORT_SUBJECTS = [
  "General Inquiry",
  "Technical Support",
  "Billing Issue",
  "Feature Request",
] as const;

export default function SupportPage() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  const submitSupportMessage = useMutation(api.user.submitSupportMessage);

  const faqs = [
    {
      id: 1,
      question: "How do I reset my password?",
      answer: "You can reset your password by going to the Settings page > Security tab. If you're logged out, click 'Forgot Password' on the login screen."
    },
    {
      id: 2,
      question: "What are the daily transfer limits?",
      answer: "Standard accounts have a daily transfer limit of $5,000. Premium members can transfer up to $25,000 daily. You can view your specific limits in Account Details."
    },
    {
      id: 3,
      question: "How long do transfers take?",
      answer: "Internal transfers are instant. External transfers typically take 1-3 business days. Wire transfers are usually processed within 24 hours."
    },
    {
      id: 4,
      question: "Is Veltro secure?",
      answer: "Yes, we use bank-grade encryption and 24/7 fraud monitoring to protect your data and money. We also support 2FA for added security."
    }
  ];

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      subject: SUPPORT_SUBJECTS[0] as string,
      message: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitStatus('idle');
      setSubmitError(null);
      try {
        await submitSupportMessage({
          name: value.name,
          email: value.email,
          subject: value.subject,
          message: value.message,
        });
        setSubmitStatus('success');
      } catch (error) {
        setSubmitStatus('error');
        setSubmitError(error instanceof Error ? error.message : "Something went wrong");
      }
    },
  });

  useEffect(() => {
    if (submitStatus !== 'success') return;
    form.setFieldValue("name", "");
    form.setFieldValue("email", "");
    form.setFieldValue("subject", SUPPORT_SUBJECTS[0] as string);
    form.setFieldValue("message", "");
  }, [form, submitStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!subjectDropdownRef.current) return;
      if (!subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full selection:bg-primary/20">


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <RiIcon className="ri-customer-service-2-line text-3xl text-black" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900">How can we help you?</h1>
            <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our dedicated support team.
            </p>

            <div className="max-w-xl mx-auto relative">
              <RiIcon className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full bg-white/90 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-lg shadow-slate-900/10"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Cards */}
            <div className="space-y-6 lg:order-2">
              <div className="bg-white/90 border border-slate-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 border border-blue-500/20">
                  <RiIcon className="ri-chat-1-line text-2xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Live Chat</h3>
                <p className="text-slate-500 text-sm mb-4">Chat with our support team in real-time. Available 24/7.</p>
                <SmartsuppTrigger />
              </div>

              <div className="bg-white/90 border border-slate-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 border border-primary/20">
                  <RiIcon className="ri-mail-line text-2xl text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Email Support</h3>
                <p className="text-slate-500 text-sm mb-4">Send us an email and we'll get back to you within 24 hours.</p>
                <button className="w-full py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary/30">
                  support@arxforthdigital.com
                </button>
              </div>

              <div className="bg-white/90 border border-slate-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 border border-green-500/20">
                  <RiIcon className="ri-phone-line text-2xl text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">Phone Support</h3>
                <p className="text-slate-500 text-sm mb-4">Call us directly for urgent matters. Mon-Fri 9am-6pm EST.</p>
                <button className="w-full py-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500/30">
                  +1 (404) 423-0829
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-12 lg:order-1">
              {/* FAQ Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-slate-900">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/90 border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setActiveQuestion(activeQuestion === faq.id ? null : faq.id)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-lg text-slate-900">{faq.question}</span>
                        <RiIcon
                          className={`ri-arrow-down-s-line text-xl transition-transform ${activeQuestion === faq.id ? 'rotate-180 text-primary' : 'text-slate-500'}`}
                        />
                      </button>
                      <AnimatePresence>
                        {activeQuestion === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-6 pb-6 text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-8 backdrop-blur-xl shadow-2xl shadow-slate-900/10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(234,88,12,0.10)_0%,rgba(255,255,255,0)_70%)]" />
                <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-slate-50 blur-3xl" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Send us a Message</h2>
                      <p className="text-slate-500 mt-1">
                        Tell us what&apos;s going on and we&apos;ll respond within 24 hours.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                    className="space-y-6"
                  >
                    <AnimatePresence>
                      {submitStatus === 'success' ? (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2"
                        >
                          <RiIcon className="ri-checkbox-circle-line text-lg" />
                          Message received. We&apos;ll be in touch shortly.
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <AnimatePresence>
                      {submitStatus === 'error' && submitError ? (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 flex items-center gap-2"
                        >
                          <RiIcon className="ri-error-warning-line text-lg" />
                          {submitError}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <form.Field
                        name="name"
                        validators={{
                          onChange: ({ value }) => {
                            const trimmed = value.trim();
                            if (!trimmed) return "Name is required";
                            const result = SupportNameSchema(trimmed);
                            if (result instanceof type.errors) return "Use 2–80 characters";
                            return undefined;
                          },
                        }}
                        children={(field) => (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Name</label>
                            <div className="relative">
                              <RiIcon className="ri-user-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input
                                type="text"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                placeholder="Your name"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pl-11 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                              />
                            </div>
                            {field.state.meta.errors?.length ? (
                              <p className="text-xs text-red-500 pl-1">{field.state.meta.errors.join(', ')}</p>
                            ) : null}
                          </div>
                        )}
                      />
                      <form.Field
                        name="email"
                        validators={{
                          onChange: ({ value }) => {
                            const trimmed = value.trim();
                            if (!trimmed) return "Email is required";
                            const result = SupportEmailSchema(trimmed);
                            if (result instanceof type.errors) return "Enter a valid email";
                            return undefined;
                          },
                        }}
                        children={(field) => (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email</label>
                            <div className="relative">
                              <RiIcon className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input
                                type="email"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                placeholder="you@domain.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pl-11 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                              />
                            </div>
                            {field.state.meta.errors?.length ? (
                              <p className="text-xs text-red-500 pl-1">{field.state.meta.errors.join(', ')}</p>
                            ) : null}
                          </div>
                        )}
                      />
                    </div>
                    <form.Field
                      name="subject"
                      validators={{
                        onChange: ({ value }) => {
                          const trimmed = value.trim();
                          if (!trimmed) return "Subject is required";
                          const result = SupportSubjectSchema(trimmed);
                          if (result instanceof type.errors) return "Use 1–80 characters";
                          return undefined;
                        },
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Subject</label>
                          <div className="relative z-40" ref={subjectDropdownRef}>
                            <RiIcon className="ri-price-tag-3-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <button
                              type="button"
                              onClick={() => setIsSubjectOpen((v) => !v)}
                              onBlur={field.handleBlur}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pl-11 py-3 text-slate-900 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors appearance-none text-left hover:bg-slate-100"
                            >
                              {field.state.value}
                            </button>
                            <button
                              type="button"
                              aria-hidden="true"
                              tabIndex={-1}
                              onClick={() => setIsSubjectOpen((v) => !v)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <RiIcon
                                className={`ri-arrow-down-s-line text-slate-500 transition-transform duration-200 ${isSubjectOpen ? 'rotate-180' : ''}`}
                              />
                            </button>

                            <AnimatePresence>
                              {isSubjectOpen ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  transition={{ duration: 0.18 }}
                                  className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                                >
                                  <div className="p-1">
                                    {SUPPORT_SUBJECTS.map((s) => {
                                      const selected = field.state.value === s;
                                      return (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => {
                                            field.handleChange(s);
                                            setIsSubjectOpen(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${selected
                                              ? "bg-primary/10 text-primary"
                                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                          <span className="text-sm font-medium">{s}</span>
                                          {selected ? (
                                            <RiIcon className="ri-check-line text-primary" />
                                          ) : null}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                          {field.state.meta.errors?.length ? (
                            <p className="text-xs text-red-500 pl-1">{field.state.meta.errors.join(', ')}</p>
                          ) : null}
                        </div>
                      )}
                    />

                    <form.Field
                      name="message"
                      validators={{
                        onChange: ({ value }) => {
                          const trimmed = value.trim();
                          if (!trimmed) return "Message is required";
                          const result = SupportMessageSchema(trimmed);
                          if (result instanceof type.errors) return "Use 10–2000 characters";
                          return undefined;
                        },
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Message</label>
                          <div className="relative">
                            <RiIcon className="ri-pencil-line absolute left-4 top-4 text-slate-500" />
                            <textarea
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              rows={5}
                              placeholder="What can we help with?"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 pl-11 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                            ></textarea>
                          </div>
                          {field.state.meta.errors?.length ? (
                            <p className="text-xs text-red-500 pl-1">{field.state.meta.errors.join(', ')}</p>
                          ) : null}
                        </div>
                      )}
                    />

                    <form.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                      children={([canSubmit, isSubmitting]) => (
                        <motion.button
                          whileHover={{ scale: 1.01, boxShadow: "0 20px 40px -10px rgba(234,88,12,0.25)" }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={!canSubmit || isSubmitting}
                          className="w-full py-4 bg-gradient-to-r from-primary via-orange-400 to-primary text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                          {isSubmitting ? (
                            <>
                              <RiIcon className="ri-loader-4-line animate-spin text-xl" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <span>Send Message</span>
                              <RiIcon className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-6"></div>
                        </motion.button>
                      )}
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>

        </div>

    </div>
  );
}

