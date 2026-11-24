import React, { useState } from 'react';
import { CheckCircle2, Copy, Mail, Send, X } from 'lucide-react';
import { PORTFOLIO_OWNER } from '../data/portfolioData';
import { ContactPayload, validateContactPayload } from '../world/worldLogic';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ open, onClose }) => {
  const [form, setForm] = useState<ContactPayload>({
    name: '',
    email: '',
    organization: '',
    roleType: 'Systems / AI Engineering Role',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactPayload, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    id: string;
    deliveredVia: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const check = validateContactPayload(form);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.errors) setErrors(json.errors);
        setServerError(json.error || 'Could not send message. Please try direct email.');
      } else {
        setSubmittedResult({
          id: json.id || 'dispatched',
          deliveredVia: json.deliveredVia || 'logged',
        });
      }
    } catch {
      setServerError('Network offline or server unavailable. Use direct email below.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(PORTFOLIO_OWNER.email).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(7, 11, 20, 0.80)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 shadow-2xl p-6"
        style={{ backgroundColor: '#0f1724' }}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2
              id="contact-modal-title"
              className="text-xl font-bold text-slate-50"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Recruiter & Collaboration Contact
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Direct notification to {PORTFOLIO_OWNER.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact form"
            className="w-9 h-9 rounded-lg border border-white/12 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {submittedResult ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-slate-50">
                Inquiry Dispatched to Aashish
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Thank you, {form.name}. Your message has been queued for{' '}
              <span className="text-slate-100 font-medium">{PORTFOLIO_OWNER.email}</span>{' '}
              (reference <span className="font-mono text-xs">{submittedResult.id}</span>).
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedResult(null);
                  setForm({
                    name: '',
                    email: '',
                    organization: '',
                    roleType: 'Systems / AI Engineering Role',
                    message: '',
                  });
                }}
                className="px-4 py-2 rounded-lg border border-white/15 text-xs font-medium text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                Send Another Note
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                Return to 3D World
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recruiter-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Name
                </label>
                <input
                  id="recruiter-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Priya Sharma"
                  className="w-full rounded-lg border border-white/15 bg-[#152033] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="recruiter-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Work Email
                </label>
                <input
                  id="recruiter-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="priya@company.com"
                  className="w-full rounded-lg border border-white/15 bg-[#152033] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recruiter-org" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company / Team (Optional)
                </label>
                <input
                  id="recruiter-org"
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="Acme Systems"
                  className="w-full rounded-lg border border-white/15 bg-[#152033] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label htmlFor="recruiter-role" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Inquiry Focus
                </label>
                <select
                  id="recruiter-role"
                  value={form.roleType}
                  onChange={(e) => setForm({ ...form, roleType: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-[#152033] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Systems / AI Engineering Role">Systems / AI Engineering Role</option>
                  <option value="Full-Stack Developer Role">Full-Stack Developer Role</option>
                  <option value="Open-Source Collaboration">Open-Source Collaboration</option>
                  <option value="Research / Consulting">Research / Consulting</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="recruiter-message" className="block text-xs font-medium text-slate-300 mb-1.5">
                Message
              </label>
              <textarea
                id="recruiter-message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Share role details, timeline, or engineering problems you're hiring for..."
                className="w-full rounded-lg border border-white/15 bg-[#152033] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-rose-400" role="alert">
                  {errors.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-xs text-rose-400" role="alert">
                {serverError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${PORTFOLIO_OWNER.email}?subject=${encodeURIComponent(
                    `[${form.roleType}] Portfolio Inquiry`,
                  )}`}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-300"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Email App</span>
                </a>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-amber-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copied ? 'Copied' : 'Copy Email'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Sending...' : 'Send Notification'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
