'use strict';
/** IBARBEAR - real Mercado Pago payment integration (sealed until explicitly enabled).
 * Checkout and webhook run in Firebase Cloud Functions: Firebase Admin SDK is the sole
 * writer of paid status, so Hostinger never receives Firebase service account keys.
 * No cards or tokens ever reach the browser.
 */
const {createHash,randomBytes} = require('node:crypto');
const {onCall,onRequest,HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const {initializeApp,getApps} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const core = require('./ibarbearMpCore.cjs');
const REGION = 'southamerica-east1';
const DB_ID='ai-studio-ibarbear-a5719ffb-8768-4d2d-b8e3-92766caf88b3';
const REQUIRED_PROJECT='potent-cedar-342513';
const tokenSecret=defineSecret('IBARBEAR_MP_ACCESS_TOKEN');
const webhookSecret=defineSecret('IBARBEAR_MP_WEBHOOK_SECRET');
const app=getApps().length?getApps()[0]:initializeApp();
const db=getFirestore(app,DB_ID);

// IBARBEAR_HOMOLOGACAO_RESTRITA_V1: sem UID permitido, todas as escritas financeiras ficam bloqueadas.
function isHomologationOwner(uid){
  const allowed=process.env.IBARBEAR_HOMOLOGATION_UID||'';
  return core.identifier(uid)&&core.identifier(allowed)&&uid===allowed;
}
function gated(kind){
  if(process.env.FIRESTORE_DATABASE_ID && process.env.FIRESTORE_DATABASE_ID!==DB_ID)throw new Error('database_id_conflict');
  const project=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||process.env.GCP_PROJECT||'';
  if(project!==REQUIRED_PROJECT)throw new Error('project_not_allowed');
  if(process.env.FUNCTIONS_EMULATOR==='true'||project.startsWith('demo-'))throw new Error('real_provider_disabled_in_emulator');
  if(process.env.IBARBEAR_BILLING_ENABLED!=='true')throw new Error('billing_sealed');
  if(kind==='checkout' && process.env.IBARBEAR_CHECKOUT_ENABLED!=='true')throw new Error('checkout_sealed');
}
function value(secret){const s=secret.value();if(typeof s!=='string'||s.length<20||/[\r\n]/.test(s))throw new Error('secret_unavailable');return s;}
function boundedJson(x){const t=JSON.stringify(x);if(t.length>8192)throw new Error('provider_payload_too_large');return t;}
async function provider(path,accessToken,postBody){
  if(!/^\/(?:preapproval(?:\/[a-zA-Z0-9_-]{1,128})?|authorized_payments(?:\/[a-zA-Z0-9_-]{1,128}|\/search\?preapproval_id=[A-Za-z0-9_-]{1,128})?|v1\/payments\/[A-Za-z0-9_-]{1,128})$/.test(path))throw new Error('provider_path_invalid');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13000);
  try{
    const r=await fetch('https://api.mercadopago.com'+path,{
      method:postBody?'POST':'GET',redirect:'error',signal:controller.signal,
      headers:{'Authorization':`Bearer ${accessToken}`,'Accept':'application/json',...(postBody?{'Content-Type':'application/json'}:{})},
      ...(postBody?{body:boundedJson(postBody)}:{}),
    });
    if(r.status!==200 && r.status!==201)throw new Error(`provider_http_${r.status}`);
    const text=await r.text();if(text.length>131072)throw new Error('provider_response_too_large');
    const data=JSON.parse(text);if(!data || typeof data!=='object'||Array.isArray(data))throw new Error('provider_response_invalid');
    return data;
  }finally{clearTimeout(timer);}
}
function shortErr(e){return String(e?.message||e).slice(0,90).replace(/[^a-zA-Z0-9_-]/g,'_');}
async function getOwner(uid){
  const userRef=db.collection('users').doc(uid),snap=await userRef.get();
  const u=snap.data();
  if(!snap.exists || !u || !core.identifier(u.shopSlug))throw new Error('owner_missing_shop');
  const shopRef=db.collection('shops').doc(u.shopSlug),shop=await shopRef.get();
  if(!shop.exists || shop.data().ownerUid!==uid)throw new Error('owner_shop_mismatch');
  return {userRef,shopRef,uid,shopSlug:u.shopSlug,user:u};
}

