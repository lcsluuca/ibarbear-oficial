'use strict';

/**
 * IBARBEAR - ETAPA 37
 * Ledger financeiro transacional APENAS NO FIRESTORE EMULATOR.
 * Nao aceita webhook, frontend, recibos, token ou JSON do Mercado Pago.
 * Mesmo um fixture com status 'approved' NAO e prova de pagamento.
 * Nunca escreve em shops/, users/, payments/ ou colecoes de producao.
 */
const crypto = require('node:crypto');

const PLANS = Object.freeze({
  monthly: Object.freeze({ providerPlanId: '24bc1335e61c4b72a6eda700f3742d64', priceCents: 8900 }),
  yearly: Object.freeze({ providerPlanId: 'ca210c6ad3cf446b91d21a9266c86d08', priceCents: 89000 })
});
const COLLECTIONS = Object.freeze({
  operations: 'mp_etapa37_operations_test',
  deliveries: 'mp_etapa37_deliveries_test',
  payments: 'mp_etapa37_payment_ledger_test',
  cycles: 'mp_etapa37_cycle_ledger_test'
});
const SCENARIOS = Object.freeze([
  'valid', 'yearly', 'new_delivery_same_payment',
  'same_delivery_other_payment', 'same_cycle_new_payment',
  'same_payment_other_owner', 'wrong_reference', 'wrong_subscription',
  'wrong_plan', 'wrong_amount', 'wrong_currency', 'pending', 'refunded'
]);
const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const textId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const hex32 = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
const isIso = v => typeof v === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;

function periodFor(plan, now) {
  const d = new Date(now);
  if (plan === 'monthly') {
    return {
      startUtc: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString(),
      endUtc: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString()
    };
  }
  return {
    startUtc: new Date(Date.UTC(d.getUTCFullYear(), 0, 1)).toISOString(),
    endUtc: new Date(Date.UTC(d.getUTCFullYear() + 1, 0, 1)).toISOString()
  };
}

function fakeOperation(testRunId, plan = 'monthly') {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(testRunId) || !PLANS[plan]) {
    throw new Error('invalid_test_run');
  }
  const cfg = PLANS[plan];
  const intentId = digest('e37-intent|' + testRunId).slice(0, 32);
  const operationId = digest('e37-operation-id|' + testRunId).slice(0, 32);
  return {
    testRunId, operationId, intentId,
    ownerUid: 'FAKE_OWNER_' + testRunId,
    shopSlug: 'fake-shop-' + testRunId.toLowerCase(),
    plan, providerPlanId: cfg.providerPlanId, priceCents: cfg.priceCents,
    currency: 'BRL', externalReference: 'ibar-' + intentId,
    providerSubscriptionId: 'FAKE_SUB_' + testRunId,
    providerRequestSent: true,
    state: 'provider_subscription_linked',
    financiallyApproved: false, subscriptionActivated: false,
    source: 'emulator_only_fixture'
  };
}

function fakeEvidence(testRunId, scenario = 'valid', now = new Date()) {
  if (!SCENARIOS.includes(scenario) || !/^[A-Za-z0-9_-]{8,64}$/.test(testRunId)) {
    throw new Error('invalid_test_scenario');
  }
  const plan = scenario === 'yearly' ? 'yearly' : 'monthly';
  const op = fakeOperation(testRunId, plan);
  const period = periodFor(plan, now);
  const paymentId = 'FAKE_PAY_' + testRunId;
  const deliveryId = 'FAKE_DELIVERY_' + testRunId;
  const evidence = {
    source: 'server_generated_emulator_fixture', testRunId,
    deliveryId, operationId: op.operationId,
    ownerUid: op.ownerUid, shopSlug: op.shopSlug,
    plan, providerPlanId: op.providerPlanId,
    subscriptionId: op.providerSubscriptionId,
    externalReference: op.externalReference,
    paymentId, paymentStatus: 'approved',
    amountCents: op.priceCents, currency: 'BRL',
    approvedAtUtc: period.startUtc,
    cycleStartUtc: period.startUtc, cycleEndUtc: period.endUtc,
    providerVerified: false, financiallyApproved: false,
    subscriptionActivated: false
  };
  if (scenario === 'new_delivery_same_payment') evidence.deliveryId += '_REDELIVERY';
  if (scenario === 'same_delivery_other_payment') evidence.paymentId += '_OTHER';
  if (scenario === 'same_cycle_new_payment') {
    evidence.paymentId += '_OTHER';
    evidence.deliveryId += '_OTHER';
  }
  if (scenario === 'same_payment_other_owner') evidence.ownerUid += '_OTHER';
  if (scenario === 'wrong_reference') evidence.externalReference += '_WRONG';
  if (scenario === 'wrong_subscription') evidence.subscriptionId += '_WRONG';
  if (scenario === 'wrong_plan') evidence.providerPlanId = PLANS.yearly.providerPlanId;
  if (scenario === 'wrong_amount') evidence.amountCents = 1;
  if (scenario === 'wrong_currency') evidence.currency = 'ARS';
  if (scenario === 'pending') evidence.paymentStatus = 'pending';
  if (scenario === 'refunded') evidence.paymentStatus = 'refunded';
  return evidence;
}

