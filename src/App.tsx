import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Settings, 
  History, 
  Download, 
  RotateCw,
  Clock,
  Database,
  CalendarClock,
  HeartHandshake,
  AlertCircle,
  ShieldCheck,
  X,
  AlertTriangle,
  LogOut,
  Sparkles,
  Phone,
  Mail,
  Users
} from 'lucide-react';

import { Booking, BookingResolved, LookupItem, AuditLogItem } from './types';
import { 
  getSavedCredentials, 
  getSupabaseClient, 
  DEFAULT_HOUSES, 
  DEFAULT_AGENCIES, 
  DEFAULT_TEAM_LEADERS, 
  DEFAULT_SHIFT_TYPES, 
  DEFAULT_REASONS, 
  DEFAULT_BOOKINGS, 
  DEFAULT_AUDIT_LOGS,
  getPortalUsers
} from './lib/supabase';
import { exportToCSV, triggerNetlifyFunction } from './utils/bookingUtils';

import LoginView from './components/LoginView';
import SettingsPanel from './components/SettingsPanel';
import BookingForm from './components/BookingForm';
import FilterBar from './components/FilterBar';
import AuditLogView from './components/AuditLogView';
import LookupManagementView from './components/LookupManagementView';
import OptionsLogo from './components/OptionsLogo';
import UserManagementView from './components/UserManagementView';

