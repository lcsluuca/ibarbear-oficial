import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('ibarbear_cookie_consent');
    if (!consent) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ibarbear_cookie_consent', 'true');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-xl border border-neutral-800 bg-neutral-900/95 p-4 text-white shadow-2xl backdrop-blur-md sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-400 mt-0.5" />
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Nós utilizamos cookies essenciais para garantir o correto funcionamento do sistema e salvar suas sessões com segurança. Ao continuar navegando, você concorda com a nossa{' '}
            <Link to="/privacidade" className="font-bold text-white underline hover:text-neutral-200">
              Política de Privacidade
            </Link>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAccept}
            className="w-full sm:w-auto rounded-lg bg-white px-5 py-2 text-xs font-bold text-neutral-900 transition-colors hover:bg-neutral-200 shadow-sm"
          >
            Entendi e Aceito
          </button>
        </div>
      </div>
    </div>
  );
};