import React from 'react';
import { X, History, User, CheckCircle, Tag, ScrollText, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { AuditLogItem } from '../types';

interface AuditLogViewProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogItem[];
}

export default function AuditLogView({ isOpen, onClose, logs }: AuditLogViewProps) {
  if (!isOpen) return null;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const getFieldIcon = (field: string) => {
    const fLower = field.toLowerCase();
    if (fLower.includes('date')) return <Calendar className="h-4 w-4 text-blue-500" />;
    if (fLower.includes('time')) return <Clock className="h-4 w-4 text-amber-500" />;
    if (fLower.includes('status')) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (fLower.includes('staff')) return <User className="h-4 w-4 text-blue-500" />;
    return <Tag className="h-4 w-4 text-slate-500" />;
  };

  const readableFieldName = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-all duration-300 animate-slide-in-from-right">
            
            {/* Drawer Header */}
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              <div className="px-5 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 animate-in">
                    <History className="h-4.5 w-4.5 text-blue-600" />
                    Database Audit Trail History
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Automated tracking history logged in `audit_log` table.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded px-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="relative flex-1 px-6 py-6 pb-20">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <ScrollText className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No logs generated yet</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Editing fields inside any booking triggers record logs saved to the database.
                    </p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {logs.map((log, index) => (
                        <li key={log.id || index}>
                          <div className="relative pb-8">
                            {/* Line connecting milestones */}
                            {index !== logs.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                            ) : null}

                            <div className="relative flex space-x-3">
                              {/* Left icon wrapper */}
                              <div>
                                <span className="h-8.5 w-8.5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                                  {getFieldIcon(log.field_name)}
                                </span>
                              </div>

                              {/* Right textual description */}
                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-1">
                                  <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-sm">
                                    {log.booking_ref || 'BK-...'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {formatDate(log.changed_at)}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 mt-1">
                                  <span className="font-bold text-slate-800">{readableFieldName(log.field_name)}</span> field updated by{' '}
                                  <span className="font-medium text-slate-700 underline decoration-slate-300 decoration-dotted">
                                    {log.changed_by}
                                  </span>
                                </p>

                                {/* Old to New Values comparator layout */}
                                <div className="mt-2 text-[11px] grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100/50 font-mono">
                                  <div>
                                    <span className="block text-[8px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Old Value</span>
                                    <span className="text-rose-700 block overflow-x-auto select-all whitespace-pre-wrap leading-tight">
                                      {log.old_value !== null && log.old_value !== undefined && log.old_value !== '' ? log.old_value : '[Empty]'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">New Value</span>
                                    <span className="text-emerald-700 block overflow-x-auto select-all whitespace-pre-wrap leading-tight">
                                      {log.new_value !== null && log.new_value !== undefined && log.new_value !== '' ? log.new_value : '[Empty]'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
