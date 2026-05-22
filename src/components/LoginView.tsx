import React, { useState } from 'react';
import { KeyRound, Mail, Lock, ShieldCheck, AlertCircle, Database, Phone, Settings, Sparkles, Sliders } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import OptionsLogo from './OptionsLogo';
import { getPortalUsers, savePortalUsers } from '../lib/supabase';
import { PortalUser } from '../types';

interface LoginViewProps {
  supabase: SupabaseClient | null;
  onLoginSuccess: (email: string) => void;
  onOpenSettings: () => void;
  // Accessibility props
  fontScale: 'normal' | 'large' | 'extra-large';
  setFontScale: (scale: 'normal' | 'large' | 'extra-large') => void;
  dyslexicFont: boolean;
  setDyslexicFont: (enabled: boolean) => void;
  activeTheme: 'options-mint' | 'options-purple' | 'slate';
  setActiveTheme: (theme: 'options-mint' | 'options-purple' | 'slate') => void;
}

export default function LoginView({
  supabase,
  onLoginSuccess,
  onOpenSettings,
  fontScale,
  setFontScale,
  dyslexicFont,
  setDyslexicFont,
  activeTheme,
  setActiveTheme,
}: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorNotice('Please fill in all email and password fields.');
      return;
    }
    if (password.length < 6) {
      setErrorNotice('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    // 1. Intercept custom registered users (such as Ian, Ben Simpson, or database managers added via dashboard)
    const localUsers = getPortalUsers();
    const matched = localUsers.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (matched) {
      if (password === matched.password) {
        onLoginSuccess(matched.email);
        setLoading(false);
        return;
      } else {
        setErrorNotice('Incorrect password for this registered system user. Please verify password details.');
        setLoading(false);
        return;
      }
    }

    // 2. Fallback to Supabase if not found in custom user list
    if (!supabase) {
      setErrorNotice('Account email is not registered in the system team roster, and direct Supabase database connector is offline. Setup credentials or log in with fallback sandbox.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Log in locally as well
        const newUser: PortalUser = {
          id: 'u-' + Date.now(),
          email: email.trim(),
          password: password,
          role: 'manager',
          created_at: new Date().toISOString()
        };
        const updatedUsers = [...localUsers, newUser];
        savePortalUsers(updatedUsers);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user && data.session) {
          onLoginSuccess(data.user.email || email);
        } else {
          setSuccessNotice('Registration successful on cloud backend as well! Check mailbox or click local sandbox options to start immediately.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        if (data.user) {
          onLoginSuccess(data.user.email || email);
        }
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      const isConfirmErr = err.message?.toLowerCase().includes('confirm') || false;
      const isCredsErr = err.message?.toLowerCase().includes('credential') || err.message?.toLowerCase().includes('invalid') || false;
      
      if (isConfirmErr) {
        setErrorNotice('Email address has not been confirmed yet. Please verify your email or click the bypass sandbox link below to start testing right away.');
      } else if (isCredsErr) {
        setErrorNotice('Invalid login credentials provided. Double-check your details, register a new manager account, or click the offline sandbox option below to proceed.');
      } else {
        setErrorNotice(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine accent color theme for main CTA buttons
  const getButtonStyles = () => {
    if (activeTheme === 'options-mint') {
      return 'bg-[#AEFFE1] hover:bg-[#8affd3] text-slate-950 font-black border border-emerald-300 ring-offset-2 hover:shadow-xs';
    }
    if (activeTheme === 'options-purple') {
      return 'bg-violet-600 hover:bg-violet-700 text-white font-extrabold shadow-sm border border-violet-700';
    }
    return 'bg-slate-900 hover:bg-slate-800 text-white font-extrabold border border-slate-950';
  };

  return (
    <div id="login-screen" className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans transition-all">
      
      {/* Black Web-Style Accessibility top bar */}
      <header className="bg-slate-950 text-white py-2.5 px-4 text-xs shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">
              OPTIONS Trust Affiliate portal
            </span>
            <span className="bg-[#AEFFE1]/20 text-[#AEFFE1] text-[9px] px-2 py-0.5 rounded-full border border-[#AEFFE1]/30 font-bold">
              Disability Support System
            </span>
          </div>
          
          {/* Sizing & font Controls (A A A) styled matching the screen-shot */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded border border-zinc-700">
              <button
                type="button"
                onClick={() => setFontScale('normal')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  fontScale === 'normal' ? 'bg-white text-zinc-950 shadow-sm scale-105' : 'text-zinc-400 hover:text-white'
                }`}
                title="Normal Text"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontScale('large')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  fontScale === 'large' ? 'bg-white text-zinc-950 shadow-sm scale-105' : 'text-zinc-400 hover:text-white'
                }`}
                title="Large Text (115%)"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontScale('extra-large')}
                className={`px-2 py-0.5 rounded text-sm font-bold transition-all ${
                  fontScale === 'extra-large' ? 'bg-white text-zinc-950 shadow-sm scale-105' : 'text-zinc-400 hover:text-white'
                }`}
                title="Extra Large Text (130%)"
              >
                A++
              </button>
            </div>

            <div className="h-4 w-[1px] bg-zinc-800" />

            {/* Dyslexia Toggler */}
            <button
              type="button"
              onClick={() => setDyslexicFont(!dyslexicFont)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                dyslexicFont 
                  ? 'bg-purple-100 text-purple-950 border-purple-300' 
                  : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Dyslexia
            </button>

            <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

            {/* Themes */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTheme('options-mint')}
                className={`w-3.5 h-3.5 rounded-full bg-[#AEFFE1] transition-all hover:scale-110 ${
                  activeTheme === 'options-mint' ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : 'opacity-60'
                }`}
                title="Mint Theme (Options Group style)"
              />
              <button
                type="button"
                onClick={() => setActiveTheme('options-purple')}
                className={`w-3.5 h-3.5 rounded-full bg-violet-500 transition-all hover:scale-110 ${
                  activeTheme === 'options-purple' ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : 'opacity-60'
                }`}
                title="Vibrant Purple Theme"
              />
              <button
                type="button"
                onClick={() => setActiveTheme('slate')}
                className={`w-3.5 h-3.5 rounded-full bg-slate-500 transition-all hover:scale-110 ${
                  activeTheme === 'slate' ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : 'opacity-60'
                }`}
                title="Classic Slate Theme"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="my-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          
          {/* Logo and Slogan Header card styled exactly like Options website */}
          <div className="bg-white rounded-t-2xl border-t border-x border-slate-200 p-6 flex flex-col sm:flex-row items-center gap-4 justify-between shadow-xs">
            <OptionsLogo />
            
            {/* Phone contact and branding detail */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right text-slate-800">
              <a href="tel:01512360855" className="flex items-center gap-1 text-sm font-extrabold text-slate-900 hover:underline">
                <Phone className="h-3.5 w-3.5 text-slate-900" />
                0151 236 0855
              </a>
              <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">
                Liverpool & Northwest Trust
              </span>
            </div>
          </div>

          {/* Form wrapper */}
          <div className="bg-white py-6 px-6 sm:px-8 border border-slate-200 rounded-b-2xl shadow-md space-y-5">
            
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Agency Cover Portal
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect and coordinate cover staff shifts for disabled clients across services houses.
              </p>
            </div>

            {/* DB Connector indicator */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="flex items-center text-slate-700 font-semibold">
                <Database className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Sync Status: <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">Active Database</span>
              </span>
              <button
                onClick={onOpenSettings}
                type="button"
                className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer underline flex items-center gap-1 text-[11px]"
              >
                <Sliders className="h-3 w-3 inline text-slate-500" />
                API Credentials
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAuth}>
              {errorNotice && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex">
                      <AlertCircle className="h-4.5 w-4.5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="ml-2 text-xs font-semibold text-red-950">
                        {errorNotice}
                      </div>
                    </div>
                    
                    {/* Dynamic assistance buttons for invalid credentials or unconfirmed users */}
                    <div className="bg-white/80 p-2.5 rounded-md border border-red-200/50 space-y-2 mt-1">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                        ⚠️ Test Environment Fallback
                      </p>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        If your Options email is not registered yet on this database instance, you can bypass and log in using Local Safe Sandbox.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          // Force switch sandbox and log in
                          const resolvedEmail = email.trim() || 'manager@optionsempowers.org.uk';
                          localStorage.setItem('agency_booking_sandbox_enabled', 'true');
                          // Also store user email
                          onLoginSuccess(resolvedEmail);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-900 text-white rounded font-black text-[10.5px] uppercase tracking-wider hover:bg-slate-800 cursor-pointer transition-all border border-slate-950"
                      >
                        ⚡ Log In & Use Local Sandbox Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {successNotice && (
                <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-250">
                  <div className="flex">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                    <div className="ml-2 text-xs font-semibold text-emerald-805">
                      {successNotice}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Manager Email Address
                </label>
                <div className="relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="leader@optionsempowers.org.uk"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded-lg text-slate-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-xs transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Secure Password
                </label>
                <div className="relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded-lg text-slate-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-xs transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer ${getButtonStyles()}`}
                >
                  {loading ? 'Validating Account...' : (isSignUp ? 'Generate Custom Account' : 'Authenticate Manager Sign-In')}
                </button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                type="button"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition-all cursor-pointer"
              >
                {isSignUp ? "Already have a login? Sign Instead" : "Need portal permission? Register login"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Footer matching Options design styling and details */}
      <footer className="bg-slate-100 py-4 px-4 border-t border-slate-250 text-center text-[10px] text-slate-500 font-semibold tracking-wide flex justify-center items-center gap-1">
        <span>© 2026 Options for People with Disabilities.</span>
        <span className="hidden sm:inline">Registered Charity No. 1063388.</span>
      </footer>

    </div>
  );
}
