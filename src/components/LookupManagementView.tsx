import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  Home, 
  Briefcase, 
  UserSquare2, 
  RotateCw, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { LookupItem } from '../types';

interface LookupManagementViewProps {
  isOpen: boolean;
  onClose: () => void;
  isSandbox: boolean;

  houses: LookupItem[];
  agencies: LookupItem[];
  teamLeaders: LookupItem[];

  onAddHouse: (name: string) => Promise<boolean>;
  onRemoveHouse: (id: string | number) => Promise<{ success: boolean; error?: string }>;

  onAddAgency: (name: string) => Promise<boolean>;
  onRemoveAgency: (id: string | number) => Promise<{ success: boolean; error?: string }>;

  onAddTeamLeader: (name: string) => Promise<boolean>;
  onRemoveTeamLeader: (id: string | number) => Promise<{ success: boolean; error?: string }>;
}

type TabType = 'houses' | 'agencies' | 'teamLeaders';

export default function LookupManagementView({
  isOpen,
  onClose,
  isSandbox,
  houses,
  agencies,
  teamLeaders,
  onAddHouse,
  onRemoveHouse,
  onAddAgency,
  onRemoveAgency,
  onAddTeamLeader,
  onRemoveTeamLeader
}: LookupManagementViewProps) {
  
  const [activeTab, setActiveTab] = useState<TabType>('houses');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNameValue, setNewNameValue] = useState('');
  
  // Status feedback states
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Select appropriate collection based on active mode
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'houses':
        return houses;
      case 'agencies':
        return agencies;
      case 'teamLeaders':
        return teamLeaders;
      default:
        return [];
    }
  }, [activeTab, houses, agencies, teamLeaders]);

  // Filter items matching search bar
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    const lower = searchQuery.toLowerCase();
    return currentItems.filter(item => item.name.toLowerCase().includes(lower));
  }, [currentItems, searchQuery]);

  // Helper title & labels mapping
  const activeDetails = {
    houses: {
      singular: 'House Unit',
      plural: 'House Units',
      placeholder: 'e.g. Cedar Ridge Lodge',
      icon: <Home className="h-4 w-4" />
    },
    agencies: {
      singular: 'Nursing Agency',
      plural: 'Agencies',
      placeholder: 'e.g. Apex Caring Staff',
      icon: <Briefcase className="h-4 w-4" />
    },
    teamLeaders: {
      singular: 'Team Leader',
      plural: 'Team Leaders',
      placeholder: 'e.g. Marcus Vance',
      icon: <UserSquare2 className="h-4 w-4" />
    }
  }[activeTab];

  if (!isOpen) return null;

  // Action: Add lookup entry
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newNameValue.trim();
    if (!cleanName) return;

    setLoadingAction(true);
    setStatusMessage(null);

    try {
      let success = false;
      if (activeTab === 'houses') {
        success = await onAddHouse(cleanName);
      } else if (activeTab === 'agencies') {
        success = await onAddAgency(cleanName);
      } else if (activeTab === 'teamLeaders') {
        success = await onAddTeamLeader(cleanName);
      }

      if (success) {
        setNewNameValue('');
        setStatusMessage({
          type: 'success',
          text: `Successfully registered new ${activeDetails.singular} "${cleanName}"!`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Could not save the ${activeDetails.singular.toLowerCase()}. Try again or check active credentials.`
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An unexpected failure occurred while creating lookup.'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Action: Remove lookup entry with dependency security checks
  const handleRemoveItem = async (id: string | number, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to completely delete "${name}"? Existing bookings utilizing this ${activeDetails.singular.toLowerCase()} may display raw identifier values instead.`);
    if (!confirmed) return;

    setLoadingAction(true);
    setStatusMessage(null);

    try {
      let result: { success: boolean; error?: string } = { success: false };

      if (activeTab === 'houses') {
        result = await onRemoveHouse(id);
      } else if (activeTab === 'agencies') {
        result = await onRemoveAgency(id);
      } else if (activeTab === 'teamLeaders') {
        result = await onRemoveTeamLeader(id);
      }

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully deleted ${activeDetails.singular} "${name}".`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || `Could not delete ${activeDetails.singular.toLowerCase()}. Please verify that no active shift booking depends on this item.`
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not complete the delete action.'
      });
    } finally {
      setLoadingAction(false);
    }
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
            
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              {/* Drawer Header */}
              <div className="px-5 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 animate-in">
                    <Briefcase className="h-4.5 w-4.5 text-blue-600" />
                    Configure Database Resources
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isSandbox 
                      ? 'Managing Local Sandboxed resources and lists instantly.' 
                      : 'Modifying live Supabase database lookups & references.'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded px-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Resources Tab Selector */}
              <div className="border-b border-slate-200 bg-slate-50 p-2.5">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-lg">
                  <button
                    onClick={() => {
                      setActiveTab('houses');
                      setStatusMessage(null);
                      setSearchQuery('');
                    }}
                    type="button"
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                      activeTab === 'houses' 
                        ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Home className="h-3.5 w-3.5 text-blue-500" />
                    Houses
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('agencies');
                      setStatusMessage(null);
                      setSearchQuery('');
                    }}
                    type="button"
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                      activeTab === 'agencies' 
                        ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                    Agencies
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('teamLeaders');
                      setStatusMessage(null);
                      setSearchQuery('');
                    }}
                    type="button"
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                      activeTab === 'teamLeaders' 
                        ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserSquare2 className="h-3.5 w-3.5 text-emerald-500" />
                    Leaders
                  </button>
                </div>
              </div>

              {/* Drawer Main Content */}
              <div className="flex-1 px-5 py-5 overflow-y-auto space-y-4">
                
                {/* Status Message notifications banner */}
                {statusMessage && (
                  <div className={`p-3 rounded border text-xs flex gap-2 animate-in fade-in ${
                    statusMessage.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                      : 'bg-rose-50 border-rose-250 text-rose-800'
                  }`}>
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0" />
                    )}
                    <p className="flex-1">{statusMessage.text}</p>
                  </div>
                )}

                {/* Form to append a new item */}
                <form onSubmit={handleAddItem} className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      {activeDetails.icon}
                      New {activeDetails.singular} Registration
                    </span>
                    {loadingAction && <RotateCw className="h-3 w-3 animate-spin text-blue-600" />}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newNameValue}
                      onChange={(e) => setNewNameValue(e.target.value)}
                      placeholder={activeDetails.placeholder}
                      className="block w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-550/25 focus:border-blue-600 transition-all font-medium"
                      disabled={loadingAction}
                    />
                    <button
                      type="submit"
                      disabled={loadingAction || !newNameValue.trim()}
                      className="px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </button>
                  </div>
                </form>

                {/* Search existing list and count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                    <span>Registered lookup listings</span>
                    <span className="bg-slate-100 border border-slate-205 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {filteredItems.length} of {currentItems.length} listed
                    </span>
                  </div>

                  <div className="relative rounded">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search current ${activeDetails.plural.toLowerCase()}...`}
                      className="block w-full pl-8 pr-3 py-1.5 border border-slate-250 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Dynamic List Render */}
                <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white max-h-[45vh] overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No {activeDetails.plural.toLowerCase()} found matching filter.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-150">
                      {filteredItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-2.5 px-3 hover:bg-slate-50/50 transition-all"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="h-5 w-5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[9px] font-bold text-slate-500 flex items-center justify-center">
                              {String(item.id).slice(0, 3)}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id, item.name)}
                            disabled={loadingAction}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
                            title={`Delete ${activeDetails.singular.toLowerCase()}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DB Sync information footer disclaimer */}
                <div className="rounded p-3 bg-blue-50/40 border border-blue-100 flex gap-2 text-[11px] text-blue-800 leading-relaxed mt-4">
                  <AlertTriangle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Important Notice:</span>
                    <p className="mt-0.5">
                      Adding or deleting references syncs directly to the {isSandbox ? 'browser local simulation cache' : 'online default schema tables'}. Any deletion of an asset currently assigned to a booking record will show its generic index to retain system consistency.
                    </p>
                  </div>
                </div>

              </div>

              {/* Drawer footer close button */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 border border-slate-900 text-white rounded text-[11px] font-bold tracking-wide transition-all cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
