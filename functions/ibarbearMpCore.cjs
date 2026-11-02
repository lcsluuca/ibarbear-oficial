'use strict';
/** IBARBEAR: pure checks for the Mercado Pago checkout and recurring payment bridge.
 * No SDK, network, secrets or Firestore side effects in this module.
 */
const {createHmac, timingSafeEqual} = require('node:crypto');

const PLANS = Object.freeze({
  monthly: {id: '24bc1335e61c4b72a6eda700f3742d64', priceCents: 8900, label:'IBARBEAR Pro Mensal', maxDays: 36, minDays: 20},
  yearly: {id: 'ca210c6ad3cf446b91d21a9266c86d08', priceCents: 89000, label:'IBARBEAR Pro Anual', maxDays: 371, minDays: 300},
});
function identifier(x) {return typeof x === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(x);}
// Mercado Pago may return integer ids (e.g., a payment id) or decimal strings.
// Reject unsafe integers, zero, negative, fractions and other values.
function providerId(x){
  if(typeof x==='number')return Number.isSafeInteger(x)&&x>0?String(x):null;
  return identifier(x)?x:null;
}
function iso(x) {
  if (typeof x !== 'string' || x.length > 42 || !/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d/.test(x)) return null;
  const ms = Date.parse(x);
  return Number.isFinite(ms) ? ms : null;
}
function cents(x) {
  if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || !Number.isSafeInteger(x * 100)) return null;
  return x * 100;
}
function sameEmail(a,b){return typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase() && a.includes('@');}
function validCheckoutUrl(value){
  if(typeof value !== 'string' || value.length > 2048)return false;
  let u; try{u=new URL(value);}catch{return false;}
  if(u.protocol!=='https:' || u.username || u.password || u.port)return false;
  return ['mercadopago.com.br','mercadopago.com'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d));
}
function checkoutBody({plan, externalReference, email}) {
  const p=PLANS[plan];
  if(!p || !/^ibar-[a-f0-9]{32}$/.test(externalReference)||!sameEmail(email,email)) throw new Error('invalid_checkout_data');
  return {preapproval_plan_id:p.id, reason:p.label, external_reference:externalReference, payer_email:email, back_url:'https://ibarbear.com/pagamento?retorno=mercadopago'};
}
function checkCheckoutResponse(response, expected){
  if(!response || !identifier(response.id) || response.preapproval_plan_id!==PLANS[expected.plan]?.id ||
     response.external_reference!==expected.externalReference || !['pending','authorized'].includes(response.status) ||
     !validCheckoutUrl(response.init_point) ||
     (response.payer_email!=null&&!sameEmail(response.payer_email,expected.email))) return null;
  return {providerSubscriptionId:response.id,checkoutUrl:response.init_point};
}
function parseQueryId(query){
  if(typeof query!=='string'||query.length>2048)return null;
  let id=null;
  for(const part of query.replace(/^\?/,'').split('&')){
    const at=part.indexOf('='); if(at<0) continue;
    let key; try { key=decodeURIComponent(part.slice(0,at)); } catch { return null; }
    if(key!=='data.id') continue;
    if(id!==null) return null;
    let value; try { value=decodeURIComponent(part.slice(at+1)); } catch { return null; }
    if(!identifier(value)) return null;
    id=value;
  }
  return id;
}
function verifyWebhook(rawBody, query, signature, requestId, secret, now=Date.now()){
  const id=parseQueryId(query);
  if(!id || typeof secret!=='string'||secret.length<16 || typeof rawBody!=='string' || rawBody.length>65536 ||
     typeof requestId!=='string'||!/^[-A-Za-z0-9_]{1,150}$/.test(requestId) || typeof signature!=='string'||signature.length>512) return null;
  const fields={};
  for(const item of signature.split(',')){
    const i=item.indexOf('=');if(i<0)continue;
    const k=item.slice(0,i).trim(),v=item.slice(i+1).trim();
    if(k==='ts'||k==='v1') {if(fields[k]!==undefined)return null;fields[k]=v;}
  }
  if(!/^\d{10,13}$/.test(fields.ts||'')||!/^[a-fA-F0-9]{64}$/.test(fields.v1||''))return null;
  const time=Number(fields.ts)*((fields.ts.length===10)?1000:1);
  if(Math.abs(time-now)>10*60*1000)return null;
  const data=`id:${id.toLowerCase()};request-id:${requestId};ts:${fields.ts};`;
  const expected=Buffer.from(createHmac('sha256',secret).update(data).digest('hex'),'hex');
  const provided=Buffer.from(fields.v1,'hex');
  if(expected.length!==provided.length||!timingSafeEqual(expected,provided))return null;
  let body;try{body=JSON.parse(rawBody);}catch{return null;}
  if(!body||!body.data || String(body.data.id).toLowerCase()!==id.toLowerCase())return null;
  return {resourceId:id,type:body.type||body.topic||'',action:body.action||'',requestId};
}
function validatePayment({binding, subscription, authorized, payment, now=Date.now()}){
  // Fail-closed on unknown provider shapes. Verify a paid individual charge, not just authorized preapproval.
  if(!binding||!subscription||!authorized||!payment)return {ok:false,reason:'missing_data'};
  const plan=PLANS[binding.plan];
  if(!plan || !identifier(binding.providerSubscriptionId) ||
    binding.providerSubscriptionId!==subscription.id || subscription.preapproval_plan_id!==plan.id ||
    subscription.external_reference!==binding.externalReference || subscription.status!=='authorized')return {ok:false,reason:'subscription_mismatch'};
  if(!providerId(authorized.id)||authorized.preapproval_id!==subscription.id ||
     !providerId(authorized.payment_id)||providerId(authorized.payment_id)!==providerId(payment.id) ||
     !['processed','approved'].includes(authorized.status))return {ok:false,reason:'authorized_payment_mismatch'};
  if(!identifier(String(payment.id)) || payment.status!=='approved' ||
     cents(payment.transaction_amount)!==plan.priceCents || payment.currency_id!=='BRL' ||
     payment.refunds?.length > 0 || Number(payment.transaction_amount_refunded||0)>0 ||
     !sameEmail(binding.ownerEmail,binding.ownerEmail))return {ok:false,reason:'payment_not_approved'};
  if(subscription.payer_email && !sameEmail(subscription.payer_email,binding.ownerEmail))return {ok:false,reason:'subscription_payer_mismatch'};
  if(payment.payer?.email && !sameEmail(payment.payer.email,binding.ownerEmail))return {ok:false,reason:'payment_payer_mismatch'};
  // If provider's payment has a subscription association, it MUST match.
  if(payment.preapproval_id && payment.preapproval_id!==subscription.id)return {ok:false,reason:'payment_association_mismatch'};
  if(payment.external_reference && payment.external_reference!==binding.externalReference)return {ok:false,reason:'payment_reference_mismatch'};
  const paidAt=iso(payment.date_approved),expires=iso(subscription.next_payment_date);
  if(paidAt===null || expires===null || paidAt>now+5*60*1000 || paidAt < (binding.reservedAtMs || 0)-5*60*1000 ||
    expires<=now || expires<=paidAt || expires-paidAt<plan.minDays*86400000 || expires-paidAt>plan.maxDays*86400000)
    return {ok:false,reason:'billing_period_unverified'};
  return {ok:true, reason:'approved',paymentId:String(payment.id),paidAt:new Date(paidAt).toISOString(), expiresAt:new Date(expires).toISOString(),amountCents:plan.priceCents};
}
module.exports={PLANS,identifier,providerId,iso,cents,checkoutBody,checkCheckoutResponse,validCheckoutUrl,verifyWebhook,validatePayment};
