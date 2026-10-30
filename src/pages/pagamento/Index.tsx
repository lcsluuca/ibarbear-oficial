import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
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
  ArrowRight,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Lock,
  CreditCard,
} from 'lucide-react';

export const PagamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const initialPlan = (searchParams.get('plan') === 'yearly' ? 'yearly' : 'monthly') as SubscriptionPlan;
  const isRenewal = searchParams.get('renewal') === 'true';
  const isSuccessRedirect = searchParams.get('success') === 'true';

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(initialPlan);
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(isSuccessRedirect);

  // Redireciona para o login se não estiver autenticado
  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin', { replace: true });
    }
  }, [user, navigate]);

  // Se retornou do redirecionamento de sucesso
  useEffect(() => {
    if (isSuccessRedirect) {
      handleTriggerSuccess();
    }
  }, [isSuccessRedirect]);

  // Função para criar a assinatura no Mercado Pago via PHP
  const handleCheckoutMercadoPago = async () => {
    if (!user) return;
    setLoadingPayment(true);

    try {
      const planInfo = PLAN_PRICING[selectedPlan];
      // Valor em reais (calculado a partir de priceCents ou price)
      const amountInReais = planInfo.priceCents / 100;

      const response = await fetch('/api/criar-pagamento.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInReais,
          email: user.email || 'comprador@email.com',
          title: `Assinatura ${planInfo.name} - IBarbear`,
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        // Redireciona o usuário para o Checkout do Mercado Pago
        window.location.href = data.init_point;
      } else {
        console.error('Erro retornado pela API:', data);
        alert('Não foi possível gerar o link de pagamento. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao conectar com a API PHP:', err);
      alert('Erro ao processar requisição. Verifique a conexão.');
    } finally {
      setLoadingPayment(false);
    }
  };

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
            <span className="hidden sm:inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700 border border-emerald-200/60">
              Checkout Mercado Pago Integrado
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
              confirmado via Mercado Pago. O acesso ao seu painel profissional e à agenda online já está 100% liberado.
            </p>

            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left">
              <div className="flex items-center justify-between text-xs text-neutral-600 pb-2 border-b border-neutral-200/70">
                <span>Plano:</span>
                <span className="font-bold text-neutral-900">{currentPlanInfo.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600 pt-2 pb-2 border-b border-neutral-200/70">
                <span>Gateway:</span>
                <span className="font-bold text-emerald-700">Mercado Pago</span>
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
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 mb-3 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Processamento Seguro com Mercado Pago • SSL 256-bit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                {isRenewal ? 'Renovação da Assinatura' : 'Ative sua Barbearia no IBarbear'}
              </h1>
              <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto">
                Escolha o plano ideal e pague com Mercado Pago (PIX, Cartão de Crédito e Boleto).
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

            {/* Ação do Checkout com Mercado Pago */}
            <div className="max-w-xl mx-auto rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm text-center">
              <h2 className="text-base font-bold text-neutral-900 mb-2">
                Resumo da Assinatura
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Você será redirecionado para o ambiente seguro do Mercado Pago para concluir o pagamento via PIX ou Cartão de Crédito.
              </p>

              <button
                type="button"
                onClick={handleCheckoutMercadoPago}
                disabled={loadingPayment}
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
                    <span>Pagar {currentPlanInfo.priceLabel} com Mercado Pago</span>
                  </>
                )}
              </button>
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
        <p>© {new Date().getFullYear()} IBarbear • Processamento seguro Mercado Pago.</p>
      </footer>
    </div>
  );
};