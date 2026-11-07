import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 text-neutral-900">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl bg-white border border-neutral-200 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-xl">
              F
            </div>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
            Reset Password
          </h2>
          <p className="text-xs text-neutral-500">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="p-5 rounded-xl bg-neutral-100 border border-neutral-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-black mx-auto" />
            <h3 className="text-sm font-bold text-neutral-950">Reset Request Received</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              If an account with <strong className="text-black">{email}</strong> exists, password reset instructions have been dispatched.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs font-bold text-black underline"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 text-sm font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all shadow-subtle"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-neutral-200 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-black"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
