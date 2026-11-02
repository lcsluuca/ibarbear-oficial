'use strict';

/*
 * IBARBEAR - Intencao de assinatura
 * Exclusivo do Firebase Emulator.
 *
 * Nao cria cobrancas no Mercado Pago.
 * Nao ativa assinaturas.
 * Nao altera usuarios.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const {
  getFirestore,
  FieldValue
} = require('firebase-admin/firestore');

const PROJECT_ID = 'demo-ibarbear';

const DATABASE_ID =
  'ai-studio-ibarbear-a5719ffb-8768-4d2d-b8e3-92766caf88b3';

const PLANS = {
  monthly: {
    id: '24bc1335e61c4b72a6eda700f3742d64',
    priceCents: 8900
  },
  yearly: {
    id: 'ca210c6ad3cf446b91d21a9266c86d08',
    priceCents: 89000
  }
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp();

exports.createSubscriptionIntentTest = onRequest(
  { region: 'us-central1', cors: false },
  async (req, res) => {

    // Nunca disponibilizar fora do emulador local.
    const emulatorReady =
      process.env.FUNCTIONS_EMULATOR === 'true' &&
      Boolean(process.env.FIRESTORE_EMULATOR_HOST) &&
      Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) &&
      process.env.GCLOUD_PROJECT === PROJECT_ID;

    if (!emulatorReady) {
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

    const body = req.body;

    // O cliente pode enviar SOMENTE o plano.
    // Valor, UID e barbearia sao definidos no servidor.
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(body, 'plan') ||
      !Object.prototype.hasOwnProperty.call(PLANS, body.plan)
    ) {
      return res.status(400).json({
        success: false,
        code: 'invalid_plan'
      });
    }

    const plan = body.plan;
    const selectedPlan = PLANS[plan];

    const authHeader = req.headers.authorization || '';
    const match = /^Bearer\s+(\S+)$/i.exec(authHeader);

    if (!match) {
      return res.status(401).json({
        success: false,
        code: 'authentication_required'
      });
    }

    let uid;

    try {
      const decoded = await getAuth(app).verifyIdToken(match[1]);
      uid = decoded.uid;
    } catch {
      return res.status(401).json({
        success: false,
        code: 'invalid_auth_token'
      });
    }

    try {
      const db = getFirestore(app, DATABASE_ID);

      const userRef = db.collection('users').doc(uid);
      const intentRef = db
        .collection('mp_subscription_intents_test')
        .doc(uid);

      const result = await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);

        if (!userSnap.exists) {
          return { error: 'owner_not_found', status: 403 };
        }

        const shopSlug = userSnap.get('shopSlug');

        if (
          typeof shopSlug !== 'string' ||
          !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,120}$/.test(shopSlug)
        ) {
          return { error: 'invalid_shop', status: 403 };
        }

        const shopRef = db.collection('shops').doc(shopSlug);

        const shopSnap = await tx.get(shopRef);

        if (
          !shopSnap.exists ||
          shopSnap.get('ownerUid') !== uid
        ) {
          return { error: 'not_shop_owner', status: 403 };
        }

        const existing = await tx.get(intentRef);

        if (existing.exists) {
          const data = existing.data();

          if (
            data.plan !== plan ||
            data.shopSlug !== shopSlug
          ) {
            return {
              error: 'existing_intent_for_other_plan',
              status: 409
            };
          }

          return {
            created: false,
            shopSlug,
            plan
          };
        }

        tx.create(intentRef, {
          ownerUid: uid,
          shopSlug,
          plan,
          mpPlanId: selectedPlan.id,
          priceCents: selectedPlan.priceCents,
          currency: 'BRL',

          // Nenhuma assinatura do provedor foi criada.
          providerSubscriptionId: null,

          state: 'simulated_only',
          financiallyApproved: false,
          subscriptionActivated: false,
          createdAt: FieldValue.serverTimestamp()
        });

        return {
          created: true,
          shopSlug,
          plan
        };
      });

      if (result.error) {
        return res.status(result.status).json({
          success: false,
          code: result.error
        });
      }

      return res.status(200).json({
        success: true,
        created: result.created,
        duplicate: !result.created,
        shopSlug: result.shopSlug,
        plan: result.plan,
        priceCents: selectedPlan.priceCents,
        state: 'simulated_only',
        financiallyApproved: false
      });

    } catch (error) {
      console.error('[IBARBEAR] Erro na intencao de teste:', error);

      return res.status(503).json({
        success: false,
        code: 'storage_unavailable'
      });
    }
  }
);