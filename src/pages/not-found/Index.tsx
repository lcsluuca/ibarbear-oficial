import React from 'react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '../../components/site/SiteLayout';
import { RazorLogoIcon } from '../../components/common/RazorLogoIcon';
import { ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <SiteLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4 text-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white mb-4 shadow-sm p-3">
          <RazorLogoIcon size={40} light={true} />
        </div>
        <div className="font-display text-7xl font-extrabold text-black">404</div>
        <h2 className="mt-2 font-display text-2xl font-bold uppercase text-neutral-800">
          Página não encontrada
        </h2>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          O link que você tentou acessar não existe ou foi removido.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800"
          >
            <Home className="h-4 w-4" />
            <span>Página Inicial</span>
          </Link>
          <Link
            to="/painel"
            className="inline-flex items-center gap-2 rounded-sm border border-neutral-300 px-5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <span>Acessar Painel</span>
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
};