export default function App() {
  // Authentication & environment states
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('agency_booking_user_email');
  });
  const [config, setConfig] = useState(getSavedCredentials);
  const [supabaseClient, setSupabaseClient] = useState(getSupabaseClient);

  // Accessibility states & preferences matching Options visual parameters
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'extra-large'>(() => {
    return (localStorage.getItem('options_font_scale') as any) || 'normal';
  });
  const [dyslexicFont, setDyslexicFont] = useState<boolean>(() => {
    return localStorage.getItem('options_dyslexic_font') === 'true';
  });
  const [activeTheme, setActiveTheme] = useState<'options-mint' | 'options-purple' | 'slate'>(() => {
    return (localStorage.getItem('options_active_theme') as any) || 'options-mint';
  });

  // Database lists
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [houses, setHouses] = useState<LookupItem[]>([]);
  const [agencies, setAgencies] = useState<LookupItem[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<LookupItem[]>([]);
  const [shiftTypes, setShiftTypes] = useState<LookupItem[]>([]);
  const [reasons, setReasons] = useState<LookupItem[]>([]);

  // Page interaction states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modals & panels toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute if logged-in manager is a super admin
  const isSuperAdmin = useMemo(() => {
    if (!currentUserEmail) return false;
    const portalUsers = getPortalUsers();
    const matched = portalUsers.find(
      u => u.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase()
    );
    if (matched) {
      return matched.role === 'super_admin';
    }
    return currentUserEmail.trim().toLowerCase() === 'iambensimpson@gmail.com';
  }, [currentUserEmail]);

  // Filters state
  const [searchStaff, setSearchStaff] = useState('');
  const [filterHouse, setFilterHouse] = useState<string | number>('');
  const [filterAgency, setFilterAgency] = useState<string | number>('');
  const [filterTeamLeader, setFilterTeamLeader] = useState<string | number>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Trigger credentials sync
  const handleReloadCredentials = () => {
    const freshConfig = getSavedCredentials();
    setConfig(freshConfig);
    const client = getSupabaseClient();
    setSupabaseClient(client);
    setErrorMessage(null);
  };

  // On Login Action
  const handleLoginSuccess = (email: string) => {
    localStorage.setItem('agency_booking_user_email', email);
    setCurrentUserEmail(email);
  };

  // On Logout Action
  const handleLogout = () => {
    localStorage.removeItem('agency_booking_user_email');
    setCurrentUserEmail(null);
    if (supabaseClient) {
      supabaseClient.auth.signOut();
    }
  };

  // Toggle Sandbox Mode state
  const handleToggleSandbox = (enable: boolean) => {
    localStorage.setItem('agency_booking_sandbox_enabled', enable.toString());
    handleReloadCredentials();
  };

  // Automatically construct mailto link and copy details text to clipboard for Outlook ease of use
  const handleEmailBooking = (b: BookingResolved) => {
    const formattedDate = new Date(b.shift_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const subjectText = `Agency Shift Cover: ${b.internal_ref} - ${b.house_name}`;
    
    const textBody = `Agency Shift Cover Details:
------------------------------------------
Reference Code: ${b.internal_ref}
Agency Staff: ${b.agency_staff_name || 'N/A'}
Date of Shift: ${formattedDate}
Time: ${b.start_time} - ${b.end_time} (${b.shift_type_name || 'N/A'})
Service/House: ${b.house_name || 'N/A'}
Agency: ${b.agency_name || 'N/A'}
Team Leader: ${b.team_leader_name || 'N/A'}
Reason for Cover: ${b.reason_name || 'N/A'}
${b.external_ref ? `External Ref: ${b.external_ref}` : ''}
${b.notes ? `Manager Notes: ${b.notes}` : ''}
${b.cancellation_reason ? `Cancellation Reason: ${b.cancellation_reason}` : ''}
------------------------------------------
Created By: ${b.created_by || 'Staff Manager'}
OPTIONS Trust Support System`;

    // Copy formatted text description to clipboard first as fallback / standard copy option
    navigator.clipboard.writeText(textBody)
      .then(() => {
        setCopiedId(b.id);
        setTimeout(() => setCopiedId(null), 3000);
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
      });

    // Fire actual outlook mailto redirect
    const mailtoUri = `mailto:?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(textBody)}`;
    
    const link = document.createElement('a');
    link.href = mailtoUri;
    link.click();
  };

  // Load Lookup Tables & Core Bookings data
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);

    // Context check: are we using Sandbox mode?
    if (config.isSandbox || !supabaseClient) {
      // Load preset Sandbox environments
      const localHouses = localStorage.getItem('agency_local_houses');
      if (localHouses) {
        setHouses(JSON.parse(localHouses));
      } else {
        setHouses(DEFAULT_HOUSES);
        localStorage.setItem('agency_local_houses', JSON.stringify(DEFAULT_HOUSES));
      }

      const localAgencies = localStorage.getItem('agency_local_agencies');
      if (localAgencies) {
        setAgencies(JSON.parse(localAgencies));
      } else {
        setAgencies(DEFAULT_AGENCIES);
        localStorage.setItem('agency_local_agencies', JSON.stringify(DEFAULT_AGENCIES));
      }

      const localTeamLeaders = localStorage.getItem('agency_local_team_leaders');
      if (localTeamLeaders) {
        setTeamLeaders(JSON.parse(localTeamLeaders));
      } else {
        setTeamLeaders(DEFAULT_TEAM_LEADERS);
        localStorage.setItem('agency_local_team_leaders', JSON.stringify(DEFAULT_TEAM_LEADERS));
      }

      setShiftTypes(DEFAULT_SHIFT_TYPES);
      setReasons(DEFAULT_REASONS);
      
      // Load or initialize local bookings from LocalStorage if they exist to keep it active
      const localStoredBookings = localStorage.getItem('agency_local_bookings');
      if (localStoredBookings) {
        setBookings(JSON.parse(localStoredBookings));
      } else {
        setBookings(DEFAULT_BOOKINGS);
        localStorage.setItem('agency_local_bookings', JSON.stringify(DEFAULT_BOOKINGS));
      }

      // Load or initialize local audits
      const localStoredAudits = localStorage.getItem('agency_local_audits');
      if (localStoredAudits) {
        setAuditLogs(JSON.parse(localStoredAudits));
      } else {
        setAuditLogs(DEFAULT_AUDIT_LOGS);
        localStorage.setItem('agency_local_audits', JSON.stringify(DEFAULT_AUDIT_LOGS));
      }
      setLoading(false);
      return;
    }

    // Custom database: Fetch from Supabase tables
    try {
      // Parallelize lookups fetch to keep server roundtrips ultra-efficient
      const [
        resHouses, 
        resAgencies, 
        resLeaders, 
        resShifts, 
        resReasons,
        resBookings,
        resAudits
      ] = await Promise.all([
        supabaseClient.from('houses').select('*'),
        supabaseClient.from('agencies').select('*'),
        supabaseClient.from('team_leaders').select('*'),
        supabaseClient.from('shift_types').select('*'),
        supabaseClient.from('reasons').select('*'),
        supabaseClient.from('bookings').select('*').order('shift_date', { ascending: false }),
        supabaseClient.from('audit_log').select('*').order('changed_at', { ascending: false })
      ]);

      // Handle custom lookup fallbacks if schemas aren't fully hydrated yet
      if (resHouses.error) console.warn('Lookup houses error, defaulting:', resHouses.error);
      setHouses(resHouses.data || DEFAULT_HOUSES);

      if (resAgencies.error) console.warn('Lookup agencies error, defaulting:', resAgencies.error);
      setAgencies(resAgencies.data || DEFAULT_AGENCIES);

      if (resLeaders.error) console.warn('Lookup leaders error, defaulting:', resLeaders.error);
      setTeamLeaders(resLeaders.data || DEFAULT_TEAM_LEADERS);

      if (resShifts.error) console.warn('Lookup shifts error, defaulting:', resShifts.error);
      setShiftTypes(resShifts.data || DEFAULT_SHIFT_TYPES);

      if (resReasons.error) console.warn('Lookup reasons error, defaulting:', resReasons.error);
      setReasons(resReasons.data || DEFAULT_REASONS);

      if (resBookings.error) {
        throw new Error(`Failed to retrieve bookings collection: ${resBookings.error.message}`);
      }
      setBookings(resBookings.data || []);

      if (resAudits.error) {
        console.warn('Audit trail failed to load:', resAudits.error);
        setAuditLogs([]);
      } else {
        setAuditLogs(resAudits.data || []);
      }

    } catch (err: any) {
      console.error('Data Fetching Critical Failure:', err);
      setErrorMessage(err.message || 'Database fetch error. Please ensure your Supabase tables match the schema expectations.');
    } finally {
      setLoading(false);
    }
  };

  // Reload lookups and bookings when credentials or auth shifts
  useEffect(() => {
    if (currentUserEmail) {
      loadData();
    }
  }, [currentUserEmail, config.isSandbox, supabaseClient]);

  // Clean status banners helper
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Map IDs to strings beautifully
  const resolvedBookings = useMemo((): BookingResolved[] => {
    return bookings.map(b => {
      const house = houses.find(h => String(h.id) === String(b.service_house));
      const agencyObj = agencies.find(a => String(a.id) === String(b.agency));
      const leader = teamLeaders.find(t => String(t.id) === String(b.team_leader));
      const shift = shiftTypes.find(s => String(s.id) === String(b.shift_type));
      const reasonObj = reasons.find(r => String(r.id) === String(b.reason));

      return {
        ...b,
        house_name: house ? house.name : (b.service_house ? `House #${b.service_house}` : 'Unassigned House'),
        agency_name: agencyObj ? agencyObj.name : (b.agency ? `Agency #${b.agency}` : 'Direct Hire'),
        team_leader_name: leader ? leader.name : (b.team_leader ? `Leader #${b.team_leader}` : 'No Supervisor'),
        team_leader_email: leader?.email, // include email lookup
        shift_type_name: shift ? shift.name : (b.shift_type ? `Shift #${b.shift_type}` : 'Custom shift'),
        reason_name: reasonObj ? reasonObj.name : (b.reason ? `Reason Code: ${b.reason}` : 'Not Specified')
      };
    });
  }, [bookings, houses, agencies, teamLeaders, shiftTypes, reasons]);

  // Populate reference ids context for audit reports
  const resolvedAuditLogs = useMemo((): AuditLogItem[] => {
    return auditLogs.map(log => {
      const bObj = bookings.find(b => b.id === log.booking_id);
      return {
        ...log,
        booking_ref: bObj ? bObj.internal_ref : `BK-ID-${String(log.booking_id).slice(0, 5)}`
      };
    });
  }, [auditLogs, bookings]);

  // Filter logic (Staff Name, House, Agency, Leader, Date range, Status)
  const filteredResolvedBookings = useMemo(() => {
    return resolvedBookings.filter(b => {
      // 1. Staff Name Search (case-insensitive)
      if (searchStaff.trim()) {
        const needle = searchStaff.toLowerCase();
        const mainMatch = (b.agency_staff_name || '').toLowerCase().includes(needle) || (b.internal_ref || '').toLowerCase().includes(needle);
        if (!mainMatch) return false;
      }

      // 2. House Selection
      if (filterHouse) {
        if (String(b.service_house) !== String(filterHouse)) return false;
      }

      // 3. Agency Selection
      if (filterAgency) {
        if (String(b.agency) !== String(filterAgency)) return false;
      }

      // 4. Team Leader Selection
      if (filterTeamLeader) {
        if (String(b.team_leader) !== String(filterTeamLeader)) return false;
      }

      // 5. Date boundaries
      if (filterStartDate) {
        if (b.shift_date < filterStartDate) return false;
      }
      if (filterEndDate) {
        if (b.shift_date > filterEndDate) return false;
      }

      // 6. Action Status
      if (filterStatus !== 'all') {
        if (b.status !== filterStatus) return false;
      }

      return true;
    });
  }, [resolvedBookings, searchStaff, filterHouse, filterAgency, filterTeamLeader, filterStartDate, filterEndDate, filterStatus]);

  // Compute stat indicators (Dynamic counts of filtered items)
  const stats = useMemo(() => {
    const active = bookings.filter(b => b.status === 'active').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    
    // Unique staff members hired currently
    const staffSet = new Set(bookings.filter(b => b.status === 'active').map(b => (b.agency_staff_name || '').trim().toLowerCase()));

    return {
      active,
      cancelled,
      uniqueStaff: staffSet.size,
      totalCount: bookings.length
    };
  }, [bookings]);

  const handleClearFilters = () => {
    setSearchStaff('');
    setFilterHouse('');
    setFilterAgency('');
    setFilterTeamLeader('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterStatus('all');
  };

  // Create or Update Booking Row action dispatcher
  const handleSaveBooking = async (formData: any) => {
    const isEditMode = Boolean(formData.id);
    setLoading(true);
    setErrorMessage(null);

    // Sanitize integer IDs if schemas dictate numeric keys
    const parseId = (val: any) => {
      if (val === null || val === undefined) return null;
      return isNaN(Number(val)) ? val : Number(val);
    };

    const payload: Omit<Booking, 'booking_made_at'> = {
      id: isEditMode ? formData.id : `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      internal_ref: formData.internal_ref,
      service_house: parseId(formData.service_house),
      agency: parseId(formData.agency),
      team_leader: parseId(formData.team_leader),
      shift_type: isNaN(Number(formData.shift_type)) ? formData.shift_type : Number(formData.shift_type),
      reason: isNaN(Number(formData.reason)) ? formData.reason : Number(formData.reason),
      agency_staff_name: formData.agency_staff_name,
      shift_date: formData.shift_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      status: formData.status,
      notes: formData.notes,
      authorised_by: formData.authorised_by,
      external_ref: formData.external_ref,
      created_by: isEditMode && editingBooking ? editingBooking.created_by : (currentUserEmail || 'system@agency.com')
    };

    // Calculate Audit Entries on modifications
    let auditLogsToInsert: Omit<AuditLogItem, 'id' | 'changed_at'>[] = [];
    if (isEditMode && editingBooking) {
      const trackingFields: (keyof Booking)[] = [
        'service_house',
        'agency',
        'team_leader',
        'shift_type',
        'reason',
        'agency_staff_name',
        'shift_date',
        'start_time',
        'end_time',
        'status',
        'notes',
        'authorised_by',
        'external_ref'
      ];

      for (const field of trackingFields) {
        const oldVal = editingBooking[field];
        const newVal = payload[field];
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          // Map lookup labels to make audit trails extremely readable
          let oldLabelStr = String(oldVal ?? '');
          let newLabelStr = String(newVal ?? '');

          if (field === 'service_house') {
            oldLabelStr = houses.find(h => String(h.id) === String(oldVal))?.name || String(oldVal ?? '');
            newLabelStr = houses.find(h => String(h.id) === String(newVal))?.name || String(newVal ?? '');
          } else if (field === 'agency') {
            oldLabelStr = agencies.find(a => String(a.id) === String(oldVal))?.name || String(oldVal ?? '');
            newLabelStr = agencies.find(a => String(a.id) === String(newVal))?.name || String(newVal ?? '');
          } else if (field === 'team_leader') {
            oldLabelStr = teamLeaders.find(t => String(t.id) === String(oldVal))?.name || String(oldVal ?? '');
            newLabelStr = teamLeaders.find(t => String(t.id) === String(newVal))?.name || String(newVal ?? '');
          } else if (field === 'shift_type') {
            oldLabelStr = shiftTypes.find(s => String(s.id) === String(oldVal))?.name || String(oldVal ?? '');
            newLabelStr = shiftTypes.find(s => String(s.id) === String(newVal))?.name || String(newVal ?? '');
          } else if (field === 'reason') {
            oldLabelStr = reasons.find(r => String(r.id) === String(oldVal))?.name || String(oldVal ?? '');
            newLabelStr = reasons.find(r => String(r.id) === String(newVal))?.name || String(newVal ?? '');
          }

          auditLogsToInsert.push({
            booking_id: editingBooking.id,
            changed_by: currentUserEmail || 'system@agency.com',
            field_name: field,
            old_value: oldLabelStr || '[None]',
            new_value: newLabelStr || '[None]'
          });
        }
      }
    }

    if (config.isSandbox || !supabaseClient) {
      // Offline local storage handling
      let updatedList: Booking[] = [];
      if (isEditMode) {
        updatedList = bookings.map(b => b.id === payload.id ? { ...b, ...payload } : b);
        setStatusMessage(`Successfully modified booking ${payload.internal_ref} client-side.`);
      } else {
        const freshRow: Booking = {
          ...payload,
          booking_made_at: new Date().toISOString()
        };
        updatedList = [freshRow, ...bookings];
        setStatusMessage(`Successfully inserted booking ${payload.internal_ref} client-side.`);
      }

      setBookings(updatedList);
      localStorage.setItem('agency_local_bookings', JSON.stringify(updatedList));

      // Audit logs offline insert commit
      if (auditLogsToInsert.length > 0) {
        const freshAudits: AuditLogItem[] = auditLogsToInsert.map((item, index) => ({
          id: `audit-${Date.now()}-${index}`,
          changed_at: new Date().toISOString(),
          ...item
        }));
        const resolvedNewAudits = [...freshAudits, ...auditLogs];
        setAuditLogs(resolvedNewAudits);
        localStorage.setItem('agency_local_audits', JSON.stringify(resolvedNewAudits));
      }

      setLoading(false);
      setIsFormOpen(false);
      setEditingBooking(null);

      // Trigger email API asynchronously & gracefully (don't block UI)
      const selectedTL = teamLeaders.find(t => String(t.id) === String(payload.team_leader));
      const mockResolvedBooking = {
        ...payload,
        booking_made_at: new Date().toISOString(),
        house_name: houses.find(h => String(h.id) === String(payload.service_house))?.name || 'Sandbox house',
        agency_name: agencies.find(a => String(a.id) === String(payload.agency))?.name || 'Sandbox agency',
        team_leader_name: selectedTL?.name || 'Sandbox leader',
        team_leader_email: selectedTL?.email || 'sarah.jenkins@example.com',
        shift_type_name: shiftTypes.find(s => String(s.id) === String(payload.shift_type))?.name || 'Sandbox shift',
        reason_name: reasons.find(r => String(r.id) === String(payload.reason))?.name || 'Sandbox reason'
      };
      
      triggerNetlifyFunction(mockResolvedBooking, selectedTL?.email);
      return;
    }

    // Active Supabase Transaction
    try {
      if (isEditMode) {
        // Core Booking patch row
        const { error: patchError } = await supabaseClient
          .from('bookings')
          .update({
            service_house: payload.service_house,
            agency: payload.agency,
            team_leader: payload.team_leader,
            shift_type: payload.shift_type,
            reason: payload.reason,
            agency_staff_name: payload.agency_staff_name,
            shift_date: payload.shift_date,
            start_time: payload.start_time,
            end_time: payload.end_time,
            status: payload.status,
            notes: payload.notes,
            authorised_by: payload.authorised_by,
            external_ref: payload.external_ref
          })
          .eq('id', payload.id);

        if (patchError) throw patchError;

        // DB Audits Batch Insert
        if (auditLogsToInsert.length > 0) {
          const { error: auditError } = await supabaseClient
            .from('audit_log')
            .insert(auditLogsToInsert.map(log => ({
              ...log,
              changed_at: new Date().toISOString()
            })));
          
          if (auditError) console.warn('Audit logs insert yielded minor concern:', auditError);
        }

        setStatusMessage(`Committed modifications for booking ref: ${payload.internal_ref}`);
      } else {
        // Create new record
        const { error: insertError } = await supabaseClient
          .from('bookings')
          .insert([{
            internal_ref: payload.internal_ref,
            service_house: payload.service_house,
            agency: payload.agency,
            team_leader: payload.team_leader,
            shift_type: payload.shift_type,
            reason: payload.reason,
            agency_staff_name: payload.agency_staff_name,
            shift_date: payload.shift_date,
            start_time: payload.start_time,
            end_time: payload.end_time,
            status: 'active',
            notes: payload.notes,
            authorised_by: payload.authorised_by,
            external_ref: payload.external_ref,
            booking_made_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
        setStatusMessage(`Added new booking record: ${payload.internal_ref}`);
      }

      setIsFormOpen(false);
      setEditingBooking(null);
      await loadData(); // Reload all sets

      // Execute Netlify email API async helper
      const savedRow = resolvedBookings.find(b => b.internal_ref === payload.internal_ref);
      if (savedRow) {
        const correspondingTLObj = teamLeaders.find(t => String(t.id) === String(payload.team_leader));
        triggerNetlifyFunction(savedRow, correspondingTLObj?.email);
      }

    } catch (err: any) {
      console.error('Save action error:', err);
      setErrorMessage(err.message || 'Failed to save booking data. Verify database table schema permissions.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Booking Action (Status = 'cancelled', Keep Visible)
  const handleCancelBooking = async (b: BookingResolved) => {
    let cancellationReasonInput = window.prompt(`Please present a reason/note for cancelling booking ${b.internal_ref} before compiling row:`);
    if (cancellationReasonInput === null) return; // cancelled prompt

    setLoading(true);
    setErrorMessage(null);

    const auditLog: Omit<AuditLogItem, 'id' | 'changed_at'> = {
      booking_id: b.id,
      changed_by: currentUserEmail || 'system@agency.com',
      field_name: 'status',
      old_value: 'active',
      new_value: 'cancelled'
    };

    if (config.isSandbox || !supabaseClient) {
      // Sandbox cancellation
      const updatedList = bookings.map(item => item.id === b.id ? { 
        ...item, 
        status: 'cancelled' as const, 
        cancellation_reason: cancellationReasonInput || 'No reason specified' 
      } : item);
      setBookings(updatedList);
      localStorage.setItem('agency_local_bookings', JSON.stringify(updatedList));

      const freshAuditItem: AuditLogItem = {
        id: `audit-${Date.now()}-cancel`,
        changed_at: new Date().toISOString(),
        ...auditLog
      };
      const resolvedNewAudits = [freshAuditItem, ...auditLogs];
      setAuditLogs(resolvedNewAudits);
      localStorage.setItem('agency_local_audits', JSON.stringify(resolvedNewAudits));

      setStatusMessage(`Cancelled booking reference ${b.internal_ref} client-side.`);
      setLoading(false);
      return;
    }

    try {
      const { error: cancelError } = await supabaseClient
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancellationReasonInput || 'No reason specified'
        })
        .eq('id', b.id);

      if (cancelError) throw cancelError;

      // Log action to audit_log
      const { error: logError } = await supabaseClient
        .from('audit_log')
        .insert([{
          ...auditLog,
          changed_at: new Date().toISOString()
        }]);

      if (logError) console.warn('Logged connection warning to cancel audit:', logError);

      setStatusMessage(`Cancelled booking reference ${b.internal_ref} in remote database.`);
      await loadData();

    } catch (err: any) {
      console.error('Cancel booking error:', err);
      setErrorMessage(err.message || 'Database rejected cancellation action. Validate roles/schemas.');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV Spreadsheet Trigger
  const handleCSVExport = () => {
    if (filteredResolvedBookings.length === 0) {
      alert('The current filtered view contains empty rows. CSV export aborted.');
      return;
    }
    exportToCSV(filteredResolvedBookings);
    setStatusMessage(`Spreadsheet file exported with ${filteredResolvedBookings.length} booking rows.`);
  };

  // --- Handlers for houses lookup ---
  const handleAddHouse = async (name: string): Promise<boolean> => {
    if (config.isSandbox || !supabaseClient) {
      const generatedId = Math.max(0, ...houses.map(h => Number(h.id) || 0)) + 1;
      const newItem: LookupItem = { id: generatedId, name };
      const updatedList = [...houses, newItem];
      setHouses(updatedList);
      localStorage.setItem('agency_local_houses', JSON.stringify(updatedList));
      return true;
    }

    try {
      const { data, error } = await supabaseClient
        .from('houses')
        .insert([{ name }])
        .select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setHouses([...houses, data[0]]);
      } else {
        await loadData();
      }
      return true;
    } catch (err: any) {
      console.error('Failed to add house:', err);
      setErrorMessage(err.message || 'Error inserting house to Supabase.');
      return false;
    }
  };

  const handleRemoveHouse = async (id: string | number): Promise<{ success: boolean; error?: string }> => {
    if (config.isSandbox || !supabaseClient) {
      const updatedList = houses.filter(h => h.id !== id);
      setHouses(updatedList);
      localStorage.setItem('agency_local_houses', JSON.stringify(updatedList));
      return { success: true };
    }

    try {
      const { error } = await supabaseClient
        .from('houses')
        .delete()
        .eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      setHouses(houses.filter(h => h.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete house:', err);
      return { success: false, error: err.message || 'Unexpected connection error.' };
    }
  };

  // --- Handlers for agencies lookup ---
  const handleAddAgency = async (name: string): Promise<boolean> => {
    if (config.isSandbox || !supabaseClient) {
      const generatedId = Math.max(0, ...agencies.map(a => Number(a.id) || 0)) + 1;
      const newItem: LookupItem = { id: generatedId, name };
      const updatedList = [...agencies, newItem];
      setAgencies(updatedList);
      localStorage.setItem('agency_local_agencies', JSON.stringify(updatedList));
      return true;
    }

    try {
      const { data, error } = await supabaseClient
        .from('agencies')
        .insert([{ name }])
        .select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setAgencies([...agencies, data[0]]);
      } else {
        await loadData();
      }
      return true;
    } catch (err: any) {
      console.error('Failed to add agency:', err);
      setErrorMessage(err.message || 'Error inserting agency to Supabase.');
      return false;
    }
  };

  const handleRemoveAgency = async (id: string | number): Promise<{ success: boolean; error?: string }> => {
    if (config.isSandbox || !supabaseClient) {
      const updatedList = agencies.filter(a => a.id !== id);
      setAgencies(updatedList);
      localStorage.setItem('agency_local_agencies', JSON.stringify(updatedList));
      return { success: true };
    }

    try {
      const { error } = await supabaseClient
        .from('agencies')
        .delete()
        .eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      setAgencies(agencies.filter(a => a.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete agency:', err);
      return { success: false, error: err.message || 'Unexpected connection error.' };
    }
  };

  // --- Handlers for team leaders lookup ---
  const handleAddTeamLeader = async (name: string): Promise<boolean> => {
    // Collect email as and when
    const emailPrompt = window.prompt(`Please provide email address for new team leader '${name}' :`);
    if (emailPrompt === null) return false;

    if (config.isSandbox || !supabaseClient) {
      const generatedId = Math.max(0, ...teamLeaders.map(t => Number(t.id) || 0)) + 1;
      const newItem = { id: generatedId, name, email: emailPrompt };
      const updatedList = [...teamLeaders, newItem];
      setTeamLeaders(updatedList);
      localStorage.setItem('agency_local_team_leaders', JSON.stringify(updatedList));
      return true;
    }

    try {
      const { data, error } = await supabaseClient
        .from('team_leaders')
        .insert([{ name, email: emailPrompt }])
        .select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setTeamLeaders([...teamLeaders, data[0]]);
      } else {
        await loadData();
      }
      return true;
    } catch (err: any) {
      console.error('Failed to add team leader:', err);
      setErrorMessage(err.message || 'Error inserting team leader to Supabase.');
      return false;
    }
  };

  const handleRemoveTeamLeader = async (id: string | number): Promise<{ success: boolean; error?: string }> => {
    if (config.isSandbox || !supabaseClient) {
      const updatedList = teamLeaders.filter(t => t.id !== id);
      setTeamLeaders(updatedList);
      localStorage.setItem('agency_local_team_leaders', JSON.stringify(updatedList));
      return { success: true };
    }

    try {
      const { error } = await supabaseClient
        .from('team_leaders')
        .delete()
        .eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      setTeamLeaders(teamLeaders.filter(t => t.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete team leader:', err);
      return { success: false, error: err.message || 'Unexpected connection error.' };
    }
  };

  // Render Login view if user isn't assigned
  if (!currentUserEmail) {
    return (
      <LoginView 
        supabase={supabaseClient}
        onLoginSuccess={handleLoginSuccess}
        onOpenSettings={() => setIsSettingsOpen(true)}
        fontScale={fontScale}
        setFontScale={setFontScale}
        dyslexicFont={dyslexicFont}
        setDyslexicFont={setDyslexicFont}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
      />
    );
  }

  // Dynamically support custom scale multiplier styles
  const getScaleStyle = () => {
    if (fontScale === 'large') return { fontSize: '115%', lineHeight: '1.45' };
    if (fontScale === 'extra-large') return { fontSize: '130%', lineHeight: '1.55' };
    return {};
  };

  const getThemeAccentClass = () => {
    if (activeTheme === 'options-mint') {
      return 'bg-[#AEFFE1] hover:bg-[#8affd3] text-slate-950 font-black border border-emerald-300 shadow-xs uppercase text-[11px] tracking-wide';
    }
    if (activeTheme === 'options-purple') {
      return 'bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 shadow-xs font-bold uppercase text-[11px] tracking-wide';
    }
    return 'bg-slate-950 hover:bg-slate-800 text-white border border-slate-900 shadow-xs font-bold uppercase text-[11px] tracking-wide';
  };

  const getThemeBadgeColor = () => {
    if (activeTheme === 'options-mint') return 'bg-teal-50 border-teal-200 text-teal-850';
    if (activeTheme === 'options-purple') return 'bg-purple-50 border-purple-200 text-purple-850';
    return 'bg-slate-100 border-slate-200 text-slate-800';
  };

  const getThemeIconColor = () => {
    if (activeTheme === 'options-mint') return 'text-teal-500';
    if (activeTheme === 'options-purple') return 'text-purple-600';
    return 'text-slate-600';
  };

  return (
    <div 
      className={`min-h-screen bg-slate-100/40 flex flex-col transition-all text-slate-900 ${
        dyslexicFont ? 'font-dyslexic' : 'font-sans'
      }`} 
      style={getScaleStyle()}
      id="main-root"
    >
      
      {/* Black Web-Style Accessibility top bar */}
      <header className="bg-slate-950 text-white py-2.5 px-4 text-xs shadow-md z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-450 font-extrabold uppercase tracking-widest block">
              OPTIONS Group Trust Network
            </span>
            <span className="bg-[#AEFFE1]/20 text-[#AEFFE1] text-[9.5px] px-2 py-0.5 rounded-full border border-[#AEFFE1]/30 font-bold">
              Affiliate Carer Management
            </span>
          </div>
          
          {/* Sizing & font Controls (A A A) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded border border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  setFontScale('normal');
                  localStorage.setItem('options_font_scale', 'normal');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  fontScale === 'normal' ? 'bg-white text-zinc-950 shadow-sm scale-105' : 'text-zinc-400 hover:text-white'
                }`}
                title="Normal Text"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => {
                  setFontScale('large');
                  localStorage.setItem('options_font_scale', 'large');
                }}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  fontScale === 'large' ? 'bg-white text-zinc-950 shadow-sm scale-105' : 'text-zinc-400 hover:text-white'
                }`}
                title="Large Text (115%)"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => {
                  setFontScale('extra-large');
                  localStorage.setItem('options_font_scale', 'extra-large');
                }}
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
              onClick={() => {
                const newVal = !dyslexicFont;
                setDyslexicFont(newVal);
                localStorage.setItem('options_dyslexic_font', newVal.toString());
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                dyslexicFont 
                  ? 'bg-purple-100 text-purple-950 border-purple-300' 
                  : 'border-zinc-700 text-zinc-350 hover:bg-zinc-800'
              }`}
            >
              Dyslexia Font
            </button>

            <div className="h-4 w-[1px] bg-zinc-800" />

            {/* Themes */}
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-805">
              <button
                type="button"
                onClick={() => {
                  setActiveTheme('options-mint');
                  localStorage.setItem('options_active_theme', 'options-mint');
                }}
                className={`w-3.5 h-3.5 rounded-full bg-[#AEFFE1] transition-all hover:scale-110 ${
                  activeTheme === 'options-mint' ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : 'opacity-65'
                }`}
                title="Mint Theme (Options Group look)"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveTheme('options-purple');
                  localStorage.setItem('options_active_theme', 'options-purple');
                }}
                className={`w-3.5 h-3.5 rounded-full bg-violet-500 transition-all hover:scale-110 ${
                  activeTheme === 'options-purple' ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : 'opacity-65'
                }`}
                title="Vibrant Purple Theme"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveTheme('slate');
                  localStorage.setItem('options_active_theme', 'slate');
                }}
                className={`w-3.5 h-3.5 rounded-full bg-slate-500 transition-all hover:scale-110 ${
                  activeTheme === 'slate' ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : 'opacity-65'
                }`}
                title="Classic Slate Theme"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Elegant Header Navigation Bar featuring Options Custom Star badge Logo! */}
      <nav id="top-nav" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 h-auto sm:h-20 py-2 sm:py-0">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-4">
                <OptionsLogo />
                
                <div className="hidden md:block h-8 w-[1px] bg-slate-200" />
                
                <div className="hidden md:block">
                  <h1 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Agency Cover Tracker
                  </h1>
                  <span className="text-[9.5px] text-slate-450 font-bold tracking-wide uppercase block mt-0.5">
                    Centralized Shift Allocation & Audit Logs
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Profile info */}
            <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
              
              {/* Phone Line and Live Help */}
              <div className="hidden lg:flex flex-col items-end text-right">
                <a href="tel:01512360855" className="flex items-center gap-1.5 text-xs font-black text-zinc-950 hover:underline">
                  <Phone className="h-3.5 w-3.5 text-zinc-900" />
                  0151 236 0855
                </a>
                <span className="text-[9px] text-zinc-450 font-bold block">Northwest Support Center</span>
              </div>

              <div className="hidden lg:block h-8 w-[1px] bg-slate-200" />

              {/* Active Connection state indicator */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/50 transition-all cursor-pointer"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sync Active</span>
                <Settings className="h-3 w-3 ml-0.5 text-slate-400" />
              </button>

              {/* User Identity Header */}
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-black text-slate-900 tracking-tight leading-none">
                  {(() => {
                    if (!currentUserEmail) return 'manager@optionsempowers.org.uk';
                    if (currentUserEmail.toLowerCase().endsWith('@optionsempowers.org.uk')) {
                      return currentUserEmail;
                    }
                    const userName = currentUserEmail.split('@')[0];
                    return `${userName}@optionsempowers.org.uk`;
                  })()}
                </span>
                <span className={`text-[9px] font-black uppercase mt-1 tracking-wider ${isSuperAdmin ? 'text-purple-600' : 'text-[#2CDCA4]'}`}>
                  {isSuperAdmin ? 'Super Admin Role' : 'Staff Manager Role'}
                </span>
              </div>

              {isSuperAdmin && (
                <>
                  <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />
                  <button
                    onClick={() => setIsUserManagementOpen(true)}
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100/85 hover:text-emerald-900 border border-emerald-250 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide shadow-2xs"
                    title="Manage Team Portal Logins and Credentials"
                  >
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Team Logins</span>
                  </button>
                </>
              )}

              <div className="h-6 w-[1px] bg-slate-200" />

              {/* Settings Toggle icon trigger */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all"
                title="Supabase API Database Setup"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all"
                title="Log Out Account"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Core View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Connection status banner and alerts */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 animate-in slide-in-from-top-3 duration-200">
            <div className="flex">
              <AlertCircle className="h-5.5 w-5.5 text-rose-500 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-rose-900">Database Connection Issue</h3>
                <div className="mt-1 text-xs text-rose-700 leading-relaxed font-medium">
                  {errorMessage}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    type="button"
                    className="text-rose-800 hover:text-rose-900 bg-rose-100/50 px-2.5 py-1 rounded border border-rose-200 cursor-pointer text-[11px]"
                  >
                    Adjust API Credentials
                  </button>
                  <button
                    onClick={() => handleToggleSandbox(true)}
                    type="button"
                    className="text-amber-800 hover:text-amber-900 bg-amber-100/60 px-2.5 py-1 rounded border border-amber-200 cursor-pointer text-[11px]"
                  >
                    ⚡ Switch to Safe Sandbox Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 flex items-center justify-between text-xs font-semibold text-emerald-800 transition-all shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="p-0.5 rounded text-emerald-600 hover:bg-emerald-100 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Analytics Stats cards bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 bg-white border border-slate-300 rounded-xl p-3 shadow-2xs">
          
          <div className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200 flex items-start justify-between">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Bookings</span>
              <span className="block text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{stats.active}</span>
            </div>
            <span className="h-6 w-6 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold font-mono">
              ACT
            </span>
          </div>

          <div className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200 flex items-start justify-between">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unique Carers</span>
              <span className="block text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{stats.uniqueStaff}</span>
            </div>
            <span className="h-6 w-6 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold font-mono text-center">
              STF
            </span>
          </div>

          <div className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200 flex items-start justify-between">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cancelled Cover</span>
              <span className="block text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{stats.cancelled}</span>
            </div>
            <span className="h-6 w-6 rounded bg-rose-50 flex items-center justify-center text-rose-600 text-[10px] font-bold font-mono">
              CAN
            </span>
          </div>

          <div className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200 flex items-start justify-between">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Historical Logs</span>
              <span className="block text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{auditLogs.length}</span>
            </div>
            <span className="h-6 w-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold font-mono">
              AUD
            </span>
          </div>

        </div>

        {/* Search & Filter section */}
        <FilterBar
          searchStaff={searchStaff}
          setSearchStaff={setSearchStaff}
          filterHouse={filterHouse}
          setFilterHouse={setFilterHouse}
          filterAgency={filterAgency}
          setFilterAgency={setFilterAgency}
          filterTeamLeader={filterTeamLeader}
          setFilterTeamLeader={setFilterTeamLeader}
          filterStartDate={filterStartDate}
          setFilterStartDate={setFilterStartDate}
          filterEndDate={filterEndDate}
          setFilterEndDate={setFilterEndDate}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          houses={houses}
          agencies={agencies}
          teamLeaders={teamLeaders}
          onClearFilters={handleClearFilters}
        />

        {/* Functional commands & status items header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-0.5">Records List</span>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Staff Shift Bookings
              </h2>
              <span className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                {filteredResolvedBookings.length} matched
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sync trigger */}
            <button
              onClick={loadData}
              disabled={loading}
              type="button"
              className="p-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer flex items-center justify-center bg-white"
              title="Refresh DB Sync"
            >
              <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Audit Logs side drawers */}
            <button
               onClick={() => setIsAuditOpen(true)}
              type="button"
              className="px-3 py-1.5 rounded border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-white shadow-2xs"
            >
              <History className="h-3.5 w-3.5 text-blue-600" />
              Audit Trails
            </button>

            {/* List Configuration Management */}
            <button
              onClick={() => setIsLookupOpen(true)}
              type="button"
              className="px-3 py-1.5 rounded border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-white shadow-2xs"
            >
              <Database className="h-3.5 w-3.5 text-blue-600" />
              Manage Lists
            </button>

            {/* CSV export button */}
            <button
              onClick={handleCSVExport}
              type="button"
              className="px-3 py-1.5 rounded border border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-50/50 text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-white shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              Spreadsheet CSV
            </button>

            {/* New Booking launcher button */}
            <button
              onClick={() => {
                setEditingBooking(null);
                setIsFormOpen(true);
              }}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${getThemeAccentClass()}`}
            >
              <Plus className="h-4 w-4" />
              Book Shift Carer
            </button>
          </div>
        </div>

        {/* Bookings Display Area (Cards) */}
        {loading && bookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
            <RotateCw className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Synchronizing database tables...</p>
            <p className="text-xs text-slate-400 mt-1">Downloading remote configurations and schemas.</p>
          </div>
        ) : filteredResolvedBookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
            <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <CalendarClock className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No matching bookings found</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              Adjust search staff names, date scope bounds or filter parameters or click 'Book Shift Carer' register button.
            </p>
            {bookings.length > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center text-xs font-bold text-indigo-600 underline cursor-pointer"
              >
                Reset Filter Queries
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="bookings-collection">
            {filteredResolvedBookings.map((b) => {
              const isActive = b.status === 'active';
              return (
                <div 
                  key={b.id} 
                  className={`bg-white border rounded-xl shadow-2xs overflow-hidden transition-all duration-300 md:hover:-translate-y-0.5 md:hover:shadow-xs flex flex-col justify-between ${
                    isActive 
                      ? 'border-slate-305' 
                      : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                  id={`booking-card-${b.internal_ref}`}
                >
                  
                  {/* Card Section Header */}
                  <div className="p-3 border-b border-slate-200 bg-slate-50/40">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded border ${getThemeBadgeColor()}`}>
                        {b.internal_ref}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isActive 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    {/* Carer staff detail */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`h-7 w-7 rounded flex items-center justify-center font-extrabold text-[10px] uppercase border ${getThemeBadgeColor()}`}>
                        {b.agency_staff_name ? b.agency_staff_name.split(' ').map(token => token[0]).join('') : 'ST'}
                      </div>
                      <div>
                        <h4 className={`text-xs font-extrabold text-slate-900 ${!isActive ? 'line-through text-slate-400' : ''}`}>
                          {b.agency_staff_name}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">
                          Agency Staff
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Central Details Grid */}
                  <div className="p-3 space-y-2.5 flex-1">
                    
                    {/* Schedule detail */}
                    <div className="text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <CalendarClock className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {new Date(b.shift_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-mono text-slate-700 font-bold bg-amber-50/40 px-1.5 py-0.5 rounded text-[10px] border border-amber-200/50">
                          {b.start_time} - {b.end_time}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">({b.shift_type_name})</span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-200 my-1" />

                    {/* Organization metadata lookup values */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Service/House:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[200px]">{b.house_name}</span>
                      </div>
                      
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Agency:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[200px]">{b.agency_name}</span>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Team Leader:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]">{b.team_leader_name}</span>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Reason:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]">{b.reason_name}</span>
                      </div>

                      {b.authorised_by && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Authorised By:</span>
                          <span className="font-semibold text-slate-755 truncate max-w-[200px]">{b.authorised_by}</span>
                        </div>
                      )}

                      {b.external_ref && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">External Ref:</span>
                          <span className="font-mono font-bold text-blue-700 truncate max-w-[200px] bg-blue-50/40 px-1 rounded">{b.external_ref}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes block */}
                    {b.notes && (
                      <div className="p-1.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-slate-600 line-clamp-2 mt-1.5" title={b.notes}>
                        <span className="font-bold text-[8px] block text-slate-400 uppercase mb-0.5">Manager notes:</span>
                        {b.notes}
                      </div>
                    )}

                    {b.cancellation_reason && (
                      <div className="p-1.5 bg-rose-50 border border-rose-100 rounded text-[11px] font-mono text-rose-700 line-clamp-2 mt-1.5" title={b.cancellation_reason}>
                        <span className="font-bold text-[8px] block text-rose-450 uppercase mb-0.5">Cancellation Reason:</span>
                        {b.cancellation_reason}
                      </div>
                    )}

                  </div>

                  {/* Card Footer actions bar */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-[8px] text-slate-400 block font-mono">
                      By: {String(b.created_by || 'Staff Manager').slice(0, 16)}...
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Email to Outlook & Clipboard Copy Button built for every single box */}
                      <button
                        onClick={() => handleEmailBooking(b)}
                        type="button"
                        className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all uppercase tracking-wide flex items-center gap-1 border shadow-2xs ${
                          copiedId === b.id
                            ? 'bg-emerald-600 border-emerald-700 text-white animate-pulse'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                        title="Copy to clipboard & Send via Outlook"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>{copiedId === b.id ? 'Copied Details!' : 'Outlook Email'}</span>
                      </button>

                      {isActive ? (
                        <>
                          <button
                            onClick={() => handleCancelBooking(b)}
                            disabled={loading}
                            type="button"
                            className="px-2 py-1 border border-rose-300 hover:border-rose-400 text-rose-700 hover:bg-rose-50 text-[10px] font-bold rounded cursor-pointer transition-all uppercase tracking-wide"
                          >
                            Cancel
                          </button>
                          
                          <button
                            onClick={() => {
                              setEditingBooking(b);
                              setIsFormOpen(true);
                            }}
                            type="button"
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded cursor-pointer transition-all uppercase tracking-wide border border-blue-700 shadow-2xs"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] font-semibold text-rose-600 uppercase flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Unmodifiable
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Dynamic Popups, Side Drawers, Modals rendering */}
      {isUserManagementOpen && (
        <UserManagementView
          currentUserEmail={currentUserEmail || ''}
          onClose={() => setIsUserManagementOpen(false)}
        />
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleReloadCredentials}
      />

      <AuditLogView
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={resolvedAuditLogs}
      />

      <LookupManagementView
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        isSandbox={config.isSandbox}
        houses={houses}
        agencies={agencies}
        teamLeaders={teamLeaders}
        onAddHouse={handleAddHouse}
        onRemoveHouse={handleRemoveHouse}
        onAddAgency={handleAddAgency}
        onRemoveAgency={handleRemoveAgency}
        onAddTeamLeader={handleAddTeamLeader}
        onRemoveTeamLeader={handleRemoveTeamLeader}
      />

      <BookingForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBooking(null);
        }}
        onSave={handleSaveBooking}
        editingBooking={editingBooking}
        existingBookings={bookings}
        houses={houses}
        agencies={agencies}
        teamLeaders={teamLeaders}
        shiftTypes={shiftTypes}
        reasons={reasons}
        currentUserEmail={currentUserEmail}
      />

    </div>
  );
}
