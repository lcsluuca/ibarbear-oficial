/**
 * IBARBEAR - agendamentos publicos via Cloud Functions.
 * O frontend nunca consulta os documentos privados de bookings.
 */
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { app, USE_FIREBASE_EMULATORS } from './firebase';
import type { Booking } from '../types';

const functions = getFunctions(app, 'southamerica-east1');

if (USE_FIREBASE_EMULATORS) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  console.info('[IBARBEAR] Functions Emulator conectado: 127.0.0.1:5001');
}

type BookingInput = Pick<
  Booking,
  'serviceId' | 'barberId' | 'date' | 'time' | 'customerName' | 'customerPhone'
> & Partial<Pick<Booking, 'customerEmail' | 'notes'>>;

type AvailabilityInput = {
  shopSlug: string;
  barberId: string;
  date: string;
  serviceId?: string;
};

const fetchSlots = httpsCallable<AvailabilityInput, { slots: string[] }>(
  functions,
  'getPublicAvailability'
);

const submitBooking = httpsCallable<
  BookingInput & { shopSlug: string },
  { booking: Booking }
>(functions, 'createPublicBooking');

export async function getAvailableSlotsSecure(
  shopSlug: string,
  barberId: string,
  date: string,
  serviceId?: string
): Promise<string[]> {
  const response = await fetchSlots({ shopSlug, barberId, date, serviceId });
  if (!Array.isArray(response.data?.slots) ||
      !response.data.slots.every((slot) => typeof slot === 'string')) {
    throw new Error('Resposta invalida ao consultar os horarios disponiveis.');
  }
  return response.data.slots;
}

export async function createBookingSecureAsync(
  shopSlug: string,
  data: BookingInput
): Promise<Booking> {
  const response = await submitBooking({
    shopSlug,
    serviceId: data.serviceId,
    barberId: data.barberId,
    date: data.date,
    time: data.time,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || '',
    notes: data.notes || '',
  });
  if (!response.data?.booking?.id) {
    throw new Error('O servidor nao confirmou a reserva. Tente novamente.');
  }
  return response.data.booking;
}
