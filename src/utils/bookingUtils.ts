import { Booking, BookingResolved } from '../types';

/**
 * Greedily searches the list of existing bookings for a target date (YYYY-MM-DD)
 * and prepares the next sequential numeric tag.
 * Example input: bookings = [], targetDate = '2026-05-21' -> 'BK-20260521-001'
 * If bookings on that date exist (e.g. 'BK-20260521-001', 'BK-20260521-005'),
 * it takes the maximum sequence suffix and increments it to 'BK-20260521-006'.
 */
export function generateReferenceNumber(bookings: Booking[], targetDate: string): string {
  // Extract date part in format YYYYMMDD
  const dateFormatted = targetDate.replace(/-/g, '');
  if (!/^\d{8}$/.test(dateFormatted)) {
    // Fallback if date is invalid or empty
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `BK-${yyyy}${mm}${dd}-001`;
  }

  const prefix = `BK-${dateFormatted}`;
  
  // Find bookings on that day
  const sameDayBookings = bookings.filter(b => {
    return b.internal_ref && b.internal_ref.startsWith(prefix);
  });

  if (sameDayBookings.length === 0) {
    return `${prefix}-001`;
  }

  let maxSequence = 0;
  sameDayBookings.forEach(b => {
    // Suffix is after the last dash
    const parts = b.internal_ref.split('-');
    const suffix = parts[parts.length - 1];
    const seq = parseInt(suffix, 10);
    if (!isNaN(seq) && seq > maxSequence) {
      maxSequence = seq;
    }
  });

  const nextSequence = maxSequence + 1;
  const seqPadded = String(nextSequence).padStart(3, '0');
  return `${prefix}-${seqPadded}`;
}

/**
 * Exports lists of resolved bookings to a CSV formatted spreadsheet.
 * Required columns: internal_ref, service_house, agency, agency_staff_name, team_leader, shift_date, start_time, end_time, shift_type, reason, status.
 */
export function exportToCSV(bookings: BookingResolved[]) {
  const headers = [
    'internal_ref',
    'service_house',
    'agency',
    'agency_staff_name',
    'team_leader',
    'shift_date',
    'start_time',
    'end_time',
    'shift_type',
    'reason',
    'status'
  ];

  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    // Replace all double quotes with two double quotes
    str = str.replace(/"/g, '""');
    // Wrap values containing commas, quotes, or new lines in double quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str}"`;
    }
    return str;
  };

  const rows = bookings.map(b => [
    escapeCSV(b.internal_ref),
    escapeCSV(b.house_name),
    escapeCSV(b.agency_name),
    escapeCSV(b.agency_staff_name),
    escapeCSV(b.team_leader_name),
    escapeCSV(b.shift_date),
    escapeCSV(b.start_time),
    escapeCSV(b.end_time),
    escapeCSV(b.shift_type_name),
    escapeCSV(b.reason_name),
    escapeCSV(b.status.toUpperCase())
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const nowStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `agency-bookings-export-${nowStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Executes post request to End-point '/api/send-email'.
 * Call /api/send-email (Netlify function) with JSON: { to, teamLeaderName, service, shiftDate, startTime, endTime, shiftType, internalRef }.
 */
export async function triggerNetlifyFunction(booking: BookingResolved, teamLeaderEmail?: string): Promise<boolean> {
  const recipientEmail = teamLeaderEmail || booking.team_leader_email || "team-leader-inbox@example.com";
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: recipientEmail,
        teamLeaderName: booking.team_leader_name,
        service: booking.house_name,
        shiftDate: booking.shift_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        shiftType: booking.shift_type_name,
        internalRef: booking.internal_ref
      })
    });

    if (response.ok) {
      console.log('Email successfully notified to Netlify API endpoint.');
      return true;
    } else {
      console.warn('Netlify function send-email responded with status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('Netlify function send-email warning: endpoint lookup failed or timed out:', error);
    return false;
  }
}
