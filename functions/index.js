'use strict';

// IBARBEAR: funcoes operacionais disponiveis conforme deployment.
// Nao alterar a logica de agendamentos nesta etapa.
const bookingFunctions = require('./bookings');
exports.getPublicAvailability = bookingFunctions.getPublicAvailability;
exports.createPublicBooking = bookingFunctions.createPublicBooking;

// IBARBEAR ETAPA 45: nenhum endpoint de simulacao deve ser exportado
// em ambiente de producao. Exigir TODAS as salvaguardas de emulador.
const emulatorOnly = (
  process.env.FUNCTIONS_EMULATOR === 'true' &&
  process.env.GCLOUD_PROJECT === 'demo-ibarbear' &&
  process.env.FIRESTORE_DATABASE_ID ===
    'ai-studio-ibarbear-a5719ffb-8768-4d2d-b8e3-92766caf88b3' &&
  Boolean(process.env.FIRESTORE_EMULATOR_HOST) &&
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)
);

if (emulatorOnly) {
  exports.recordSubscriptionEventTest =
    require('./subscriptionEvents').recordSubscriptionEventTest;
  exports.createSubscriptionIntentTest =
    require('./subscriptionIntents').createSubscriptionIntentTest;
  exports.recordPaymentEvidenceTest =
    require('./IBARBEAR_etapa24_ledger_emulador').recordPaymentEvidenceTest;
  exports.recordFinancialLedgerTest37 =
    require('./IBARBEAR_etapa37_ledger_emulador.js').recordFinancialLedgerTest37;
}

// IBARBEAR_MP_INTEGRACAO_DIRETA - Checkout/WEBHOOK oficiais (travas fechadas por padrao)
const ibarbearMpBilling = require('./ibarbearMpBilling.cjs');
exports.ibarbearMpCreateCheckout = ibarbearMpBilling.createCheckout;
exports.ibarbearMpReconcilePayment = ibarbearMpBilling.reconcilePayment;
exports.ibarbearMpWebhook = ibarbearMpBilling.webhook;

// IBARBEAR: conciliacao recorrente isolada, desativada por padrao.
exports.ibarbearMpScheduledReconcile = require('./ibarbearMpScheduler.cjs').scheduledReconcile;
