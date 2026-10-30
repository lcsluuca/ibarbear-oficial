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
import { AlertCircle, Loader2, CheckCircle2, Eye, EyeOff, Mail, X, Check, Dot } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const paymentRef = searchParams.get('ref') || searchParams.get('infinitepay_ref');

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Estados de "Tocado" (para exibir o erro só depois que o usuário mexer no campo)
  const [touched, setTouched] = useState({
    shopName: false,
    name: false,
    email: false,
    password: false,
  });

  // Modal para recuperação de senha
  const [showResetModal, setShowResetModal] = useState(false);

  // Validações de Formato (E-mail e Nome)
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidName = name.trim().split(/\s+/).filter(part => part.length >= 2).length >= 2;
  const isValidShopName = shopName.trim().length >= 3;

  // Validações da Senha Forte
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isPasswordStrong =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  // Check if returning from Checkout
  useEffect(() => {
    const checkRedirectPayment = async () => {
      if (paymentRef) {
        try {
          await confirmPixPayment(paymentRef);
          setPaymentSuccessMsg('Pagamento aprovado com sucesso! Faça login para acessar ao seu painel.');
        } catch {
          // Safe
        }
      }
    };

    checkRedirectPayment();
  }, [paymentRef]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Marca todos os campos como tocados ao tentar enviar
    setTouched({
      shopName: true,
      name: true,
      email: true,
      password: true,
    });

    try {
      if (mode === 'signup') {
        if (!shopName.trim() || !isValidShopName) {
          setErrorMsg('Informe o nome da barbearia (mínimo de 3 caracteres).');
          setLoading(false);
          return;
        }

        if (!name.trim() || !isValidName) {
          setErrorMsg('Por favor, informe o seu nome e sobrenome completos.');
          setLoading(false);
          return;
        }

        if (!email.trim() || !isValidEmail) {
          setErrorMsg('Por favor, insira um e-mail válido (ex: nome@dominio.com).');
          setLoading(false);
          return;
        }

        if (!isPasswordStrong) {
          setErrorMsg('A senha escolhida não atende a todos os requisitos de segurança.');
          setLoading(false);
          return;
        }

        const { user } = await registerUser(name.trim(), email.trim(), shopName.trim(), password);
        navigate('/pagamento?plan=monthly', { replace: true });
      } else {
        // Sign in
        if (!email.trim() || !password.trim()) {
          setErrorMsg('Por favor, informe o seu e-mail e senha.');
          setLoading(false);
          return;
        }

        if (!isValidEmail) {
          setErrorMsg('O formato do e-mail digitado é inválido.');
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

  const handleForgotPassword = () => {
    if (!email.trim() || !isValidEmail) {
      setErrorMsg('Informe um e-mail válido no campo abaixo para redefinir a sua senha.');
      return;
    }
    setErrorMsg(null);
    setShowResetModal(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#fafafa] p-4 sm:p-6 text-neutral-900">
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
                ? 'Entre para acessar ao painel.'
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

          {/* Error Message Global */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {mode === 'signup' && (
              <>
                {/* Nome da Barbearia */}
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
                    onBlur={() => handleBlur('shopName')}
                    className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                      touched.shopName && !isValidShopName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-neutral-300 focus:border-black focus:ring-1 focus:ring-black'
                    }`}
                  />
                  {touched.shopName && !isValidShopName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      O nome deve conter pelo menos 3 caracteres.
                    </p>
                  )}
                </div>

                {/* Nome Completo */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    O seu nome completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pedro Henrique Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                      touched.name && !isValidName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-neutral-300 focus:border-black focus:ring-1 focus:ring-black'
                    }`}
                  />
                  {touched.name && !isValidName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      Por favor, informe seu nome e sobrenome.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* E-mail */}
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
                onBlur={() => handleBlur('email')}
                className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors ${
                  touched.email && !isValidEmail
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-neutral-300 focus:border-black focus:ring-1 focus:ring-black'
                }`}
              />
              {touched.email && !isValidEmail && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  Insira um endereço de e-mail válido (ex: nome@dominio.com).
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  Senha
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => {
                    setIsPasswordFocused(false);
                    handleBlur('password');
                  }}
                  className="w-full rounded-md border border-neutral-300 bg-white pl-3.5 pr-10 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* REQUISITOS DA SENHA */}
              {mode === 'signup' && (isPasswordFocused || password.length > 0) && (
                <div className="mt-3 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 space-y-1.5 text-xs animate-in fade-in duration-200">
                  <p className="font-semibold text-neutral-700 text-[11px] uppercase tracking-wider mb-1">
                    A senha deve conter:
                  </p>

                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-neutral-400'}`}>
                    {hasMinLength ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Dot className="h-4 w-4 shrink-0" />}
                    <span>Mínimo de 8 caracteres</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasUppercase && hasLowercase ? 'text-emerald-600 font-medium' : 'text-neutral-400'}`}>
                    {hasUppercase && hasLowercase ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Dot className="h-4 w-4 shrink-0" />}
                    <span>Letras maiúsculas e minúsculas</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-neutral-400'}`}>
                    {hasNumber ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Dot className="h-4 w-4 shrink-0" />}
                    <span>Pelo menos 1 número (0-9)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-neutral-400'}`}>
                    {hasSpecialChar ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Dot className="h-4 w-4 shrink-0" />}
                    <span>Pelo menos 1 caractere especial (!@#$...)</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-black py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none disabled:opacity-50 shadow-xs cursor-pointer"
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

      {/* POPUP DE CONFIRMAÇÃO */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl transition-all scale-100">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <Mail className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900">E-mail enviado!</h3>
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              Enviamos um link de redefinição de senha para:
              <br />
              <strong className="text-neutral-800 font-semibold">{email}</strong>
            </p>
            <p className="mt-2 text-[11px] text-neutral-400">
              Verifique também a sua caixa de spam ou lixo eletrônico.
            </p>

            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="mt-6 w-full rounded-xl bg-neutral-950 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};