// IBARBEAR_FINANCIAL_REVERSAL_V1:
// A provider-confirmed full refund or chargeback can revoke access only for
// the most recent payment that currently grants access. Partial refunds and
// ambiguous provider states MUST be reviewed instead of guessed.
function classifyReversal(payment){
  if(!payment || !core.providerId(payment.id)) return 'invalid_payment';
  const original=core.cents(payment.transaction_amount);
  if(original===null || original<=0) return 'invalid_payment';
  const refunded=payment.transaction_amount_refunded==null?null:core.cents(payment.transaction_amount_refunded);
  if(refunded===null && payment.transaction_amount_refunded!=null)return 'invalid_refund_amount';
  if(refunded!==null && refunded>original)return 'invalid_refund_amount';
  if(payment.status==='charged_back')return 'chargeback';
  if(refunded!==null && refunded>0 && refunded<original)return 'partial_refund_requires_review';
  if(payment.status==='refunded' || (refunded!==null && refunded===original))return 'full_refund';
  if(Array.isArray(payment.refunds)&&payment.refunds.length)return 'refund_requires_review';
  return 'not_reversed';
}
async function reconcileKnownReversal(paymentId,accessToken,paymentData){
  if(!core.providerId(paymentId))return {code:'invalid_payment_id'};
  const pRef=db.collection('payments').doc('mp_'+paymentId);
  const stored=await pRef.get();
  if(!stored.exists)return {code:'payment_not_in_ledger'};
  const historical=stored.data();
  if(!isHomologationOwner(historical?.userId))return {code:'homologation_owner_not_allowed'};
  const subscriptionId=historical?.providerSubscriptionId;
  if(historical?.provider!=='mercadopago' || String(historical?.providerPaymentId)!==paymentId ||
    !core.identifier(subscriptionId)||!core.identifier(historical.userId)||!core.identifier(historical.shopSlug))
    return {code:'ledger_identity_invalid'};
  const payment=paymentData||await provider('/v1/payments/'+encodeURIComponent(paymentId),accessToken);
  if(core.providerId(payment.id)!==paymentId || payment.currency_id!=='BRL' ||
    core.cents(payment.transaction_amount)!==core.cents(historical.amount))
    return {code:'provider_payment_identity_mismatch'};
  const kind=classifyReversal(payment);
  if(kind==='not_reversed')return {code:'payment_not_reversed'};
  if(kind==='partial_refund_requires_review'||kind==='refund_requires_review')return {code:kind};
  if(kind!=='full_refund'&&kind!=='chargeback')return {code:'reversal_evidence_invalid'};
  const bindingRef=db.collection('mpBillingBindings').doc(subscriptionId);
  const bindingSnap=await bindingRef.get();
  if(!bindingSnap.exists)return {code:'binding_missing'};
  const binding=bindingSnap.data();
  if(binding.providerSubscriptionId!==subscriptionId || binding.shopSlug!==historical.shopSlug ||
    binding.ownerUid!==historical.userId ||
    (payment.preapproval_id && payment.preapproval_id!==subscriptionId) ||
    (payment.external_reference && payment.external_reference!==binding.externalReference))
    return {code:'binding_or_provider_mismatch'};
  // If provider supplies the payer email, require exact match to the original
  // authenticated account, not a browser-provided field.
  if(payment.payer?.email &&
     (typeof binding.ownerEmail!=='string'||payment.payer.email.toLowerCase()!==binding.ownerEmail.toLowerCase()))
    return {code:'payer_mismatch'};
  const uRef=db.collection('users').doc(historical.userId);
  const sRef=db.collection('shops').doc(historical.shopSlug);
  return db.runTransaction(async tx=>{
    const [p,b,u,s]=await Promise.all([tx.get(pRef),tx.get(bindingRef),tx.get(uRef),tx.get(sRef)]);
    if(!p.exists||!b.exists||!u.exists||!s.exists)return {code:'reversal_identity_lost'};
    const current=p.data(),now=new Date().toISOString();
    if(current.userId!==historical.userId||current.shopSlug!==historical.shopSlug||
       current.providerSubscriptionId!==subscriptionId||
       b.data().ownerUid!==historical.userId||b.data().shopSlug!==historical.shopSlug||
       u.data().shopSlug!==historical.shopSlug||s.data().ownerUid!==historical.userId)
      return {code:'reversal_identity_changed'};
    if(current.financiallyApproved===false && ['refunded','charged_back'].includes(current.status))
      return {code:'reversal_already_recorded'};
    if(current.financiallyApproved!==true||current.status!=='approved')
      return {code:'payment_not_eligible_for_reversal'};
    tx.update(pRef,{status:kind==='chargeback'?'charged_back':'refunded',financiallyApproved:false,
      reversalType:kind,reversalVerifiedAt:now,reversalSource:'mercadopago_provider_lookup'});
    // If a more recent valid payment already extended the paid period, do not
    // revoke it due to a refund on an older payment.
    const revoke=u.data().lastPaymentId===paymentId && s.data().lastPaymentId===paymentId &&
       u.data().providerSubscriptionId===subscriptionId && s.data().providerSubscriptionId===subscriptionId;
    if(revoke){
      tx.update(uRef,{subscriptionStatus:'unpaid',subscriptionExpiresAt:now,
        lastPaymentReversalId:paymentId});
      tx.update(sRef,{subscriptionStatus:'unpaid',paymentStatus:kind==='chargeback'?'charged_back':'refunded',
        subscriptionExpiresAt:now,lastPaymentReversalId:paymentId});
    }
    tx.update(bindingRef,{lastReversalPaymentId:paymentId,lastReversalType:kind,lastReversalAt:now});
    return {code:revoke?'reversal_recorded_access_revoked':'reversal_recorded_older_cycle'};
  });
}
async function recordSubscriptionLifecycle(subscriptionId,binding,providerStatus){
  if(!['cancelled','paused'].includes(providerStatus))return {code:'unknown_lifecycle_status'};
  const ref=db.collection('mpBillingBindings').doc(subscriptionId);
  return db.runTransaction(async tx=>{
    const saved=await tx.get(ref);
    if(!saved.exists||saved.data().ownerUid!==binding.ownerUid ||
       saved.data().shopSlug!==binding.shopSlug || saved.data().externalReference!==binding.externalReference)
      return {code:'lifecycle_identity_mismatch'};
    tx.update(ref,{providerLifecycleStatus:providerStatus,providerLifecycleVerifiedAt:new Date().toISOString(),
      autoRenewExpected:false});
    // Cancellation does NOT refund a valid previously paid cycle. Access naturally
    // expires at the already verified time; a chargeback uses the reversal path.
    return {code:'subscription_lifecycle_recorded'};
  });
}

