import type { BookingStatus } from '../types';

export interface Patient {
  name: string;
  /** Stored in E.164 so notifications and WhatsApp links are country-agnostic. */
  phone: string;
}

export interface Booking {
  code: string;
  date: string; // ISO YYYY-MM-DD
  time: string; // HH:MM, slot start
  serviceId: string;
  patient: Patient;
  status: BookingStatus;
  createdAt: string; // ISO timestamp
  cancelledAt?: string; // ISO timestamp, set when cancelled
  remindedAt?: string; // ISO timestamp, set when a confirmation reminder was sent
}
