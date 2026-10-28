import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/site/Logo';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  APP_CONFIG,
  confirmPixPayment,
} from '../../lib/storage';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const paymentRef = searchParams.get('ref') || searchParams.get('infinitepay_ref');

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Check if returning from Checkout
  useEffect(() => {
    const checkRedirectPayment = async () => {
      if (paymentRef) {
        try {
          await confirmPixPayment(paymentRef);
          setPaymentSuccessMsg('Pagamento aprovado com sucesso! Faça login para aceder ao seu painel.');
        } catch {
          // Safe
        }
      }
    };

    checkRedirectPayment();
  }, [paymentRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signup') {
        if (!name.trim() || !email.trim() || !shopName.trim() || !password.trim()) {
          setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
          setLoading(false);
          return;
        }

        const { user } = await registerUser(name.trim(), email.trim(), shopName.trim(), password);
        // Direct to payment checkout first to activate platform access
        navigate('/pagamento?plan=monthly', { replace: true });
      } else {
        // Sign in
        if (!email.trim() || !password.trim()) {
          setErrorMsg('Por favor, informe o seu e-mail e senha.');
          setLoading(false);
          return;
        }

        const user = await loginUser(email.trim(), password);
        if (user.subscriptionStatus === 'unpaid') {
          navigate('/pagamento?plan=monthly', { replace: true });
        } else {
          navigate('/painel', { replace: true });
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4 sm:p-6 text-neutral-900">
      <div className="w-full max-w-[420px]">
        {/* Main Auth Card */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-7 sm:p-9 shadow-xs">
          {/* Brand Logo Header */}
          <div className="flex items-center justify-center mb-6">
            <Logo size="md" />
          </div>

          {/* Title and Subtitle */}
          <div className="text-left mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              Área do barbeiro
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === 'signin'
                ? 'Entre para aceder ao painel.'
                : 'Crie a sua conta para gerir a sua barbearia.'}
            </p>
          </div>

          {/* Segmented Control / Toggle Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1 border border-neutral-200/40">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`rounded-md py-2 text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Success / Approved Payment */}
          {paymentSuccessMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{paymentSuccessMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Nome da barbearia
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Barbearia Dom Pedro"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    O seu nome
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pedro Henrique"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-black py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none disabled:opacity-50 shadow-xs"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              <span>{mode === 'signup' ? 'Cadastrar' : 'Entrar'}</span>
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-800 font-medium"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};