async function processAuthorized(subscriptionId,authorizedId,accessToken){
  if(!core.identifier(subscriptionId)||!core.identifier(authorizedId))return {code:'invalid_provider_id'};
  const bindingRef=db.collection('mpBillingBindings').doc(subscriptionId);
  const snap=await bindingRef.get(); if(!snap.exists)return {code:'subscription_unknown'};
  const binding=snap.data();
  if(!isHomologationOwner(binding.ownerUid))return {code:'homologation_owner_not_allowed'};
  if(binding.providerSubscriptionId!==subscriptionId)return {code:'binding_mismatch'};
  const authorized=await provider('/authorized_payments/'+encodeURIComponent(authorizedId),accessToken);
  if(authorized.preapproval_id!==subscriptionId || !core.identifier(String(authorized.payment_id||'')))return {code:'authorized_payment_not_linked'};
  const [subscription,payment]=await Promise.all([
    provider('/preapproval/'+encodeURIComponent(subscriptionId),accessToken),
    provider('/v1/payments/'+encodeURIComponent(String(authorized.payment_id)),accessToken),
  ]);
  const reversal=await reconcileKnownReversal(String(authorized.payment_id),accessToken,payment);
  if(['reversal_recorded_access_revoked','reversal_recorded_older_cycle','reversal_already_recorded',
      'partial_refund_requires_review','refund_requires_review'].includes(reversal.code)) return reversal;
  const verified=core.validatePayment({binding,subscription,authorized,payment});
  if(!verified.ok)return {code:verified.reason};
  const pRef=db.collection('payments').doc('mp_'+verified.paymentId);
  const uRef=db.collection('users').doc(binding.ownerUid);
  const sRef=db.collection('shops').doc(binding.shopSlug);
  return db.runTransaction(async tx=>{
    const [stored,b,u,s]=await Promise.all([tx.get(pRef),tx.get(bindingRef),tx.get(uRef),tx.get(sRef)]);
    if(stored.exists)return {code:'payment_already_recorded'};
    if(!b.exists || b.data().providerSubscriptionId!==subscriptionId ||
       b.data().ownerUid!==binding.ownerUid || b.data().shopSlug!==binding.shopSlug ||
       !u.exists || u.data().shopSlug!==binding.shopSlug ||
       !s.exists || s.data().ownerUid!==binding.ownerUid)throw new Error('owner_binding_changed');
    const expiresMs=Date.parse(verified.expiresAt);
    const prevExpiry=Date.parse(u.data().subscriptionExpiresAt||'')||0;
    const newer=expiresMs>prevExpiry;
    const paidAt=verified.paidAt;
    tx.create(pRef,{
      id:'mp_'+verified.paymentId,userId:binding.ownerUid,shopSlug:binding.shopSlug,
      provider:'mercadopago', providerPaymentId:verified.paymentId,
      providerSubscriptionId:subscriptionId,plan:binding.plan,amount:verified.amountCents/100,
      currency:'BRL',status:'approved',paymentMethod:'credit_card',paidAt,createdAt:paidAt,
      expiresAt:verified.expiresAt,financiallyApproved:true,source:'provider_direct_lookup',
    });
    if(newer){
      tx.update(uRef,{
        subscriptionStatus:'active',subscriptionPlan:binding.plan,
        subscriptionExpiresAt:verified.expiresAt,providerSubscriptionId:subscriptionId,
        lastPaymentId:verified.paymentId,lastPaidAt:paidAt,
      });
      tx.update(sRef,{
        subscriptionStatus:'active',subscriptionPlan:binding.plan,paymentStatus:'paid',
        subscriptionExpiresAt:verified.expiresAt,providerSubscriptionId:subscriptionId,
        lastPaymentId:verified.paymentId,
      });
    }
    tx.update(bindingRef,{lastVerifiedPaymentId:verified.paymentId,lastVerifiedAt:new Date().toISOString()});
    return {code:newer?'activated_with_verified_payment':'payment_recorded_without_shorten',expiresAt:verified.expiresAt};
  });
}
async function reconcileSubscription(subscriptionId,accessToken){
  if(!core.identifier(subscriptionId))return {code:'invalid_subscription_id'};
  const binding=await db.collection('mpBillingBindings').doc(subscriptionId).get();
  if(!binding.exists)return {code:'subscription_unknown'};
  if(!isHomologationOwner(binding.data()?.ownerUid))return {code:'homologation_owner_not_allowed'};
  const subscription=await provider('/preapproval/'+encodeURIComponent(subscriptionId),accessToken);
  const data=binding.data();
  if(subscription.id!==subscriptionId || subscription.preapproval_plan_id!==core.PLANS[data.plan]?.id ||
    subscription.external_reference!==data.externalReference)return {code:'subscription_conflict'};
  if(['cancelled','paused'].includes(subscription.status))
    return recordSubscriptionLifecycle(subscriptionId,data,subscription.status);
  if(subscription.status!=='authorized')return {code:'subscription_not_authorized'};
  const list=await provider('/authorized_payments/search?preapproval_id='+encodeURIComponent(subscriptionId),accessToken);
  if(!Array.isArray(list.results) || list.results.length>30 ||
     (typeof list.paging?.total==='number' && list.paging.total>list.results.length))return {code:'payment_search_requires_review'};
  let recorded=0,approved=false,reversed=0,review=false;
  // Prefer newest first. Every candidate is re-read by ID and verified against /v1/payments.
  for(const a of list.results.slice().sort((x,y)=>String(y.date_created||'').localeCompare(String(x.date_created||'')))){
    if(!core.identifier(String(a?.id||'')))continue;
    const result=await processAuthorized(subscriptionId,String(a.id),accessToken);
    if(result.code==='activated_with_verified_payment')approved=true;
    if(['partial_refund_requires_review','refund_requires_review'].includes(result.code))review=true;
    if(['reversal_recorded_access_revoked','reversal_recorded_older_cycle','reversal_already_recorded'].includes(result.code))reversed++;
    if(['activated_with_verified_payment','payment_already_recorded','payment_recorded_without_shorten'].includes(result.code))recorded++;
  }
  return {code:review?'reversal_manual_review':recorded?'payments_verified':reversed?'reversals_verified':'no_approved_payment_evidence',recorded,reversed,activatedNow:approved};
}
const createCheckout=onCall({region:REGION,secrets:[tokenSecret],timeoutSeconds:45},async request=>{
  try{gated('checkout');}catch(e){throw new HttpsError('failed-precondition',shortErr(e));}
  const uid=request.auth?.uid;
  if(!uid)throw new HttpsError('unauthenticated','Login necessario.');
  if(!isHomologationOwner(uid))throw new HttpsError('permission-denied','Homologacao restrita.');
  const plan=request.data?.plan;
  if(!Object.prototype.hasOwnProperty.call(core.PLANS,plan))throw new HttpsError('invalid-argument','Plano invalido.');
  let owner;
  try{owner=await getOwner(uid);}catch{throw new HttpsError('permission-denied','Conta/loja nao validada.');}
  const email=request.auth.token.email;
  if(!core.identifier(owner.shopSlug)||typeof email!=='string'||!email.includes('@')||
     !core.identifier(uid)||!(String(owner.user.email||'').toLowerCase()===email.toLowerCase()))
    throw new HttpsError('failed-precondition','Cadastro do proprietario incompleto.');
  const currentExpiry=Date.parse(owner.user.subscriptionExpiresAt||'')||0;
  if(['active','expiring'].includes(owner.user.subscriptionStatus) && currentExpiry>Date.now())
    throw new HttpsError('failed-precondition','Assinatura ativa: nao criar segunda assinatura.');
  let mpAccessToken;
  try{mpAccessToken=value(tokenSecret);}catch{throw new HttpsError('failed-precondition','Credencial Mercado Pago nao configurada.');}
  const opRef=db.collection('mpBillingCheckout').doc(owner.shopSlug);
  const intentId=randomBytes(16).toString('hex');
  const externalReference='ibar-'+intentId, reservedAtMs=Date.now();
  let reserved;
  try{
    reserved=await db.runTransaction(async tx=>{
      const old=await tx.get(opRef);
      if(old.exists){
        const o=old.data();
        if(o.ownerUid!==uid)return {code:'owner_conflict'};
        if(o.state==='created' && core.validCheckoutUrl(o.checkoutUrl))return {code:'existing',checkoutUrl:o.checkoutUrl};
        return {code:'needs_manual_review'}; // Do NOT retry uncertain POSTs.
      }
      tx.create(opRef,{ownerUid:uid,shopSlug:owner.shopSlug,ownerEmail:email,plan,
        externalReference,providerPlanId:core.PLANS[plan].id,priceCents:core.PLANS[plan].priceCents,
        reservedAtMs,state:'provider_request_outcome_unknown',providerRequestSent:true,
      });
      return {code:'reserved'};
    });
  }catch{throw new HttpsError('internal','Reserva de checkout indisponivel.');}
  if(reserved.code==='existing')return {checkoutUrl:reserved.checkoutUrl,reused:true};
  if(reserved.code!=='reserved')throw new HttpsError('failed-precondition','Operacao existente: verificar antes de nova tentativa.');
  try{
    const body=core.checkoutBody({plan,externalReference,email});
    const result=await provider('/preapproval',mpAccessToken,body);
    const checked=core.checkCheckoutResponse(result,{plan,externalReference,email});
    if(!checked)throw new Error('provider_response_incomplete');
    const bindRef=db.collection('mpBillingBindings').doc(checked.providerSubscriptionId);
    await db.runTransaction(async tx=>{
      const [op,bind]=await Promise.all([tx.get(opRef),tx.get(bindRef)]);
      if(!op.exists||op.data().externalReference!==externalReference||bind.exists)throw new Error('binding_conflict');
      tx.create(bindRef,{ownerUid:uid,shopSlug:owner.shopSlug,ownerEmail:email,plan,
        externalReference,providerSubscriptionId:checked.providerSubscriptionId,reservedAtMs,
        status:'created',createdAt:new Date().toISOString()});
      tx.update(opRef,{state:'created',providerSubscriptionId:checked.providerSubscriptionId,
        checkoutUrl:checked.checkoutUrl,providerLinkedAt:new Date().toISOString()});
    });
    return {checkoutUrl:checked.checkoutUrl,reused:false};
  }catch(e){
    console.error('IBARBEAR MP: checkout outcome unknown:',shortErr(e));
    throw new HttpsError('unavailable','Resultado do Mercado Pago indeterminado. Nao repetir: contate o suporte.');
  }
});

