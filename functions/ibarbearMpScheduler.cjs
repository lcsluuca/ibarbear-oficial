'use strict';
/**
 * IBARBEAR: scheduled Mercado Pago reconciliation, intentionally disabled by default.
 * This is the runtime coordinator only: all payment evidence checks and Firestore
 * financial transactions remain in the existing billing module.
 * NEVER enable without validating real recurring payment API responses.
 */
const { randomBytes } = require('node:crypto');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const billing = require('./ibarbearMpBilling.cjs');

const PROJECT_ID = 'potent-cedar-342513';
const DB_ID = 'ai-studio-ibarbear-a5719ffb-8768-4d2d-b8e3-92766caf88b3';
const MAX_PER_RUN = 3;
const LEASE_MS = 600000;
const accessToken = defineSecret('IBARBEAR_MP_ACCESS_TOKEN');
const app = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(app, DB_ID);

function isEnabled(env = process.env) {
  const project = env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT || env.GCP_PROJECT;
  return project === PROJECT_ID &&
    env.FUNCTIONS_EMULATOR !== 'true' &&
    !env.FIRESTORE_EMULATOR_HOST &&
    !env.FIREBASE_AUTH_EMULATOR_HOST &&
    (!env.FIRESTORE_DATABASE_ID || env.FIRESTORE_DATABASE_ID === DB_ID) &&
    env.IBARBEAR_BILLING_ENABLED === 'true' &&
    env.IBARBEAR_SCHEDULED_RECONCILE_ENABLED === 'true';
}
function validId(x) { return typeof x === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(x); }
function safeResult(x) { return String(x?.code || 'unknown').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64); }
function getToken() {
  const val = accessToken.value();
  if (typeof val !== 'string' || val.length < 20 || /[\r\n]/.test(val)) throw new Error('secret_invalid');
  return val;
}

async function run() {
  if (!isEnabled()) {
    console.info('IBARBEAR MP scheduled reconciliation: sealed');
    return { code: 'sealed' };
  }
  // Do not obtain credentials or read financial records while sealed.
  const token = getToken();
  const stateRef = db.collection('mpBillingScheduler').doc('cursor');
  const leaseToken = randomBytes(16).toString('hex');
  const acquiredAtMs = Date.now();
  const entry = await db.runTransaction(async tx => {
    const snap = await tx.get(stateRef);
    const old = snap.exists ? snap.data() : {};
    if (Number(old.leaseUntilMs || 0) > acquiredAtMs) return null;
    tx.set(stateRef, {
      leaseToken,
      leaseUntilMs: acquiredAtMs + LEASE_MS,
      lastStartedAt: new Date(acquiredAtMs).toISOString(),
    }, { merge: true });
    return { lastId: validId(old.lastId) ? old.lastId : null };
  });
  if (!entry) return { code: 'another_run_in_progress' };

  let lastProcessedId = entry.lastId;
  let processed = 0;
  let needsReview = 0;
  let hadError = false;
  try {
    const collection = db.collection('mpBillingBindings');
    let query = collection.orderBy('__name__');
    if (entry.lastId) {
      const cursorSnapshot = await collection.doc(entry.lastId).get();
      if (cursorSnapshot.exists) query = query.startAfter(cursorSnapshot);
      else lastProcessedId = null;
    }
    let page = await query.limit(MAX_PER_RUN).get();
    // Rotate through the bindings fairly, rather than always processing the first 3.
    if (page.empty && entry.lastId) {
      lastProcessedId = null;
      page = await collection.orderBy('__name__').limit(MAX_PER_RUN).get();
    }
    for (const snap of page.docs) {
      const data = snap.data();
      lastProcessedId = snap.id;
      if (!validId(snap.id) || data?.providerSubscriptionId !== snap.id ||
          !validId(data.ownerUid) || !validId(data.shopSlug)) {
        needsReview++;
        console.warn('IBARBEAR scheduler: binding identity needs review');
        continue;
      }
      try {
        const result = await billing.reconcileSubscription(snap.id, token);
        const code = safeResult(result);
        processed++;
        if (!new Set([
          'subscription_not_authorized', 'subscription_lifecycle_recorded',
          'payments_verified', 'reversals_verified', 'no_approved_payment_evidence',
        ]).has(code)) needsReview++;
        console.info('IBARBEAR scheduler: reconciled', code);
      } catch (e) {
        hadError = true;
        needsReview++;
        console.error('IBARBEAR scheduler: provider or Firestore unavailable (redacted)');
      }
    }
  } catch (e) {
    hadError = true;
    console.error('IBARBEAR scheduler: page unavailable (redacted)');
  } finally {
    // Release only our own lease, avoiding one run overwriting another's state.
    await db.runTransaction(async tx => {
      const snap = await tx.get(stateRef);
      if (!snap.exists || snap.data().leaseToken !== leaseToken) return;
      tx.update(stateRef, {
        lastId: lastProcessedId || null,
        leaseUntilMs: 0,
        leaseToken: null,
        lastFinishedAt: new Date().toISOString(),
        lastResult: hadError ? 'partial_retry_on_next_cycle' : needsReview ? 'review_required' : 'completed',
        lastProcessedCount: processed,
        lastReviewCount: needsReview,
      });
    });
  }
  return { code: hadError ? 'partial_retry_on_next_cycle' : 'completed', processed, needsReview };
}

const scheduledReconcile = onSchedule({
  schedule: 'every 6 hours',
  timeZone: 'Etc/UTC',
  region: 'southamerica-east1',
  secrets: [accessToken],
  timeoutSeconds: 540,
  memory: '256MiB',
}, run);

module.exports = { scheduledReconcile, isEnabled, run };
