'use strict';

/*
 * IBARBEAR - Teste de eventos de assinatura
 *
 * SOMENTE FIREBASE EMULATOR.
 * Nao recebe eventos reais do Mercado Pago.
 * Nao aprova pagamentos.
 * Nao altera usuarios ou assinaturas.
 */

const crypto = require('node:crypto');

const { onRequest } =
  require('firebase-functions/v2/https');

const { getApps, initializeApp } =
  require('firebase-admin/app');

const {
  getFirestore,
  FieldValue
} = require('firebase-admin/firestore');

const PROJECT_ID = 'demo-ibarbear';

const DATABASE_ID =
  'ai-studio-ibarbear-a5719ffb-8768-4d2d-b8e3-92766caf88b3';

const app = getApps().length
  ? getApps()[0]
  : initializeApp();

function hash(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function textoValido(value) {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9_-]{1,128}$/.test(value)
  );
}

exports.recordSubscriptionEventTest = onRequest(
  { region: 'us-central1', cors: false },
  async (req, res) => {

    // Bloqueio duplo: projeto de teste e emuladores.
    const isEmulator =
      process.env.FUNCTIONS_EMULATOR === 'true' &&
      Boolean(process.env.FIRESTORE_EMULATOR_HOST) &&
      process.env.GCLOUD_PROJECT === PROJECT_ID;

    if (!isEmulator) {
      return res.status(404).json({
        success: false,
        code: 'not_available'
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        code: 'method_not_allowed'
      });
    }

    if (!req.is('application/json')) {
      return res.status(415).json({
        success: false,
        code: 'json_required'
      });
    }

    const {
      deliveryId,
      eventType,
      action,
      resourceId
    } = req.body || {};

    if (
      !textoValido(deliveryId) ||
      !textoValido(eventType) ||
      !textoValido(action) ||
      !textoValido(resourceId)
    ) {
      return res.status(400).json({
        success: false,
        code: 'invalid_test_event'
      });
    }

    const payloadHash = hash(JSON.stringify({
      eventType,
      action,
      resourceId
    }));

    const eventId = hash(deliveryId);

    try {
      const db = getFirestore(app, DATABASE_ID);

      const ref = db
        .collection('mp_event_tests')
        .doc(eventId);

      const result = await db.runTransaction(
        async (transaction) => {

          const existing = await transaction.get(ref);

          if (existing.exists) {
            if (
              existing.get('payloadHash') !== payloadHash
            ) {
              return { conflict: true };
            }

            return { created: false };
          }

          transaction.create(ref, {
            deliveryId,
            eventType,
            action,
            resourceId,
            payloadHash,
            state: 'received_unverified',
            financiallyApproved: false,
            source: 'firebase_emulator_test',
            receivedAt: FieldValue.serverTimestamp()
          });

          return { created: true };
        }
      );

      if (result.conflict) {
        return res.status(409).json({
          success: false,
          code: 'delivery_id_conflict'
        });
      }

      return res.status(200).json({
        success: true,
        created: result.created,
        duplicate: !result.created,
        eventId,
        state: 'received_unverified',
        financiallyApproved: false
      });

    } catch (error) {
      console.error(
        '[IBARBEAR] Falha no teste de evento:',
        error
      );

      return res.status(503).json({
        success: false,
        code: 'storage_unavailable'
      });
    }
  }
);