const reconcilePayment=onCall({region:REGION,secrets:[tokenSecret],timeoutSeconds:120},async request=>{
  try{gated('billing');}catch(e){throw new HttpsError('failed-precondition',shortErr(e));}
  if(!request.auth?.uid)throw new HttpsError('unauthenticated','Login necessario.');
  if(!isHomologationOwner(request.auth.uid))throw new HttpsError('permission-denied','Homologacao restrita.');
  let owner;try{owner=await getOwner(request.auth.uid);}catch{throw new HttpsError('permission-denied','Nao autorizado.');}
  const checkout=(await db.collection('mpBillingCheckout').doc(owner.shopSlug).get()).data();
  if(!checkout || checkout.ownerUid!==owner.uid ||checkout.state!=='created'||!core.identifier(checkout.providerSubscriptionId))
    return {code:'no_subscription_to_reconcile',activatedNow:false};
  const limiter=db.collection('mpBillingRateLimits').doc(owner.shopSlug);
  const ok=await db.runTransaction(async tx=>{
    const s=await tx.get(limiter);
    if(s.exists && Number(s.data().notBeforeMs||0)>Date.now())return false;
    tx.set(limiter,{notBeforeMs:Date.now()+60000});return true;
  });
  if(!ok)throw new HttpsError('resource-exhausted','Aguarde um minuto antes de verificar novamente.');
  try{return await reconcileSubscription(checkout.providerSubscriptionId,value(tokenSecret));}
  catch(e){console.error('IBARBEAR MP reconcile:',shortErr(e));return {code:'provider_unavailable_or_unverified',activatedNow:false};}
});

