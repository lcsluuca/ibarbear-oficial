import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Logo } from '../../components/site/Logo';
import {
  getCurrentUser,
  PLAN_PRICING,
  logoutUser,
} from '../../lib/storage';
import { SubscriptionPlan } from '../../types';
import {
  ShieldCheck,
  Sparkles,
  LogOut,
  RefreshCw,
  Lock,
  CreditCard,
} from 'lucide-react';
export const PagamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const initialPlan = (searchParams.get('plan') === 'yearly' ? 'yearly' : 'monthly') as SubscriptionPlan;
  const isRenewal = searchParams.get('renewal') === 'true';
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(initialPlan);
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [paymentMessage, setPaymentMessage] = useState<string>('');
  const isLocal = typeof window === 'undefined' || ['localhost', '127.0.0.1'].includes(window.location.hostname) || import.meta.env.MODE === 'emulator';
  // O Firebase Auth e a fonte de identidade. Os dados locais servem apenas para exibicao.
  useEffect(() => {
    let cancelled = false;
    auth.authStateReady().then(() => {
      if (!cancelled && !auth.currentUser) {
        navigate('/auth?mode=signin', { replace: true });
      }
    }).catch(() => {
      if (!cancelled) navigate('/auth?mode=signin', { replace: true });
    });

  return () => { cancelled = true; };
  }, [navigate]);

  const handleCheckoutMercadoPago = async () => {
    if (loadingPayment || checkingPayment) return;
    setPaymentMessage('');
    if (isLocal) {
      setPaymentMessage('Checkout real desativado em localhost/Emulator. Nenhuma assinatura foi criada.');
      return;
    }
    setLoadingPayment(true);
    try {
      await auth.authStateReady();
      if (!auth.currentUser) {
        navigate('/auth?mode=signin', { replace: true });
        return;
      }
      // O backend verifica o UID autenticado, o plano e o vinculo da barbearia.
      // Nenhuma chave privada e enviada pelo navegador.
      const functionClient = getFunctions(auth.app, 'southamerica-east1');
      const createCheckout = httpsCallable<{ plan: SubscriptionPlan }, { checkoutUrl: string; reused?: boolean }>(
        functionClient,
        'ibarbearMpCreateCheckout'
      );
      const { data } = await createCheckout({ plan: selectedPlan });
      const url = new URL(data.checkoutUrl);
      const permitted = ['mercadopago.com.br', 'mercadopago.com'].some(
        domain => url.hostname === domain || url.hostname.endsWith('.' + domain)
      );
      if (url.protocol !== 'https:' || url.username || url.password || url.port || !permitted) {
        throw new Error('Endereco de checkout invalido.');
      }
      window.location.assign(url.toString());
    } catch (error) {
      console.error('Falha ao iniciar checkout Mercado Pago:', error);
      setPaymentMessage('Nao foi possivel iniciar o checkout. Se ja houve tentativa, nao repita o pedido; contate o suporte.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (loadingPayment || checkingPayment) return;
    setPaymentMessage('');
    if (isLocal) {
      setPaymentMessage('A consulta a pagamentos reais esta desativada em localhost/Emulator.');
      return;
    }
    setCheckingPayment(true);
    try {
      await auth.authStateReady();
      if (!auth.currentUser) {
        navigate('/auth?mode=signin', { replace: true });
        return;
      }
      const functionClient = getFunctions(auth.app, 'southamerica-east1');
      const verifyPayment = httpsCallable<Record<string, never>, { code: string; activatedNow?: boolean; recorded?: number }>(
        functionClient,
        'ibarbearMpReconcilePayment'
      );
      const { data } = await verifyPayment({});
      if (data.activatedNow || data.code === 'payments_verified') {
        setPaymentMessage('Conferencia concluida. Seu acesso depende do status de assinatura validado no Firebase. Atualize a pagina ou entre novamente.');
      } else {
        setPaymentMessage('Ainda nao ha pagamento confirmado para liberar o painel. Se voce acabou de autorizar, consulte novamente mais tarde.');
      }
    } catch (error) {
      console.error('Falha ao consultar assinatura:', error);
      setPaymentMessage('Nao foi possivel consultar a assinatura agora. Nenhuma nova cobranca foi criada.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const currentPlanInfo = PLAN_PRICING[selectedPlan];

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700 border border-emerald-200/60">
              Assinatura segura
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-neutral-900">{user.name}</p>
                <p className="text-[11px] text-neutral-500">{user.shopSlug}.ibarbear.com</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                logoutUser();
                navigate('/auth?mode=signin');
              }}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>
      {/* Área Principal */}
      <main className="mx-auto flex-1 max-w-4xl px-4 py-8 sm:px-6 sm:py-12 w-full">
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 mb-3 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Pagamento com Mercado Pago • validacao no servidor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                {isRenewal ? 'Renovação da Assinatura' : 'Ative sua Barbearia no IBarbear'}
              </h1>
              <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto">
                Escolha o plano ideal. As formas de pagamento disponiveis serao exibidas pelo Mercado Pago.
              </p>
            </div>
            {/* Seleção do Plano */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Plano Mensal */}
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all cursor-pointer ${
                  selectedPlan === 'monthly'
                    ? 'border-neutral-950 bg-white shadow-sm ring-2 ring-neutral-950/10'
                    : 'border-neutral-200 bg-white/70 hover:border-neutral-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Plano Flexível
                    </span>
                    <h3 className="text-lg font-bold text-neutral-950">Plano Mensal</h3>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'monthly'
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-300'
                    }`}
                  >
                    {selectedPlan === 'monthly' && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-neutral-950">R$ 89,00</span>
                  <span className="text-xs font-medium text-neutral-500">/mês</span>
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  Renovacao mensal conforme as condicoes da assinatura.
                </p>
              </button>
              {/* Plano Anual */}
              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all cursor-pointer ${
                  selectedPlan === 'yearly'
                    ? 'border-neutral-950 bg-white shadow-sm ring-2 ring-neutral-950/10'
                    : 'border-neutral-200 bg-white/70 hover:border-neutral-300 hover:bg-white'
                }`}
              >
                <div className="absolute -top-3 right-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>2 Meses Grátis</span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      Mais Econômico
                    </span>
                    <h3 className="text-lg font-bold text-neutral-950">Plano Anual</h3>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'yearly'
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-300'
                    }`}
                  >
                    {selectedPlan === 'yearly' && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-neutral-950">R$ 890,00</span>
                  <span className="text-xs font-medium text-neutral-500">/ano</span>
                </div>
                <p className="mt-2 text-xs text-indigo-700 font-medium">
                  Equivalente a R$ 74,16/mês • Economize R$ 178,00 no ano!
                </p>
              </button>
            </div>
            {/* Ação do Checkout com Mercado Pago */}
            <div className="max-w-xl mx-auto rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm text-center">
              <h2 className="text-base font-bold text-neutral-900 mb-2">
                Resumo da Assinatura
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Quando a contratacao estiver habilitada, voce sera redirecionado ao Mercado Pago para autorizar a assinatura.
              </p>
              <button
                type="button"
                onClick={handleCheckoutMercadoPago}
                disabled={loadingPayment || checkingPayment || isLocal}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingPayment ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Iniciando Checkout Seguro...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Continuar com {currentPlanInfo.priceLabel}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={loadingPayment || checkingPayment || isLocal}
                className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingPayment ? 'Conferindo pagamento...' : 'Ja autorizei o pagamento — Verificar assinatura'}
              </button>
              {isLocal && (
                <p className="mt-3 text-xs text-amber-700">
                  Checkout real desabilitado em localhost e no Firebase Emulator.
                </p>
              )}
              {paymentMessage && (
                <p role="status" className="mt-3 text-sm text-neutral-700">{paymentMessage}</p>
              )}
            </div>
            {/* Garantias de Segurança */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 py-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Validacao de sessao</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-neutral-600" />
                <span>Conexao HTTPS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Liberacao apos confirmacao</span>
              </div>
            </div>
          </div>
      </main>
      <footer className="border-t border-neutral-200/90 bg-white py-4 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} IBarbear • Assinatura liberada somente apos pagamento confirmado.</p>
      </footer>
    </div>
  );
};
