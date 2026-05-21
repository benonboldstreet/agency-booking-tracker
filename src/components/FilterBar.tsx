import React from 'react';
import { Search, Calendar, Filter, X, SlidersHorizontal } from 'lucide-react';
import { LookupItem } from '../types';

interface FilterBarProps {
  searchStaff: string;
  setSearchStaff: (val: string) => void;
  filterHouse: string | number;
  setFilterHouse: (val: string | number) => void;
  filterAgency: string | number;
  setFilterAgency: (val: string | number) => void;
  filterTeamLeader: string | number;
  setFilterTeamLeader: (val: string | number) => void;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  
  houses: LookupItem[];
  agencies: LookupItem[];
  teamLeaders: LookupItem[];
  
  onClearFilters: () => void;
}

export default function FilterBar({
  searchStaff,
  setSearchStaff,
  filterHouse,
  setFilterHouse,
  filterAgency,
  setFilterAgency,
  filterTeamLeader,
  setFilterTeamLeader,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  filterStatus,
  setFilterStatus,
  houses,
  agencies,
  teamLeaders,
  onClearFilters
}: FilterBarProps) {
  
  const hasActiveFilters = Boolean(
    searchStaff ||
    filterHouse ||
    filterAgency ||
    filterTeamLeader ||
    filterStartDate ||
    filterEndDate ||
    filterStatus !== 'all'
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs font-sans">
      <div className="flex flex-col gap-4">
        
        {/* Row 1: Search Staff and Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4.5 w-4.5" />
            </div>
            <input
              type="text"
              placeholder="Search bookings by carer / staff name..."
              value={searchStaff}
              onChange={(e) => setSearchStaff(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              Advanced Controls
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="px-2.5 py-1 rounded-lg border border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Select Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
          
          {/* Filter House */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">House</label>
            <select
              value={filterHouse}
              onChange={(e) => setFilterHouse(e.target.value)}
              className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Houses</option>
              {houses.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Agency */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Agency</label>
            <select
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Agencies</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Team Leader */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Team Leader</label>
            <select
              value={filterTeamLeader}
              onChange={(e) => setFilterTeamLeader(e.target.value)}
              className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Team Leaders</option>
              {teamLeaders.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Any Status</option>
              <option value="active">Active Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>

        {/* Row 3: Date Range Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 px-2.5 py-2 rounded-lg border border-slate-200">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Date From
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="block w-full px-2 py-1 border border-slate-200 bg-white rounded-md text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Date To
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="block w-full px-2 py-1 border border-slate-200 bg-white rounded-md text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
