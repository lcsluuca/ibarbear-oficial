'use strict';

/**
 * IBARBEAR — Etapa 24, estritamente para Firebase Emulators.
 * Recebe apenas { testRunId, scenario } e monta dados INTEIRAMENTE FICTICIOS.
 * Nunca recebe comprovantes reais, nao chama Mercado Pago, nao ativa assinaturas.
 * Nunca definir ou gravar financiallyApproved=true.
 */

const crypto = require('node:crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { avaliarEvidenciaFinanceira } = require('./IBARBEAR_etapa23_regra_financeira');

const PROJECT_ID = 'demo-ibarbear';
const DATABASE_ID = 'ai-studio-ibarbear-a5719ffb-8768-4d2d-b8e3-92766caf88b3';
const PLAN_ID = '24bc1335e61c4b72a6eda700f3742d64';
const SCENARIOS = new Set([
  'valid', 'same_payment_other_owner', 'same_period_other_payment',
  'pending', 'wrong_amount', 'refunded'
]);

const app = getApps().length > 0 ? getApps()[0] : initializeApp();

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function isLocalEmulator() {
  return process.env.FUNCTIONS_EMULATOR === 'true' &&
    process.env.GCLOUD_PROJECT === PROJECT_ID &&
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) &&
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

function generateFakeEvidence(testRunId, scenario) {
  const intentId = sha('intent|' + testRunId).slice(0, 32);
  const operationId = sha('operation|' + testRunId).slice(0, 32);
  const subscriptionId = 'FAKE-SUB-' + testRunId;
  const paymentId = scenario === 'same_period_other_payment'
    ? 'FAKE-PAY-ALT-' + testRunId
    : 'FAKE-PAY-' + testRunId;

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const periodo = { inicioUtc: start.toISOString(), fimUtc: end.toISOString() };

  const operacao = {
    ownerUid: scenario === 'same_payment_other_owner'
      ? 'FAKE-OWNER-OTHER-' + testRunId
      : 'FAKE-OWNER-' + testRunId,
    shopSlug: 'fake-shop-' + testRunId.toLowerCase(),
    intentId,
    operationId,
    externalReference: 'ibar-' + intentId,
    plan: 'monthly',
    providerPlanId: PLAN_ID,
    priceCents: 8900,
    currency: 'BRL',
    state: 'provider_subscription_linked',
    providerRequestSent: true,
    providerSubscriptionId: subscriptionId,
    financiallyApproved: false,
    subscriptionActivated: false
  };

  const assinatura = {
    id: subscriptionId,
    externalReference: operacao.externalReference,
    planId: PLAN_ID,
    status: 'authorized'
  };

  const pagamento = {
    id: paymentId,
    subscriptionId,
    status: scenario === 'pending'
      ? 'pending'
      : scenario === 'refunded'
        ? 'refunded'
        : 'approved',
    amountCents: scenario === 'wrong_amount' ? 1 : 8900,
    currency: 'BRL',
    approvedAtUtc: periodo.inicioUtc
  };

  return { operacao, assinatura, pagamento, periodo, agora: now.toISOString() };
}

exports.recordPaymentEvidenceTest = onRequest(
  { region: 'us-central1', cors: false, maxInstances: 1 },
  async (req, res) => {
    if (!isLocalEmulator()) {
      return res.status(404).json({ success: false, code: 'not_available' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, code: 'method_not_allowed' });
    }

    if (!req.is('application/json')) {
      return res.status(415).json({ success: false, code: 'json_required' });
    }

    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 2 ||
        typeof body.testRunId !== 'string' ||
        !/^[A-Za-z0-9_-]{8,64}$/.test(body.testRunId) ||
        !SCENARIOS.has(body.scenario)) {
      return res.status(400).json({ success: false, code: 'invalid_test_request' });
    }

    // NENHUM campo financeiro é recebido do cliente: os fixtures são construídos aqui.
    const evidence = generateFakeEvidence(body.testRunId, body.scenario);
    const decision = avaliarEvidenciaFinanceira(evidence);

    // Mesmo a evidência simulada coerente NUNCA autoriza ativação.
    if (decision.activationAuthorized !== false ||
        decision.reviewOnly !== true ||
        decision.evidenceConsistent !== true) {
      return res.status(422).json({
        success: false,
        code: 'evidence_rejected',
        reason: decision.reason,
        financiallyApproved: false,
        subscriptionActivated: false
      });
    }

    const { operacao, assinatura, pagamento, periodo } = evidence;
    // O campo "agora" é transitório e NÃO participa do hash imutável.
    const evidenceHash = sha(JSON.stringify({ operacao, assinatura, pagamento, periodo }));
    const paymentDocId = sha('sim-payment|' + pagamento.id);
    const cycleDocId = sha('sim-cycle|' + assinatura.id + '|' +
      periodo.inicioUtc + '|' + periodo.fimUtc);

    try {
      const db = getFirestore(app, DATABASE_ID);
      const paymentRef = db.collection('mp_payment_ledger_test').doc(paymentDocId);
      const cycleRef = db.collection('mp_billing_cycle_ledger_test').doc(cycleDocId);

      const result = await db.runTransaction(async (tx) => {
        // Todas as leituras devem vir ANTES das escritas na transação.
        const paymentSnap = await tx.get(paymentRef);
        const cycleSnap = await tx.get(cycleRef);

        if (paymentSnap.exists) {
          const sameEvidence = paymentSnap.get('evidenceHash') === evidenceHash;
          const cycleMatches = cycleSnap.exists &&
            cycleSnap.get('paymentDocId') === paymentDocId &&
            cycleSnap.get('evidenceHash') === evidenceHash;

          if (!sameEvidence || !cycleMatches) {
            return { status: 'conflict', code: 'payment_evidence_conflict' };
          }
          return { status: 'duplicate' };
        }

        if (cycleSnap.exists) {
          return { status: 'conflict', code: 'billing_period_already_recorded' };
        }

        tx.create(paymentRef, {
          testRunId: body.testRunId,
          paymentId: pagamento.id,
          operationId: operacao.operationId,
          ownerUid: operacao.ownerUid,
          shopSlug: operacao.shopSlug,
          subscriptionId: assinatura.id,
          plan: operacao.plan,
          priceCents: pagamento.amountCents,
          currency: pagamento.currency,
          paymentDocId,
          cycleDocId,
          evidenceHash,
          source: 'server_generated_emulator_fixture',
          state: 'simulation_only',
          evidenceConsistent: true,
          providerVerified: false,
          financiallyApproved: false,
          activationAuthorized: false,
          subscriptionActivated: false,
          recordedAt: FieldValue.serverTimestamp()
        });

        tx.create(cycleRef, {
          testRunId: body.testRunId,
          paymentDocId,
          evidenceHash,
          subscriptionId: assinatura.id,
          periodStartUtc: periodo.inicioUtc,
          periodEndUtc: periodo.fimUtc,
          state: 'simulation_only',
          providerVerified: false,
          financiallyApproved: false,
          recordedAt: FieldValue.serverTimestamp()
        });

        return { status: 'created' };
      });

      if (result.status === 'conflict') {
        return res.status(409).json({
          success: false,
          code: result.code,
          financiallyApproved: false,
          subscriptionActivated: false
        });
      }

      return res.status(200).json({
        success: true,
        created: result.status === 'created',
        duplicate: result.status === 'duplicate',
        state: 'simulation_only',
        evidenceConsistent: true,
        providerVerified: false,
        financiallyApproved: false,
        activationAuthorized: false,
        subscriptionActivated: false,
        paymentDocId,
        cycleDocId
      });
    } catch (error) {
      console.error('[IBARBEAR etapa24] Erro no ledger SIMULADO:', error);
      return res.status(503).json({ success: false, code: 'test_storage_unavailable' });
    }
  }
);