function validateFixture(e) {
  const deny = code => ({ ok: false, code });
  if (!e || typeof e !== 'object' || Array.isArray(e) ||
      e.source !== 'server_generated_emulator_fixture' ||
      !/^[A-Za-z0-9_-]{8,64}$/.test(e.testRunId || '') ||
      !textId(e.deliveryId) || !textId(e.paymentId) ||
      !textId(e.subscriptionId) || !textId(e.ownerUid) ||
      !textId(e.shopSlug) || !hex32(e.operationId) ||
      !PLANS[e.plan]) return deny('fixture_identity_invalid');
  const cfg = PLANS[e.plan];
  if (e.providerPlanId !== cfg.providerPlanId ||
      e.amountCents !== cfg.priceCents || e.currency !== 'BRL') {
    return deny('plan_or_amount_mismatch');
  }
  if (!/^ibar-[a-f0-9]{32}$/.test(e.externalReference || '') ||
      e.paymentStatus !== 'approved' || e.providerVerified !== false ||
      e.financiallyApproved !== false || e.subscriptionActivated !== false) {
    return deny('not_eligible_for_simulation_ledger');
  }
  if (![e.approvedAtUtc, e.cycleStartUtc, e.cycleEndUtc].every(isIso)) {
    return deny('invalid_cycle_dates');
  }
  const start = Date.parse(e.cycleStartUtc), end = Date.parse(e.cycleEndUtc);
  const approved = Date.parse(e.approvedAtUtc);
  if (start >= end || approved < start || approved >= end) {
    return deny('invalid_cycle_dates');
  }
  return { ok: true };
}

function refsFor(db, e) {
  return {
    operation: db.collection(COLLECTIONS.operations).doc(digest('e37-opdoc|' + e.testRunId)),
    delivery: db.collection(COLLECTIONS.deliveries).doc(digest('e37-delivery|' + e.deliveryId)),
    payment: db.collection(COLLECTIONS.payments).doc(digest('e37-payment|' + e.paymentId)),
    cycle: db.collection(COLLECTIONS.cycles).doc(digest('e37-cycle|' + e.subscriptionId + '|' + e.cycleStartUtc + '|' + e.cycleEndUtc))
  };
}

function expectedOperationMatches(e, op) {
  return op && op.source === 'emulator_only_fixture' &&
    op.operationId === e.operationId && op.ownerUid === e.ownerUid &&
    op.shopSlug === e.shopSlug && op.plan === e.plan &&
    op.providerPlanId === e.providerPlanId &&
    op.priceCents === e.amountCents && op.currency === e.currency &&
    op.providerSubscriptionId === e.subscriptionId &&
    op.externalReference === e.externalReference &&
    op.state === 'provider_subscription_linked' &&
    op.providerRequestSent === true &&
    op.financiallyApproved === false && op.subscriptionActivated === false;
}

function evidenceHash(e) {
  // Ignora ID da entrega: duas entregas do mesmo pagamento devem ter o mesmo hash.
  return digest(JSON.stringify([
    e.operationId, e.ownerUid, e.shopSlug, e.plan,
    e.providerPlanId, e.externalReference, e.subscriptionId,
    e.paymentId, e.paymentStatus, e.amountCents, e.currency,
    e.approvedAtUtc, e.cycleStartUtc, e.cycleEndUtc
  ]));
}

/**
 * Unica gravacao financeira da Etapa 37: 3 colecoes *_test e uma leitura
 * autoritativa de operacao *_test, na MESMA transacao.
 * NAO aceita Firestore de producao: o CHAMADOR deve validar todo ambiente.
 */
