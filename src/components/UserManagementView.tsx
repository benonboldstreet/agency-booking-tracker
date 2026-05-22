import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, X, Key, Check, AlertCircle } from 'lucide-react';
import { PortalUser } from '../types';
import { getPortalUsers, savePortalUsers } from '../lib/supabase';

interface UserManagementViewProps {
  onClose: () => void;
  currentUserEmail: string;
}

export default function UserManagementView({ onClose, currentUserEmail }: UserManagementViewProps) {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'manager'>('manager');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  useEffect(() => {
    // Load users on mount
    setUsers(getPortalUsers());
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);

    const emailTrimmed = newEmail.trim();
    const passwordTrimmed = newPassword.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setErrorText('Please specify both an email address and password.');
      return;
    }

    if (passwordTrimmed.length < 6) {
      setErrorText('Password must be at least 6 characters in length.');
      return;
    }

    // Check if user already exists
    if (users.some(u => u.email.toLowerCase() === emailTrimmed.toLowerCase())) {
      setErrorText('User account with this email is already registered.');
      return;
    }

    const newUser: PortalUser = {
      id: 'u-' + Date.now(),
      email: emailTrimmed,
      password: passwordTrimmed,
      role: newRole,
      created_at: new Date().toISOString()
    };

    const updated = [...users, newUser];
    setUsers(updated);
    savePortalUsers(updated);

    // Reset inputs
    setNewEmail('');
    setNewPassword('');
    setNewRole('manager');
    setSuccessText(`Successfully added "${emailTrimmed}" to system roster!`);
  };

  const handleDeleteUser = (id: string, email: string) => {
    setErrorText(null);
    setSuccessText(null);

    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      setErrorText('For security, you cannot delete your own active super admin account.');
      return;
    }

    if (window.confirm(`Are you sure you want to completely revoke credentials for: ${email}?`)) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      savePortalUsers(updated);
      setSuccessText(`Revoked credentials for ${email}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Card Container */}
      <div className="relative bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-300 transform transition-all max-h-[90vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Team Portal Logins & Credentials
              </h3>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                Super Admin: Secure Account Registry
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Panel (Divided into Form and List) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {errorText && (
            <div className="rounded-lg bg-red-50 p-2.5 border border-red-200 flex items-start gap-2 text-xs font-semibold text-red-950">
              <AlertCircle className="h-4.5 w-4.5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-250 flex items-start gap-2 text-xs font-semibold text-emerald-900">
              <Check className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0 mt-0.5 animate-bounce" />
              <span>{successText}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: Add User form */}
            <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                Add New Login
              </h4>

              <form onSubmit={handleAddUser} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Login Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@optionsempowers.org.uk"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="block w-full px-2.5 py-1.5 border border-slate-300 bg-white focus:bg-white rounded-lg text-slate-950 text-xs transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Password (Min 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-2.5 py-1.5 border border-slate-300 bg-white focus:bg-white rounded-lg text-slate-950 text-xs transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    System Permission Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="block w-full px-2.5 py-1.5 border border-slate-300 bg-white focus:bg-white rounded-lg text-slate-950 text-xs transition-all font-bold"
                  >
                    <option value="manager">Manager (Enters and logs shift bookings)</option>
                    <option value="super_admin">Super Admin (Roster control & adds users)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-[10.5px] tracking-wider rounded-lg border border-emerald-700 shadow-sm cursor-pointer transition-all mt-4"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Register Custom User
                </button>
              </form>
            </div>

            {/* Right: Active User list */}
            <div className="md:col-span-7 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-205 pb-2">
                <Users className="h-4 w-4 text-slate-500" />
                Active Registered Users ({users.length})
              </h4>

              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[9px] font-black text-slate-500 uppercase tracking-wider">User Info</th>
                      <th className="px-3 py-2 text-left text-[9px] font-black text-slate-500 uppercase tracking-wider">Permission</th>
                      <th className="px-3 py-2 text-right text-[9px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 text-xs">
                    {users.map((u) => {
                      const isCurrent = u.email.toLowerCase() === currentUserEmail.toLowerCase();
                      return (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5">
                            <div className="font-extrabold text-slate-900 truncate max-w-[180px]" title={u.email}>
                              {u.email}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400 mt-0.5">
                              <Key className="h-2.5 w-2.5 flex-shrink-0" />
                              <span>pw: <strong className="text-slate-600 font-bold">{u.password || 'cloud_auth'}</strong></span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                              u.role === 'super_admin'
                                ? 'bg-purple-55 text-purple-700 border-purple-200 bg-purple-50'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              <Shield className="h-2.5 w-2.5 mr-1" />
                              {u.role === 'super_admin' ? 'Super Admin' : 'Manager'}
                            </span>
                            {isCurrent && (
                              <span className="block text-[8px] text-teal-600 font-extrabold uppercase mt-1">You</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className={`p-1 rounded-md transition-all text-slate-400 ${
                                isCurrent
                                  ? 'opacity-30 cursor-not-allowed'
                                  : 'hover:text-red-650 hover:bg-red-50 hover:text-red-500 cursor-pointer'
                              }`}
                              title={isCurrent ? 'Cannot delete current account' : 'Revoke user login'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-105 hover:bg-slate-200 text-slate-755 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all bg-slate-100"
          >
            Finished Setup
          </button>
        </div>

      </div>
    </div>
  );
}
