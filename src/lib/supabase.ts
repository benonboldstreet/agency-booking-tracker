import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Booking, AuditLogItem, LookupItem, TeamLeaderItem } from '../types';

// Default Demo / Mock Data for Sandbox Mode
export const DEFAULT_HOUSES: LookupItem[] = [
  { id: 1, name: 'Meadow View House' },
  { id: 2, name: 'Oakridge Care Home' },
  { id: 3, name: 'Riverdale Lodge' },
  { id: 4, name: 'Pinecrest Center' },
  { id: 5, name: 'Willow Residential' }
];

export const DEFAULT_AGENCIES: LookupItem[] = [
  { id: 10, name: 'Apex Health Staffing' },
  { id: 11, name: 'Pulse Premium Nursing' },
  { id: 12, name: 'CareFirst Agency' },
  { id: 13, name: 'Elite Support Medical' },
  { id: 14, name: 'MedTemps Ltd' }
];

export const DEFAULT_TEAM_LEADERS: TeamLeaderItem[] = [
  { id: 101, name: 'Sarah Jenkins', email: 'sarah.jenkins@example.com' },
  { id: 102, name: 'Michael Chang', email: 'michael.chang@example.com' },
  { id: 103, name: 'Amina Yousuf', email: 'amina.yousuf@example.com' },
  { id: 104, name: 'David Patterson', email: 'david.patterson@example.com' }
];

export const DEFAULT_SHIFT_TYPES: LookupItem[] = [
  { id: 'S1', name: 'Day Shift (08:00 - 20:00)' },
  { id: 'S2', name: 'Night Shift (20:00 - 08:00)' },
  { id: 'S3', name: 'Early Shift (07:30 - 15:30)' },
  { id: 'S4', name: 'Late Shift (15:00 - 23:00)' }
];

export const DEFAULT_REASONS: LookupItem[] = [
  { id: 'R1', name: 'Sickness Cover' },
  { id: 'R2', name: 'Annual Leave' },
  { id: 'R3', name: 'Maternity/Paternity Leave' },
  { id: 'R4', name: 'Increased Occupancy Level' },
  { id: 'R5', name: 'Ad-hoc Emergency Cover' }
];

export const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'b-1',
    internal_ref: 'BK-20260520-001',
    service_house: 1,
    agency: 10,
    team_leader: 101,
    shift_type: 'S1',
    reason: 'R1',
    agency_staff_name: 'John Doe',
    shift_date: '2026-05-20',
    start_time: '08:00',
    end_time: '20:00',
    status: 'active',
    notes: 'Covering short notice sickness of permanent carer.',
    authorised_by: 'Supervisor Alpha',
    booking_made_at: '2026-05-20T10:00:00Z',
    external_ref: 'EXT-5001'
  },
  {
    id: 'b-2',
    internal_ref: 'BK-20260521-001',
    service_house: 3,
    agency: 12,
    team_leader: 103,
    shift_type: 'S2',
    reason: 'R2',
    agency_staff_name: 'Elena Rostova',
    shift_date: '2026-05-21',
    start_time: '20:00',
    end_time: '08:00',
    status: 'active',
    notes: 'Pre-planned annual leave cover.',
    authorised_by: 'Supervisor Beta',
    booking_made_at: '2026-05-21T08:00:00Z',
    external_ref: 'EXT-5002'
  },
  {
    id: 'b-3',
    internal_ref: 'BK-20260521-002',
    service_house: 2,
    agency: 11,
    team_leader: 102,
    shift_type: 'S3',
    reason: 'R4',
    agency_staff_name: 'Marcus Smith',
    shift_date: '2026-05-21',
    start_time: '07:30',
    end_time: '15:30',
    status: 'cancelled',
    notes: 'Required due to custom level escalation. Cancelled since family cover was arranged.',
    authorised_by: 'Manager Gold',
    booking_made_at: '2026-05-21T08:30:00Z',
    external_ref: 'EXT-5003',
    cancellation_reason: 'Cover no longer needed'
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'a-1',
    booking_id: 'b-3',
    changed_by: 'manager@agencybooking.com',
    field_name: 'status',
    old_value: 'active',
    new_value: 'cancelled',
    changed_at: '2026-05-21T08:45:00Z',
    booking_ref: 'BK-20260521-002'
  }
];

// Settings keys for localstorage
const STORAGE_KEYS = {
  URL: 'agency_booking_supabase_url',
  KEY: 'agency_booking_supabase_anon_key',
  SANDBOX: 'agency_booking_sandbox_enabled'
};

// Default setup values from active Supabase configuration
const DEFAULT_SUPABASE_URL = 'https://agokoesbixesteqhtanb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_2K_PjXu2DgdQZY9xccjweA_kn5Yy97t';

// Retrieve configured credentials, falling back to preset values
export function getSavedCredentials() {
  const localUrl = localStorage.getItem(STORAGE_KEYS.URL) ?? DEFAULT_SUPABASE_URL;
  const localKey = localStorage.getItem(STORAGE_KEYS.KEY) ?? DEFAULT_SUPABASE_ANON_KEY;
  const isSandbox = localStorage.getItem(STORAGE_KEYS.SANDBOX) === 'true';
  
  return {
    url: localUrl,
    anonKey: localKey,
    isSandbox: isSandbox
  };
}

// Save credentials
export function saveCredentials(url: string, key: string, isSandbox: boolean) {
  localStorage.setItem(STORAGE_KEYS.URL, url);
  localStorage.setItem(STORAGE_KEYS.KEY, key);
  localStorage.setItem(STORAGE_KEYS.SANDBOX, isSandbox.toString());
}

// Clear credentials
export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEYS.URL);
  localStorage.removeItem(STORAGE_KEYS.KEY);
  localStorage.setItem(STORAGE_KEYS.SANDBOX, 'false');
}

// Instantiate Supabase client or null
let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isSandbox } = getSavedCredentials();
  
  if (isSandbox || !url || !anonKey) {
    cachedClient = null;
    return null;
  }

  // Optimize and prevent re-initialization if same credentials
  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedUrl = url;
    cachedKey = anonKey;
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}