async function recordSimulatedLedger(db, e) {
  const valid = validateFixture(e);
  if (!valid.ok) return { status: 422, code: valid.code, created: false, duplicate: false };
  const refs = refsFor(db, e);
  const hash = evidenceHash(e);
  const response = await db.runTransaction(async tx => {
    // LEITURAS antes de qualquer escrita para satisfazer Firestore transactions.
    const [opSnap, deliverySnap, paymentSnap, cycleSnap] = await Promise.all([
      tx.get(refs.operation), tx.get(refs.delivery),
      tx.get(refs.payment), tx.get(refs.cycle)
    ]);
    if (!opSnap.exists || !expectedOperationMatches(e, opSnap.data())) {
      return { status: 409, code: 'operation_identity_conflict', created: false, duplicate: false };
    }
    if (deliverySnap.exists) {
      const d = deliverySnap.data();
      if (d.evidenceHash !== hash || d.paymentDocId !== refs.payment.id ||
          d.cycleDocId !== refs.cycle.id || !paymentSnap.exists || !cycleSnap.exists) {
        return { status: 409, code: 'delivery_evidence_conflict', created: false, duplicate: false };
      }
      if (paymentSnap.data().evidenceHash !== hash ||
          cycleSnap.data().evidenceHash !== hash) {
        return { status: 409, code: 'ledger_evidence_conflict', created: false, duplicate: false };
      }
      return { status: 200, code: 'duplicate_delivery', created: false, duplicate: true };
    }
    if (paymentSnap.exists) {
      const p = paymentSnap.data();
      if (p.evidenceHash !== hash || !cycleSnap.exists ||
          cycleSnap.data().paymentDocId !== refs.payment.id ||
          cycleSnap.data().evidenceHash !== hash) {
        return { status: 409, code: 'payment_evidence_conflict', created: false, duplicate: false };
      }
      // Notificacao nova do mesmo pagamento: somente registra a entrega nova.
      tx.create(refs.delivery, {
        evidenceHash: hash, paymentDocId: refs.payment.id, cycleDocId: refs.cycle.id,
        source: 'emulator_fixture_only', state: 'duplicate_payment_delivery',
        providerVerified: false, financiallyApproved: false,
        subscriptionActivated: false, recordedAtUtc: new Date().toISOString()
      });
      return { status: 200, code: 'duplicate_payment_new_delivery', created: false, duplicate: true };
    }
    if (cycleSnap.exists) {
      return { status: 409, code: 'billing_cycle_already_recorded', created: false, duplicate: false };
    }
    const common = {
      testRunId: e.testRunId, operationId: e.operationId,
      ownerUid: e.ownerUid, shopSlug: e.shopSlug,
      subscriptionId: e.subscriptionId, providerPlanId: e.providerPlanId,
      externalReference: e.externalReference, plan: e.plan,
      evidenceHash: hash, source: 'emulator_fixture_only',
      state: 'simulation_only_pending_real_provider_reconciliation',
      providerVerified: false, financiallyApproved: false,
      activationAuthorized: false, subscriptionActivated: false,
      recordedAtUtc: new Date().toISOString()
    };
    tx.create(refs.payment, {
      ...common, paymentId: e.paymentId, simulatedPaymentStatus: e.paymentStatus,
      amountCents: e.amountCents, currency: e.currency,
      approvedAtUtc: e.approvedAtUtc,
      cycleStartUtc: e.cycleStartUtc, cycleEndUtc: e.cycleEndUtc,
      deliveryDocId: refs.delivery.id, cycleDocId: refs.cycle.id
    });
    tx.create(refs.cycle, {
      ...common, paymentDocId: refs.payment.id,
      startUtc: e.cycleStartUtc, endUtc: e.cycleEndUtc
    });
    tx.create(refs.delivery, {
      ...common, paymentDocId: refs.payment.id, cycleDocId: refs.cycle.id
    });
    return { status: 200, code: 'simulation_evidence_recorded', created: true, duplicate: false };
  });
  return {
    ...response,
    paymentDocId: refs.payment.id,
    cycleDocId: refs.cycle.id,
    deliveryDocId: refs.delivery.id,
    providerVerified: false,
    financiallyApproved: false,
    subscriptionActivated: false
  };
}

module.exports = {
  PLANS, COLLECTIONS, SCENARIOS, digest,
  fakeOperation, fakeEvidence, validateFixture,
  refsFor, evidenceHash, expectedOperationMatches,
  recordSimulatedLedger
};
