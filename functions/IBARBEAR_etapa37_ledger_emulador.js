'use strict';
/**
 * FUNCAO EXCLUSIVA DO FIREBASE EMULATOR. NAO FAZER DEPLOY.
 * Cliente envia SOMENTE testRunId e scenario. Dados financeiros ficticios
 * sao criados no servidor; nao recebe UID/email/pagamento/assinatura do cliente.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const core = require('./IBARBEAR_etapa37_ledger_core.cjs');

const PROJECT_ID = 'demo-ibarbear';
const DATABASE_ID = 'ai-studio-ibarbear-a5719ffb-8768-4d2d-b8e3-92766caf88b3';

function emulatorOnly() {
  return process.env.FUNCTIONS_EMULATOR === 'true' &&
    process.env.GCLOUD_PROJECT === PROJECT_ID &&
    process.env.FIRESTORE_DATABASE_ID === DATABASE_ID &&
    ['127.0.0.1:8080', 'localhost:8080'].includes(process.env.FIRESTORE_EMULATOR_HOST) &&
    ['127.0.0.1:9099', 'localhost:9099'].includes(process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

const app = emulatorOnly()
  ? (getApps().length ? getApps()[0] : initializeApp({ projectId: PROJECT_ID }))
  : null;

exports.recordFinancialLedgerTest37 = onRequest(
  { region: 'us-central1', cors: false, maxInstances: 1, memory: '256MiB' },
  async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!emulatorOnly() || !app) {
      return res.status(404).json({ success: false, code: 'not_available' });
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, code: 'method_not_allowed' });
    }
    if (!req.is('application/json')) {
      return res.status(415).json({ success: false, code: 'json_required' });
    }
    if (req.rawBody && req.rawBody.length > 2048) {
      return res.status(413).json({ success: false, code: 'test_request_too_large' });
    }
    const b = req.body;
    if (!b || typeof b !== 'object' || Array.isArray(b) ||
        Object.keys(b).length !== 2 ||
        !/^[A-Za-z0-9_-]{8,64}$/.test(b.testRunId || '') ||
        !core.SCENARIOS.includes(b.scenario)) {
      return res.status(400).json({ success: false, code: 'invalid_test_request' });
    }
    try {
      const db = getFirestore(app, DATABASE_ID);
      const op = core.fakeOperation(b.testRunId, b.scenario === 'yearly' ? 'yearly' : 'monthly');
      const opDoc = db.collection(core.COLLECTIONS.operations)
        .doc(core.digest('e37-opdoc|' + b.testRunId));
      // Operacao autoritativa de testes, separada das reservas PHP reais.
      await db.runTransaction(async tx => {
        const snapshot = await tx.get(opDoc);
        if (!snapshot.exists) tx.create(opDoc, op);
      });
      const e = core.fakeEvidence(b.testRunId, b.scenario);
      const result = await core.recordSimulatedLedger(db, e);
      const safe = {
        success: result.status === 200,
        code: result.code, created: result.created, duplicate: result.duplicate,
        state: 'simulation_only', providerVerified: false,
        financiallyApproved: false, subscriptionActivated: false,
        paymentDocId: result.paymentDocId || null,
        cycleDocId: result.cycleDocId || null,
        deliveryDocId: result.deliveryDocId || null
      };
      return res.status(result.status).json(safe);
    } catch (err) {
      console.error('[IBARBEAR E37] Falha no Firestore Emulator (sem detalhes sensiveis):', err?.code || 'unknown');
      return res.status(503).json({
        success: false, code: 'emulator_storage_unavailable',
        financiallyApproved: false, subscriptionActivated: false
      });
    }
  }
);
