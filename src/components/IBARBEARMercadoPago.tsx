import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../lib/firebase';

type CheckoutReply = { checkoutUrl: string; reused?: boolean };
type ReviewReply = { code: string; activatedNow?: boolean; recorded?: number };

/**
 * Cole <IBARBEARMercadoPago /> na pagina /pagamento.
 * SEM checkout real no localhost/emulator. A chamada exige auth Firebase.
 * Nenhum pagamento e ativado pelo frontend nem por parametros da URL.
 */
export const IBARBEARMercadoPago: React.FC = () => {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const local = typeof window === 'undefined' || ['localhost', '127.0.0.1'].includes(window.location.hostname) || import.meta.env.MODE === 'emulator';

  async function start() {
    if (busy || local) return;
    if (!auth.currentUser) { setMessage('Entre na sua conta antes de assinar.'); return; }
    setBusy(true); setMessage('Criando sua assinatura com seguranca...');
    try {
      const fn = httpsCallable<{plan: typeof plan}, CheckoutReply>(getFunctions(auth.app, 'southamerica-east1'), 'ibarbearMpCreateCheckout');
      const {data} = await fn({plan});
      const url = new URL(data.checkoutUrl);
      if (url.protocol !== 'https:' || !['mercadopago.com.br', 'mercadopago.com'].some(d => url.hostname === d || url.hostname.endsWith('.' + d))) {
        throw new Error('O endereco retornado nao pertence ao Mercado Pago.');
      }
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      console.error('Nao foi possivel iniciar o checkout do Mercado Pago.', error);
      setMessage('Nao foi possivel iniciar a assinatura. Se ja tentou pagar, nao repita o pedido: contate o suporte.');
      setBusy(false);
    }
  }
  async function check() {
    if (busy || local) return;
    if (!auth.currentUser) { setMessage('Entre na sua conta para consultar a assinatura.'); return; }
    setBusy(true);
    try {
      const fn = httpsCallable<Record<string, never>, ReviewReply>(getFunctions(auth.app, 'southamerica-east1'), 'ibarbearMpReconcilePayment');
      const {data} = await fn({});
      if (data.activatedNow || data.code === 'payments_verified') setMessage('Conferencia concluida. Atualize a pagina para verificar seu acesso.');
      else setMessage('Nenhum pagamento confirmado para ativacao. Se voce acabou de pagar, tente verificar novamente mais tarde.');
    } catch {
      setMessage('A verificacao esta indisponivel no momento. O seu pagamento nao sera duplicado.');
    } finally {setBusy(false);}
  }
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm" aria-label="Assinatura Mercado Pago">
      <h2 className="text-xl font-bold">Assine o IBARBEAR com Mercado Pago</h2>
      <p className="mt-2 text-sm text-neutral-600">Escolha seu plano. A liberacao ocorre somente apos a confirmacao da cobranca.</p>
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={() => setPlan('monthly')} aria-pressed={plan === 'monthly'} className={`flex-1 rounded-lg border px-3 py-4 font-semibold ${plan === 'monthly' ? 'border-black bg-neutral-100' : 'border-neutral-300'}`}>
          Mensal <span className="block text-xl">R$ 89,00</span>
        </button>
        <button type="button" onClick={() => setPlan('yearly')} aria-pressed={plan === 'yearly'} className={`flex-1 rounded-lg border px-3 py-4 font-semibold ${plan === 'yearly' ? 'border-black bg-neutral-100' : 'border-neutral-300'}`}>
          Anual <span className="block text-xl">R$ 890,00</span>
        </button>
      </div>
      <button type="button" disabled={busy || local} onClick={start} className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-bold text-white disabled:opacity-40">
        {busy ? 'Verificando...' : 'Continuar no Mercado Pago'}
      </button>
      <button type="button" disabled={busy || local} onClick={check} className="mt-3 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm font-semibold disabled:opacity-40">
        Ja autorizei o pagamento — Verificar assinatura
      </button>
      {local && <p className="mt-3 text-sm text-amber-700">Checkout real desabilitado no ambiente local. Use somente no site publicado, apos homologacao.</p>}
      {message && <p role="status" className="mt-3 text-sm text-neutral-700">{message}</p>}
    </section>
  );
};
