import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Logo } from '../../components/site/Logo';
import { CheckoutForm } from '../../components/common/CheckoutForm';
import {
  getCurrentUser,
  PLAN_PRICING,
  logoutUser,
} from '../../lib/storage';
import { SubscriptionPlan } from '../../types';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

// Carrega a chave pública do Stripe
const stripePromise = loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || '');

export const PagamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const initialPlan = (searchParams.get('plan') === 'yearly' ? 'yearly' : 'monthly') as SubscriptionPlan;
  const isRenewal = searchParams.get('renewal') === 'true';
  const isSuccessRedirect = searchParams.get('success') === 'true';

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(initialPlan);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loadingIntent, setLoadingIntent] = useState<boolean>(true);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(isSuccessRedirect);

  // Redireciona para o login se não estiver autenticado
  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin', { replace: true });
    }
  }, [user, navigate]);

  // Se retornou do redirecionamento de sucesso do Stripe
  useEffect(() => {
    if (isSuccessRedirect) {
      handleTriggerSuccess();
    }
  }, [isSuccessRedirect]);

  // Cria a Payment Intent no servidor Node sempre que o plano selecionado muda
  useEffect(() => {
    if (!user || paymentSuccess) return;

    let isMounted = true;
    const fetchIntent = async () => {
      setLoadingIntent(true);
      try {
        const planInfo = PLAN_PRICING[selectedPlan];
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: planInfo.priceCents,
            paymentId: `USER-${user.id}-${selectedPlan}-${Date.now()}`,
          }),
        });

        const data = await res.json();
        if (isMounted && data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Erro ao gerar intenção de pagamento no Stripe:', err);
      } finally {
        if (isMounted) setLoadingIntent(false);
      }
    };

    fetchIntent();

    return () => {
      isMounted = false;
    };
  }, [selectedPlan, user?.id, paymentSuccess]);

  // Dispara animação de celebração e redirecionamento
  const handleTriggerSuccess = () => {
    setPaymentSuccess(true);

    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#000000'],
      });
    } catch {
      // Safe
    }

    setTimeout(() => {
      navigate('/painel', { replace: true });
    }, 2800);
  };

  const currentPlanInfo = PLAN_PRICING[selectedPlan];

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-indigo-700 border border-indigo-200/60">
              Checkout Stripe Integrado
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
        {paymentSuccess ? (
          /* Tela de Sucesso */
          <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200/80 bg-white p-8 text-center shadow-lg animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
              Pagamento Confirmado
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
              Assinatura Ativada com Sucesso!
            </h1>

            <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
              O pagamento no valor de{' '}
              <strong className="text-neutral-900">{currentPlanInfo.priceLabel}</strong> foi
              confirmado via Stripe. O acesso ao seu painel profissional e à agenda online já está 100% liberado.
            </p>

            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left">
              <div className="flex items-center justify-between text-xs text-neutral-600 pb-2 border-b border-neutral-200/70">
                <span>Plano:</span>
                <span className="font-bold text-neutral-900">{currentPlanInfo.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600 pt-2 pb-2 border-b border-neutral-200/70">
                <span>Gateway:</span>
                <span className="font-bold text-indigo-700">Stripe Payments</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600 pt-2 pb-2 border-b border-neutral-200/70">
                <span>Status:</span>
                <span className="font-bold text-emerald-700">Ativo e Liberado</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600 pt-2">
                <span>Validade da Assinatura:</span>
                <span className="font-bold text-neutral-900">
                  {new Date(Date.now() + currentPlanInfo.days * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/painel')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3.5 text-sm font-bold text-white shadow-md hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <span>Acessar Meu Painel Agora</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Seleção de Plano e Checkout */
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-800 mb-3 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Processamento Seguro com Stripe • SSL 256-bit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                {isRenewal ? 'Renovação da Assinatura' : 'Ative sua Barbearia no IBarbear'}
              </h1>
              <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto">
                Escolha o plano ideal e pague com Stripe (Cartão de Crédito, PIX, Apple Pay e Google Pay).
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
                  Renovação mensal sem fidelidade. Cancele quando quiser.
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

            {/* Container do Formulário Stripe */}
            <div className="max-w-xl mx-auto rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
              {loadingIntent || !clientSecret ? (
                <div className="py-12 text-center text-neutral-500 space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-neutral-800" />
                  <p className="text-sm font-medium">Carregando ambiente seguro do Stripe...</p>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#0a0a0a',
                        borderRadius: '12px',
                      },
                      rules: {
                        'Badge': {
                          display: 'none',
                        },
                        '.Badge': {
                          display: 'none',
                        }
                      },
                    },
                  }}
                >
                  <CheckoutForm priceLabel={currentPlanInfo.priceLabel} />
                </Elements>
              )}
            </div>

            {/* Garantias de Segurança */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 py-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Ambiente 100% Seguro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-neutral-600" />
                <span>Criptografia SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Liberação Imediata da Conta</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200/90 bg-white py-4 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} IBarbear SaaS • Processamento seguro Stripe.</p>
      </footer>
    </div>
  );
};