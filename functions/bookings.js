'use strict';

/**
 * IBARBEAR - Cloud Functions v2 para agendamento publico.
 * Duas funcoes callable: getPublicAvailability e createPublicBooking.
 * Executam exclusivamente no banco nomeado indicado em FIRESTORE_DATABASE_ID.
 *
 * Antes de producao: habilitar Firebase App Check + protecao contra abuso,
 * revisar horarios/duracoes comerciais e testar a migracao de agendamentos.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createHash, randomBytes } = require('node:crypto');

const firebaseApp = getApps().length ? getApps()[0] : initializeApp();
const databaseId = process.env.FIRESTORE_DATABASE_ID;
if (!databaseId || databaseId === '(default)') {
  throw new Error('Defina FIRESTORE_DATABASE_ID com o identificador do banco nomeado IBARBEAR.');
}
const db = getFirestore(firebaseApp, databaseId);

// Diagnostico de conexao: aparece no terminal quando o Functions Emulator carrega o arquivo.
const emuladorFunctions = process.env.FUNCTIONS_EMULATOR === 'true';
const hostEmuladorFirestore = process.env.FIRESTORE_EMULATOR_HOST || '';
const projetoAtual = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'Nao informado';

// Protecao: durante testes locais, nunca permita um Functions Emulator sem Firestore Emulator.
if ((emuladorFunctions || projetoAtual.startsWith('demo-')) && !hostEmuladorFirestore) {
  throw new Error(
    '[IBARBEAR] SEGURANCA: FIRESTORE_EMULATOR_HOST nao configurado. ' +
    'Inicie os emuladores Firestore e Functions juntos antes de testar reservas.'
  );
}

console.log('[IBARBEAR] Diagnostico do Firebase:', {
  projeto: projetoAtual,
  banco: databaseId,
  functionsEmulator: emuladorFunctions,
  firestoreEmulator: hostEmuladorFirestore || 'NAO CONFIGURADO',
});
const region = 'southamerica-east1';
const TIME_ZONE = 'America/Sao_Paulo'; // Ajustar por estabelecimento se houver fuso diferente.
const SLOTS = [
  '09:00', '09:40', '10:20', '11:00', '11:40', '13:00',
  '13:40', '14:20', '15:00', '15:40', '16:20', '17:00',
  '17:40', '18:20', '19:00', '19:40',
];

function textField(obj, key, max = 100) {
  const value = obj?.[key];
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `Campo ${key} invalido.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new HttpsError('invalid-argument', `Campo ${key} invalido.`);
  return trimmed;
}

function optionalText(obj, key, max = 250) {
  const value = obj?.[key];
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `Campo ${key} invalido.`);
  }
  return value.trim();
}

function validateId(value, field) {
  if (value.length > 120 || /[\/]/.test(value) || value === '.' || value === '..') {
    throw new HttpsError('invalid-argument', `${field} invalido.`);
  }
}

function timeMinutes(time) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hh, mm] = time.split(':').map(Number);
  return hh * 60 + mm;
}

function localNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function validateDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}T12:00:00Z`)) ||
      new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new HttpsError('invalid-argument', 'Data invalida.');
  }
  const now = localNow();
  if (date < now.date) throw new HttpsError('failed-precondition', 'Nao e possivel reservar uma data passada.');
  const days = (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${now.date}T12:00:00Z`)) / 86400000;
  if (days > 180) throw new HttpsError('failed-precondition', 'Data muito distante.');
}

function durationOf(booking, serviceDurationMap) {
  const duration = Number(booking.durationMinutes || serviceDurationMap.get(booking.serviceId) || 40);
  return Number.isFinite(duration) && duration > 0 ? duration : 40;
}

function overlaps(start1, duration1, start2, duration2) {
  return start1 < start2 + duration2 && start2 < start1 + duration1;
}

async function readDailyBookings(shopSlug, date, tx) {
  const q = db.collection('bookings')
    .where('shopSlug', '==', shopSlug)
    .where('date', '==', date);
  const snapshot = tx ? await tx.get(q) : await q.get();
  return snapshot.docs.map((d) => d.data());
}

async function readDurations(bookings) {
  const ids = [...new Set(bookings.filter((b) => b.serviceId && !b.durationMinutes).map((b) => b.serviceId))];
  const map = new Map();
  await Promise.all(ids.map(async (id) => {
    if (typeof id !== 'string' || id.includes('/')) return;
    const snap = await db.collection('services').doc(id).get();
    if (snap.exists) map.set(id, snap.data()?.durationMinutes);
  }));
  return map;
}

function conflictFound(bookings, barberId, start, duration, serviceDurationMap) {
  return bookings.some((b) => b.barberId === barberId && b.status !== 'canceled' &&
    overlaps(start, duration, timeMinutes(b.time), durationOf(b, serviceDurationMap)));
}

async function readBarbers(shopSlug, selectedBarberId) {
  if (selectedBarberId !== 'any') {
    validateId(selectedBarberId, 'barberId');
    const snap = await db.collection('barbers').doc(selectedBarberId).get();
    if (!snap.exists || snap.data()?.shopSlug !== shopSlug || snap.data()?.active !== true) {
      throw new HttpsError('not-found', 'Profissional indisponivel.');
    }
    return [{ id: snap.id, ...snap.data() }];
  }
  const snap = await db.collection('barbers').where('shopSlug', '==', shopSlug).get();
  return snap.docs.filter((d) => d.data()?.active === true).map((d) => ({ id: d.id, ...d.data() }));
}

async function readService(serviceId, shopSlug) {
  validateId(serviceId, 'serviceId');
  const snap = await db.collection('services').doc(serviceId).get();
  if (!snap.exists || snap.data()?.shopSlug !== shopSlug || snap.data()?.active !== true) {
    throw new HttpsError('not-found', 'Servico indisponivel.');
  }
  const duration = Number(snap.data().durationMinutes);
  if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
    throw new HttpsError('failed-precondition', 'Duracao do servico invalida.');
  }
  return { id: snap.id, ...snap.data(), durationMinutes: duration };
}

function lockRefs(shopSlug, barberId, date, start, duration) {
  const refs = [];
  for (let minute = Math.floor(start / 5) * 5; minute < start + duration; minute += 5) {
    const key = createHash('sha256')
      .update(JSON.stringify([shopSlug, barberId, date, minute]))
      .digest('hex');
    refs.push(db.collection('bookingLocks').doc(key));
  }
  return refs;
}

// IBARBEAR_ETAPA42: validacao financeira no BACKEND, independentemente das regras Firestore.
// Somente o Admin SDK autorizado pode atualizar subscriptionStatus e vencimento.
async function assertActiveSubscription(shopSlug, shopData) {
  const ownerUid = shopData && typeof shopData.ownerUid === 'string' ? shopData.ownerUid : '';
  if (!ownerUid) throw new HttpsError('failed-precondition', 'Agendamentos indisponiveis.');
  const ownerSnap = await db.collection('users').doc(ownerUid).get();
  const owner = ownerSnap.exists ? ownerSnap.data() : null;
  const expiry = owner && typeof owner.subscriptionExpiresAt === 'string'
    ? Date.parse(owner.subscriptionExpiresAt) : NaN;
  if (!owner || owner.shopSlug !== shopSlug ||
      !['active','expiring'].includes(owner.subscriptionStatus) ||
      !Number.isFinite(expiry) || expiry <= Date.now()) {
    throw new HttpsError('failed-precondition', 'Agendamentos indisponiveis.');
  }
}

exports.getPublicAvailability = onCall({ region }, async (request) => {
  const payload = request.data || {};
  const shopSlug = textField(payload, 'shopSlug', 120);
  const barberId = textField(payload, 'barberId', 120);
  const date = textField(payload, 'date', 10);
  validateId(shopSlug, 'shopSlug');
  validateDate(date);
  const shop = await db.collection('shops').doc(shopSlug).get();
  if (!shop.exists) throw new HttpsError('not-found', 'Barbearia nao encontrada.');
  await assertActiveSubscription(shopSlug, shop.data());
  const barbers = await readBarbers(shopSlug, barberId);
  if (barbers.length === 0) return { slots: [] };
  const serviceId = optionalText(payload, 'serviceId', 120);
  const duration = serviceId ? (await readService(serviceId, shopSlug)).durationMinutes : 40;
  const bookings = await readDailyBookings(shopSlug, date);
  const durationMap = await readDurations(bookings);
  const now = localNow();
  const slots = SLOTS.filter((slot) => {
    if (date === now.date && slot <= now.time) return false;
    return barbers.some((barber) => !conflictFound(
      bookings, barber.id, timeMinutes(slot), duration, durationMap
    ));
  });
  return { slots };
});

exports.createPublicBooking = onCall({ region }, async (request) => {
  const data = request.data || {};
  const shopSlug = textField(data, 'shopSlug', 120);
  const serviceId = textField(data, 'serviceId', 120);
  const requestedBarberId = textField(data, 'barberId', 120);
  const date = textField(data, 'date', 10);
  const time = textField(data, 'time', 5);
  const customerName = textField(data, 'customerName', 100);
  const customerPhone = textField(data, 'customerPhone', 24);
  const customerEmail = optionalText(data, 'customerEmail', 200);
  const notes = optionalText(data, 'notes', 500);
  validateId(shopSlug, 'shopSlug');
  validateDate(date);
  if (!SLOTS.includes(time)) throw new HttpsError('invalid-argument', 'Horario invalido.');
  if (date === localNow().date && time <= localNow().time) {
    throw new HttpsError('failed-precondition', 'Esse horario ja passou.');
  }
  if (customerName.length < 2 || customerPhone.replace(/\D/g, '').length < 8) {
    throw new HttpsError('invalid-argument', 'Nome ou telefone invalido.');
  }
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new HttpsError('invalid-argument', 'Email invalido.');
  }
  const [shopSnap, service, barbers] = await Promise.all([
    db.collection('shops').doc(shopSlug).get(),
    readService(serviceId, shopSlug),
    readBarbers(shopSlug, requestedBarberId),
  ]);
  if (!shopSnap.exists) throw new HttpsError('not-found', 'Barbearia nao encontrada.');
  await assertActiveSubscription(shopSlug, shopSnap.data());
  if (!barbers.length) throw new HttpsError('failed-precondition', 'Nenhum profissional disponivel.');

  // Para 'qualquer profissional', testa os profissionais por ordem.
  for (const barber of barbers) {
    const start = timeMinutes(time);
    const refs = lockRefs(shopSlug, barber.id, date, start, service.durationMinutes);
    const bookingId = `BK-${randomBytes(9).toString('hex').toUpperCase()}`;
    const bookingRef = db.collection('bookings').doc(bookingId);
    const booking = {
      id: bookingId, shopSlug,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      durationMinutes: service.durationMinutes,
      barberId: barber.id,
      barberName: barber.name,
      customerName, customerPhone, customerEmail, date, time, notes,
      status: 'pending', createdAt: new Date().toISOString(),
    };
    try {
      // Checa reservas legadas e coloca travas de 5 minutos na mesma transacao.
      await db.runTransaction(async (tx) => {
        const existing = await readDailyBookings(shopSlug, date, tx);
        const durationMap = await readDurations(existing);
        // Todas as leituras transacionais devem ocorrer antes de qualquer escrita.
        const locks = await Promise.all(refs.map((ref) => tx.get(ref)));
        if (conflictFound(existing, barber.id, start, service.durationMinutes, durationMap) ||
            locks.some((lock) => lock.exists && lock.data()?.bookingId)) {
          // Um lock de reserva cancelada/deletada pode ser recuperado abaixo.
          const blockers = locks.filter((lock) => lock.exists && lock.data()?.bookingId);
          for (const blocker of blockers) {
            const lockedBookingId = blocker.data().bookingId;
            let existingBooking = existing.find((b) => b.id === lockedBookingId);
            if (!existingBooking) {
              // Reserva deletada/cancelada: o lock antigo pode ser reaproveitado.
              // Ler no mesmo transaction protege contra alteracoes concorrentes.
              if (typeof lockedBookingId !== 'string' || lockedBookingId.includes('/')) {
                throw new HttpsError('failed-precondition', 'Lock de reserva invalido.');
              }
              const lockedSnap = await tx.get(db.collection('bookings').doc(lockedBookingId));
              existingBooking = lockedSnap.exists ? lockedSnap.data() : null;
            }
            if (existingBooking && existingBooking.status !== 'canceled') {
              throw new HttpsError('already-exists', 'O horario acabou de ser reservado.');
            }
          }
          if (conflictFound(existing, barber.id, start, service.durationMinutes, durationMap)) {
            throw new HttpsError('already-exists', 'O horario acabou de ser reservado.');
          }
        }
        tx.create(bookingRef, booking);
        for (const ref of refs) {
          tx.set(ref, { bookingId, shopSlug, barberId: barber.id, date, time, updatedAt: new Date().toISOString() });
        }
      });
      return { booking };
    } catch (error) {
      if (error instanceof HttpsError && error.code === 'already-exists') {
        if (requestedBarberId === 'any') continue;
        throw error;
      }
      throw error;
    }
  }
  throw new HttpsError('already-exists', 'Nao ha profissionais disponiveis nesse horario.');
});