const webhook=onRequest({region:REGION,secrets:[tokenSecret,webhookSecret],timeoutSeconds:120},async(req,res)=>{
  if(req.method!=='POST'){res.status(405).send('method_not_allowed');return;}
  try{gated('billing');}catch{res.status(503).send('billing_sealed');return;}
  const raw=req.rawBody?.toString('utf8')||'';
  const fullQuery=(req.originalUrl||'').split('?').slice(1).join('?');
  const verified=core.verifyWebhook(raw,fullQuery,req.headers['x-signature'],req.headers['x-request-id'],value(webhookSecret));
  if(!verified){res.status(401).send('unauthorized');return;}
  try{
    const accessToken=value(tokenSecret);
    let result={code:'unhandled_event'};
    if(verified.type==='subscription_authorized_payment'){
      const authorized=await provider('/authorized_payments/'+encodeURIComponent(verified.resourceId),accessToken);
      if(core.identifier(authorized.preapproval_id))
        result=await processAuthorized(authorized.preapproval_id,verified.resourceId,accessToken);
    }else if(verified.type==='subscription_preapproval'){
      result=await reconcileSubscription(verified.resourceId,accessToken);
    }else if(verified.type==='payment'){
      // By payment ID, only an ALREADY recorded payment can be reversed.
      // Never approve a new subscription from a generic payment notification.
      result=await reconcileKnownReversal(verified.resourceId,accessToken);
    }
    console.info('IBARBEAR MP webhook outcome:',result.code);
    // IBARBEAR_WEBHOOK_ACK_FAIL_CLOSED_V1: only acknowledge messages after a verified, durable financial outcome.
    // Unknown event types, missing evidence and not-yet-handled reversals must NOT be silently acked.
    const settledCodes = new Set([
      'activated_with_verified_payment',
      'payment_recorded_without_shorten',
      'payment_already_recorded',
      'payments_verified',
      'reversals_verified',
      'reversal_recorded_access_revoked',
      'reversal_recorded_older_cycle',
      'reversal_already_recorded',
      'subscription_lifecycle_recorded',
    ]);
    if (!settledCodes.has(result.code)) {
      console.warn('IBARBEAR MP: event requires reconciliation:', result.code);
      res.status(503).json({ok:false,code:'financial_reconciliation_incomplete'});
      return;
    }
    res.status(200).json({ok:true});
  }catch(e){
    console.error('IBARBEAR MP webhook requires retry:',shortErr(e));
    res.status(503).json({ok:false});
  }
});
module.exports={createCheckout,reconcilePayment,webhook,reconcileSubscription};
