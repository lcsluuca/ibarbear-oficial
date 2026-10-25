import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Logo } from '../../components/site/Logo';
import {
  getCurrentUser,
  createSubscriptionPayment,
  confirmPixPayment,
  processCardPayment,
  pollPaymentStatusFromServer,
  OFFICIAL_PIX_KEY,
  PLAN_PRICING,
  logoutUser,
} from '../../lib/storage';
import { PaymentRecord, SubscriptionPlan, PaymentMethodType } from '../../types';
import {
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  Scissors,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Lock,
  Copy,
  Check,
  Upload,
  FileText,
} from 'lucide-react';

export const PagamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const initialPlan = (searchParams.get('plan') === 'yearly' ? 'yearly' : 'monthly') as SubscriptionPlan;
  const isRenewal = searchParams.get('renewal') === 'true';

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(initialPlan);
  const [activeTab, setActiveTab] = useState<PaymentMethodType>('pix');
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBank, setReceiptBank] = useState<string>('');
  const [receiptE2E, setReceiptE2E] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);

  // Credit Card Form State
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardCpf, setCardCpf] = useState<string>('');
  const [cardInstallments, setCardInstallments] = useState<number>(1);
  const [processingCard, setProcessingCard] = useState<boolean>(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin', { replace: true });
    }
  }, [user, navigate]);

  // Generate Payment Session when plan or method changes
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const generate = async () => {
      setLoading(true);
      setStatusMessage(null);
      try {
        const newPayment = await createSubscriptionPayment(user, selectedPlan, activeTab);
        if (!isMounted) return;
        setPayment(newPayment);
      } catch (err) {
        console.error('Error generating payment:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    generate();

    return () => {
      isMounted = false;
    };
  }, [selectedPlan, activeTab, user?.id]);

  // Trigger celebration and redirect on success
  const handleTriggerSuccess = () => {
    if (paymentSuccess) return;
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

  // Real-time Firestore listener for payment approval
  useEffect(() => {
    if (!payment?.id || paymentSuccess) return;

    try {
      const unsubscribe = onSnapshot(
        doc(db, 'payments', payment.id),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as PaymentRecord;
            if (data.status === 'approved') {
              handleTriggerSuccess();
            }
          }
        },
        (err) => {
          console.warn('Firestore real-time subscription listener:', err);
        }
      );

      return () => unsubscribe();
    } catch {
      // Safe
    }
  }, [payment?.id, paymentSuccess]);

  // Real-time server status polling
  useEffect(() => {
    if (!payment?.id || paymentSuccess) return;

    const pollInterval = setInterval(async () => {
      const approved = await pollPaymentStatusFromServer(payment.id);
      if (approved) {
        handleTriggerSuccess();
      }
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [payment?.id, paymentSuccess]);

  // Manual payment verification check for PIX
  const handleManualCheck = async () => {
    if (!payment || checkingPayment || paymentSuccess) return;
    setCheckingPayment(true);
    setStatusMessage(null);

    try {
      await confirmPixPayment(payment.id, {
        verificationMethod: 'manual',
      });
      handleTriggerSuccess();
    } catch (err: any) {
      setStatusMessage('Estamos aguardando a compensação do seu pagamento. Caso já tenha realizado a transferência, aguarde alguns segundos ou envie o comprovante.');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Copy Pix Code to clipboard
  const handleCopyPix = async () => {
    if (!payment?.pixCode) return;
    try {
      await navigator.clipboard.writeText(payment.pixCode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Process Credit Card Payment
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !user || processingCard) return;

    setCardError(null);
    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum.length < 13 || cleanNum.length > 19) {
      setCardError('Por favor, informe um número de cartão válido.');
      return;
    }
    if (!cardHolder.trim()) {
      setCardError('Por favor, informe o nome impresso no cartão.');
      return;
    }
    if (!cardExpiry || !cardExpiry.includes('/')) {
      setCardError('Informe a validade do cartão no formato MM/AA.');
      return;
    }
    if (cardCvv.length < 3) {
      setCardError('Informe o código de segurança (CVV) do cartão.');
      return;
    }

    setProcessingCard(true);
    try {
      const res = await processCardPayment(
        payment.id,
        {
          number: cleanNum,
          holderName: cardHolder,
          expiry: cardExpiry,
          cvv: cardCvv,
          installments: cardInstallments,
          cpf: cardCpf,
        },
        selectedPlan,
        user
      );

      if (res.success) {
        handleTriggerSuccess();
      } else {
        setCardError(res.message || 'Transação não autorizada. Verifique os dados ou tente outro cartão.');
      }
    } catch (err: any) {
      setCardError('Não foi possível processar o cartão no momento. Tente novamente ou utilize o PIX.');
    } finally {
      setProcessingCard(false);
    }
  };

  // Submit Receipt for instant validation
  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || uploadingReceipt) return;

    setUploadingReceipt(true);
    try {
      let receiptUrl = '';
      if (receiptFile) {
        receiptUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(receiptFile);
        });
      }

      await confirmPixPayment(payment.id, {
        bankName: receiptBank || 'Comprovante Bancário',
        e2eId: receiptE2E || `E2E-${Date.now()}`,
        receiptUrl,
        verificationMethod: 'receipt_auth',
      });

      setReceiptModalOpen(false);
      handleTriggerSuccess();
    } catch (err) {
      setStatusMessage('Erro ao enviar comprovante. Tente novamente.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const currentPlanInfo = PLAN_PRICING[selectedPlan];
  const qrCodeUrl = payment?.pixCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payment.pixCode)}&margin=1`
    : '';

  // Determine card brand from number
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'American Express';
    if (/^(606282|3841|636368|636297|5067|4576|4011)/.test(clean)) return 'Elo';
    if (/^(60|3841)/.test(clean)) return 'Hipercard';
    return 'Cartão';
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Top Navbar */}
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

      {/* Main Content Area */}
      <main className="mx-auto flex-1 max-w-4xl px-4 py-8 sm:px-6 sm:py-12 w-full">
        {paymentSuccess ? (
          /* Payment Success View */
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
          /* Payment Selection Area */
          <div className="space-y-8">
            {/* Header Title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-800 mb-3 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Processamento Seguro com Stripe • SSL 256-bit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                {isRenewal ? 'Renovação da Assinatura' : 'Ative sua Barbearia no IBarbear'}
              </h1>
              <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto">
                Escolha o plano ideal e pague com Stripe (Cartão de Crédito internacional ou nacional, PIX e mais).
              </p>
            </div>

            {/* Plan Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Monthly Plan */}
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

              {/* Yearly Plan */}
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

            {/* Payment Methods Card with Tabs */}
            <div className="max-w-2xl mx-auto rounded-2xl border border-neutral-200/90 bg-white shadow-sm overflow-hidden">
              {/* Method Switcher Tabs */}
              <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-100/60 p-1.5 gap-1.5">
                {/* PIX Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('pix')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'pix'
                      ? 'bg-white text-neutral-950 shadow-xs ring-1 ring-neutral-200'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                  }`}
                >
                  <Zap className={`h-4 w-4 ${activeTab === 'pix' ? 'text-emerald-600' : ''}`} />
                  <span>PIX Instantâneo</span>
                  <span className="hidden sm:inline-block rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800 font-bold">
                    Mais Rápido
                  </span>
                </button>

                {/* Cartão Direto Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('credit_card')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'credit_card'
                      ? 'bg-white text-neutral-950 shadow-xs ring-1 ring-neutral-200'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                  }`}
                >
                  <CreditCard className={`h-4 w-4 ${activeTab === 'credit_card' ? 'text-blue-600' : ''}`} />
                  <span>Cartão de Crédito</span>
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="p-6 sm:p-8">
                {activeTab === 'pix' ? (
                  /* ================= PIX TAB ================= */
                  /* ================= PIX TAB ================= */
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Dynamic QR Code */}
                      <div className="relative flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shrink-0 shadow-inner">
                        {loading || !qrCodeUrl ? (
                          <div className="h-48 w-48 flex flex-col items-center justify-center gap-2 text-neutral-400">
                            <RefreshCw className="h-6 w-6 animate-spin text-neutral-600" />
                            <span className="text-xs">Gerando QR Code...</span>
                          </div>
                        ) : (
                          <img
                            src={qrCodeUrl}
                            alt="QR Code Pix"
                            className="h-48 w-48 rounded-lg object-contain bg-white p-1"
                          />
                        )}
                        <span className="mt-2 text-[11px] font-semibold text-neutral-500">
                          Aponte a câmera do seu banco
                        </span>
                      </div>

                      {/* Pix Instructions & Info */}
                      <div className="flex-1 space-y-3.5 text-center sm:text-left">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                            Total do Pagamento
                          </span>
                          <p className="text-3xl font-black text-neutral-950">
                            {currentPlanInfo.priceLabel}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs text-neutral-600">
                          <p className="flex items-center gap-2 justify-center sm:justify-start">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>Aprovação automática e liberação imediata</span>
                          </p>
                          <p className="flex items-center gap-2 justify-center sm:justify-start">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>Chave oficial: <strong className="font-mono text-neutral-900">{OFFICIAL_PIX_KEY}</strong></span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Copy Pix Code Field */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        Código PIX Copia e Cola:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={payment?.pixCode || 'Carregando código PIX...'}
                          className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 py-3 text-xs font-mono text-neutral-800 focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="flex items-center gap-1.5 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
                        >
                          {copiedPix ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-400" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copiar Código</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {statusMessage && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>{statusMessage}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleManualCheck}
                        disabled={checkingPayment || loading}
                        className="w-full flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {checkingPayment ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>Verificando no Banco Central...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Já Realizei o PIX (Verificar e Liberar)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setReceiptModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white py-3.5 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        <Upload className="h-4 w-4 text-neutral-500" />
                        <span>Enviar Comprovante</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ================= CREDIT CARD TAB ================= */
                  <form onSubmit={handleCardSubmit} className="space-y-4">
                    {/* Visual Card Mockup */}
                    <div className="rounded-2xl bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 p-5 text-white shadow-md space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-neutral-400">
                          <CreditCard className="h-4 w-4 text-white" />
                          <span>CARTÃO DE CRÉDITO</span>
                        </div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-300">
                          {getCardBrand(cardNumber)}
                        </span>
                      </div>

                      <div className="py-2">
                        <p className="font-mono text-lg sm:text-xl tracking-widest text-neutral-100">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-300">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-neutral-400">
                            Titular
                          </span>
                          <span className="font-semibold uppercase">
                            {cardHolder || 'NOME DO TITULAR'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] uppercase tracking-wider text-neutral-400">
                            Validade
                          </span>
                          <span className="font-semibold font-mono">
                            {cardExpiry || 'MM/AA'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {cardError && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                        <span>{cardError}</span>
                      </div>
                    )}

                    {/* Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                            setCardNumber(val);
                          }}
                          placeholder="0000 0000 0000 0000"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-mono text-neutral-900 focus:border-neutral-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Nome Impresso no Cartão
                        </label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NOME COMO ESTÁ NO CARTÃO"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm uppercase text-neutral-900 focus:border-neutral-900 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Validade (MM/AA)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                              setCardExpiry(val);
                            }}
                            placeholder="MM/AA"
                            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-mono text-neutral-900 focus:border-neutral-900 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="123"
                            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-mono text-neutral-900 focus:border-neutral-900 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            CPF do Titular
                          </label>
                          <input
                            type="text"
                            maxLength={14}
                            value={cardCpf}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 9) val = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}-${val.slice(9, 11)}`;
                              else if (val.length > 6) val = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}`;
                              else if (val.length > 3) val = `${val.slice(0, 3)}.${val.slice(3, 6)}`;
                              setCardCpf(val);
                            }}
                            placeholder="000.000.000-00"
                            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-mono text-neutral-900 focus:border-neutral-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Parcelamento
                        </label>
                        <select
                          value={cardInstallments}
                          onChange={(e) => setCardInstallments(Number(e.target.value))}
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none cursor-pointer"
                        >
                          <option value={1}>1x de {currentPlanInfo.priceLabel} (À vista sem juros)</option>
                          <option value={2}>2x de R$ {(currentPlanInfo.priceCents / 200).toFixed(2).replace('.', ',')}</option>
                          <option value={3}>3x de R$ {(currentPlanInfo.priceCents / 300).toFixed(2).replace('.', ',')}</option>
                          <option value={6}>6x de R$ {(currentPlanInfo.priceCents / 600).toFixed(2).replace('.', ',')}</option>
                          <option value={12}>12x de R$ {(currentPlanInfo.priceCents / 1200).toFixed(2).replace('.', ',')}</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={processingCard || loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3.5 text-sm font-bold text-white shadow-md hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {processingCard ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Processando Cartão com Segurança...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Pagar {currentPlanInfo.priceLabel} no Cartão</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Security Guarantee & Badges */}
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
              <div className="flex items-center gap-1.5">
                <Scissors className="h-4 w-4 text-neutral-400" />
                <span>Suporte IBarbear</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Receipt Modal */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-950">Enviar Comprovante PIX</h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Banco de Origem:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Itaú, Inter, Bradesco..."
                  value={receiptBank}
                  onChange={(e) => setReceiptBank(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  ID da Transação / E2E (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: E004169682026..."
                  value={receiptE2E}
                  onChange={(e) => setReceiptE2E(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Anexar Comprovante (Imagem / PDF):
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-neutral-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingReceipt}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                {uploadingReceipt ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Validando Comprovante...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Enviar e Ativar Acesso Imediato</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200/90 bg-white py-4 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} IBarbear SaaS • Processamento seguro e criptografia de ponta a ponta.</p>
      </footer>
    </div>
  );
};

