import React, { useState, useEffect } from 'react';
import { X, Calendar, ClipboardList, Clock, Sparkles, User, Info, FileText } from 'lucide-react';
import { Booking, LookupItem } from '../types';
import { generateReferenceNumber } from '../utils/bookingUtils';

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Omit<Booking, 'id' | 'booking_made_at'> & { id?: string }) => void;
  editingBooking: Booking | null;
  existingBookings: Booking[];
  houses: LookupItem[];
  agencies: LookupItem[];
  teamLeaders: LookupItem[];
  shiftTypes: LookupItem[];
  reasons: LookupItem[];
  currentUserEmail: string;
}

export default function BookingForm({
  isOpen,
  onClose,
  onSave,
  editingBooking,
  existingBookings,
  houses,
  agencies,
  teamLeaders,
  shiftTypes,
  reasons,
  currentUserEmail
}: BookingFormProps) {
  const [serviceHouse, setServiceHouse] = useState<string | number>('');
  const [agency, setAgency] = useState<string | number>('');
  const [teamLeader, setTeamLeader] = useState<string | number>('');
  const [shiftType, setShiftType] = useState<string | number>('');
  const [reason, setReason] = useState<string | number>('');
  const [agencyStaffName, setAgencyStaffName] = useState('');
  const [shiftDate, setShiftDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [notes, setNotes] = useState('');
  const [internalRef, setInternalRef] = useState('');
  const [authorisedBy, setAuthorisedBy] = useState('');
  const [externalRef, setExternalRef] = useState('');

  // Set default form values
  useEffect(() => {
    if (isOpen) {
      if (editingBooking) {
        setServiceHouse(editingBooking.service_house || '');
        setAgency(editingBooking.agency || '');
        setTeamLeader(editingBooking.team_leader || '');
        setShiftType(editingBooking.shift_type || '');
        setReason(editingBooking.reason || '');
        setAgencyStaffName(editingBooking.agency_staff_name || '');
        setShiftDate(editingBooking.shift_date || '');
        setStartTime(editingBooking.start_time || '08:00');
        setEndTime(editingBooking.end_time || '20:00');
        setNotes(editingBooking.notes || '');
        setInternalRef(editingBooking.internal_ref || '');
        setAuthorisedBy(editingBooking.authorised_by || '');
        setExternalRef(editingBooking.external_ref || '');
      } else {
        // Create new
        const today = new Date().toISOString().slice(0, 10);
        setServiceHouse(houses[0]?.id || '');
        setAgency(agencies[0]?.id || '');
        setTeamLeader(teamLeaders[0]?.id || '');
        setShiftType(shiftTypes[0]?.id || '');
        setReason(reasons[0]?.id || '');
        setAgencyStaffName('');
        setShiftDate(today);
        setStartTime('08:00');
        setEndTime('20:00');
        setNotes('');
        setAuthorisedBy('');
        setExternalRef('');
        
        // Dynamic reference number computed initially
        const tempRef = generateReferenceNumber(existingBookings, today);
        setInternalRef(tempRef);
      }
    }
  }, [isOpen, editingBooking, houses, agencies, teamLeaders, shiftTypes, reasons]);

  // Handle automatic generation of internal reference number when date changes
  useEffect(() => {
    if (isOpen && !editingBooking && shiftDate) {
      const generatedRef = generateReferenceNumber(existingBookings, shiftDate);
      setInternalRef(generatedRef);
    }
  }, [shiftDate, existingBookings, editingBooking, isOpen]);

  // Pre-fill times based on selected shift type if applicable
  const handleShiftTypeChange = (value: string | number) => {
    setShiftType(value);
    
    // Auto-populate times for default shifts to make entering seamless
    if (value === 'S1') {
      setStartTime('08:00');
      setEndTime('20:00');
    } else if (value === 'S2') {
      setStartTime('20:00');
      setEndTime('08:00');
    } else if (value === 'S3') {
      setStartTime('07:30');
      setEndTime('15:30');
    } else if (value === 'S4') {
      setStartTime('15:00');
      setEndTime('23:00');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agencyStaffName.trim()) {
      alert('Agency Staff full name is required.');
      return;
    }

    if (!shiftDate) {
      alert('Shift Date is required.');
      return;
    }

    onSave({
      id: editingBooking?.id,
      internal_ref: internalRef,
      service_house: serviceHouse === '' ? null : serviceHouse,
      agency: agency === '' ? null : agency,
      team_leader: teamLeader === '' ? null : teamLeader,
      shift_type: shiftType === '' ? null : shiftType,
      reason: reason === '' ? null : reason,
      agency_staff_name: agencyStaffName.trim(),
      shift_date: shiftDate,
      start_time: startTime,
      end_time: endTime,
      status: editingBooking ? editingBooking.status : 'active',
      notes: notes.trim(),
      authorised_by: authorisedBy.trim(),
      external_ref: externalRef.trim(),
      created_by: editingBooking?.created_by || currentUserEmail
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Form Container */}
      <div className="relative bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-300 transform transition-all overflow-hidden z-10 max-h-[92vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 flex-shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <ClipboardList className="h-4.5 w-4.5 text-blue-600" />
              {editingBooking ? 'Modify Agency Booking' : 'Register New Agency Booking'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Form dropdown lists are resolved from database lookup tables.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 text-slate-900">
          
          {/* Top Info Grid Code / Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100/60 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Internal reference (Autogenerated)
              </span>
              <div className="bg-blue-50 border border-blue-200/60 px-2.5 py-1.5 rounded text-blue-800 font-mono text-xs font-bold flex items-center justify-between">
                <span>{internalRef || 'BK-...' }</span>
                <span className="text-[8px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase">Sequential</span>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Shift Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <input
                  type="date"
                  required
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="block w-full pl-8 pr-2.5 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Core Staff & Lookup Fields */}
          <div className="space-y-3">
            
            {/* Staff name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Agency Staff Full Name
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={agencyStaffName}
                  onChange={(e) => setAgencyStaffName(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white rounded text-slate-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* House */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Service / House
                </label>
                <select
                  value={serviceHouse}
                  onChange={(e) => setServiceHouse(e.target.value)}
                  className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose House --</option>
                  {houses.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Agency */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Agency
                </label>
                <select
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Agency --</option>
                  {agencies.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Team Leader */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Team Leader
                </label>
                <select
                  value={teamLeader}
                  onChange={(e) => setTeamLeader(e.target.value)}
                  className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Team Leader --</option>
                  {teamLeaders.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Shift Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Shift Type Profile
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => handleShiftTypeChange(e.target.value)}
                  className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Shift Type --</option>
                  {shiftTypes.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shift Hour Ranges */}
            <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Start Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Clock className="h-3 w-3" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="HH:MM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="block w-full pl-7 pr-2 py-1 border border-slate-200 bg-white rounded text-[11px] text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  End Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Clock className="h-3 w-3" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="HH:MM"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="block w-full pl-7 pr-2 py-1 border border-slate-200 bg-white rounded text-[11px] text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Authorised By */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Authorised By
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={authorisedBy}
                  onChange={(e) => setAuthorisedBy(e.target.value)}
                  className="block w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* External Ref */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  External Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. EXT-90812"
                  value={externalRef}
                  onChange={(e) => setExternalRef(e.target.value)}
                  className="block w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Reason */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Reason for Booking Cover
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full px-2 py-1.5 border border-slate-200 bg-white rounded text-slate-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Reason --</option>
                  {reasons.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Booking Description & Notes
              </label>
              <div className="relative rounded-md shadow-2xs">
                <textarea
                  rows={2}
                  placeholder="Provide additional details regarding duties, safety requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 hover:border-slate-400 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-100" />
              {editingBooking ? 'Apply Modifications' : 'Commit Booking Row'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
