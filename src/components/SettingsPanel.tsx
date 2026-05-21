import React, { useState, useEffect } from 'react';
import { X, Server, KeyRound, AlertCircle, CheckCircle2, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { getSavedCredentials, saveCredentials, DEFAULT_HOUSES } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Reload active client
}

export default function SettingsPanel({ isOpen, onClose, onSave }: SettingsPanelProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isSandbox, setIsSandbox] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const creds = getSavedCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setIsSandbox(false);
      setTestStatus('idle');
      setTestMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url || !anonKey) {
      setTestStatus('error');
      setTestMessage('Both Supabase URL and Anon Key are required for connection test.');
      return;
    }

    if (!url.startsWith('https://')) {
      setTestStatus('error');
      setTestMessage('The Supabase URL must start with "https://".');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Contacting Supabase API client...');

    try {
      const tempClient = createClient(url, anonKey, {
        auth: { persistSession: false }
      });
      
      // Perform a minimal lookup request to verify the key. Let's try to list houses or just select a dummy query.
      const { data, error } = await tempClient.from('houses').select('*').limit(1);
      
      if (error) {
        // Check if error is simply "relation does not exist" which means the connection succeeded but tables aren't set up yet.
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setTestStatus('success');
          setTestMessage('Connected to Supabase successfully! Note: The "houses" table was not detected or needs schema configuration, but key is valid.');
        } else {
          throw error;
        }
      } else {
        setTestStatus('success');
        setTestMessage('Excellent! Supabase connected successfully and detected your table structures.');
      }
    } catch (err: any) {
      console.error('Test connection error:', err);
      setTestStatus('error');
      setTestMessage(err?.message || 'Failed to authenticate connection. Double-check your URL and key details.');
    }
  };

  const handleSaveAndApply = () => {
    if (!isSandbox && (!url || !anonKey)) {
      setTestStatus('error');
      setTestMessage('You must supply a URL and Anon Key to disable sandbox mode, or choose Sandbox Mode instead.');
      return;
    }

    saveCredentials(url.trim(), anonKey.trim(), isSandbox);
    onSave(); // Notify parent element to reload clients
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Card */}
      <div className="relative bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-300 transform transition-all overflow-hidden z-10 max-h-[90vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Server className="h-4.5 w-4.5 text-blue-600" />
              Credentials & Supabase Settings
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Configure database connections and data environments.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          
          <div className="space-y-3">
            {/* Supabase URL */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Supabase URL
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Server className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-slate-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                />
              </div>
            </div>

            {/* Supabase Anon Key */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Supabase Anon Key
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-3.5 w-3.5" />
                </div>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-slate-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all font-mono"
                />
              </div>
            </div>

            {/* Test Action */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3 py-1.5 border border-slate-250 hover:bg-slate-50 rounded text-xs font-semibold text-slate-700 transition-all cursor-pointer flex items-center gap-1 text-[11px] disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
                ) : (
                  <RefreshCw className="h-3 w-3 text-blue-500" />
                )}
                Test Connection
              </button>
            </div>

            {/* Test Output Log Header */}
            {testMessage && (
              <div className={`p-2.5 rounded border transition-all animate-in fade-in ${
                testStatus === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : testStatus === 'error' 
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-start gap-2 text-xs">
                  {testStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                  {testStatus === 'error' && <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />}
                  {testStatus === 'testing' && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin flex-shrink-0 mt-0.5" />}
                  <span>{testMessage}</span>
                </div>
              </div>
            )}
          </div>

          {/* Table Schemas Disclaimer Banner */}
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px]">Required Supabase Schema Setup:</span>
                <p className="mt-0.5 text-[11px]">
                  Your Supabase schema must house these tables to allow real synchronization:
                </p>
                <ul className="list-disc list-inside mt-1 font-mono text-[9px] space-y-0.5 pl-0.5 text-amber-850">
                  <li><span className="font-bold">bookings</span> (columns: id, ref_number, house_id,...)</li>
                  <li><span className="font-bold">audit_log</span> (columns: id, booking_id, changed_by,...)</li>
                  <li><span className="font-bold">houses, agencies, team_leaders...</span> lookup tables</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 hover:border-slate-400 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-all cursor-pointer shadow-xs"
          >
            Apply & Save
          </button>
        </div>

      </div>
    </div>
  );
}
