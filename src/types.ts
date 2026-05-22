export interface LookupItem {
  id: string | number;
  name: string;
}

export interface TeamLeaderItem extends LookupItem {
  email?: string;
}

export interface Booking {
  id: string; // UUID from Supabase or generated locally
  internal_ref: string; // BK-YYYYMMDD-001
  service_house: string | number | null; // house FK
  agency: string | number | null; // agency FK
  team_leader: string | number | null; // team leader FK
  shift_type: string | number | null; // shift type FK
  reason: string | number | null; // reason FK
  agency_staff_name: string; // carer name
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: 'active' | 'cancelled';
  notes: string;
  authorised_by: string; // authorised by
  booking_made_at: string; // ISO string / timestamp
  external_ref: string; // external reference
  cancellation_reason?: string; // cancellation reason if cancelled
  // For UI local reference tracker
  created_by?: string; // fallback tracking
}

export interface BookingResolved extends Booking {
  house_name: string;
  agency_name: string;
  team_leader_name: string;
  team_leader_email?: string;
  shift_type_name: string;
  reason_name: string;
}

export interface AuditLogItem {
  id: string | number;
  booking_id: string;
  changed_by: string; // Email of user
  field_name: string;
  old_value: string;
  new_value: string;
  changed_at: string; // maps to Supabase audit_log table
  booking_ref?: string; // UI resolver
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isSandbox: boolean; // True if using local/sandbox fallback data
}

export interface PortalUser {
  id: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'manager';
  created_at: string;
}


