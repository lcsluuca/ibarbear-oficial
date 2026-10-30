import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { getCurrentUser, APP_CONFIG } from '../../lib/storage';
import { Menu, X, ArrowRight, ExternalLink } from 'lucide-react';

interface SiteLayoutProps {
  children: React.ReactNode;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = getCurrentUser();
  const location = useLocation();

  const navLinks = [
    { label: 'Recursos', href: '/#recursos' },
    { label: 'Como funciona', href: '/#como-funciona' },
    { label: 'Preços', href: '/precos' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold tracking-wide text-neutral-600 transition-colors hover:text-neutral-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/auth"
              className="text-sm font-semibold text-neutral-700 transition-colors hover:text-neutral-950"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-sm bg-neutral-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800"
            >
              <span>Acessar painel</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-sm p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-neutral-200 bg-white px-4 py-6 md:hidden">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-neutral-800 hover:text-black"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-neutral-200 flex flex-col gap-2">
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-sm border border-neutral-300 py-2 text-center text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-sm bg-black py-2.5 text-center text-sm font-bold text-white"
                >
                  <span>Acessar painel</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <Logo light />
              <p className="text-sm leading-relaxed text-neutral-400">
                A plataforma inteligente de agendamento online e gestão desenvolvida especialmente para barbearias modernas.
              </p>
            </div>

            {/* Plataforma */}
            <div>
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Plataforma
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
                <li>
                  <a href="/#recursos" className="transition-colors hover:text-white">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="/#como-funciona" className="transition-colors hover:text-white">
                    Como funciona
                  </a>
                </li>
                <li>
                  <Link to="/precos" className="transition-colors hover:text-white">
                    Preços & Planos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Conta & Painel */}
            <div>
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Barbearia
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
                <li>
                  <Link to="/auth" className="transition-colors hover:text-white">
                    Entrar no painel
                  </Link>
                </li>
                <li>
                  <Link to="/auth?mode=signup" className="transition-colors hover:text-white">
                    Cadastrar minha barbearia
                  </Link>
                </li>
                <li>
                  <Link to="/painel" className="transition-colors hover:text-white">
                    Painel de Agendamentos
                  </Link>
                </li>
                <li>
                  <Link to="/painel/servicos" className="transition-colors hover:text-white">
                    Catálogo de Serviços
                  </Link>
                </li>
                <li>
                  <Link to="/painel/equipe" className="transition-colors hover:text-white">
                    Gestão da Equipe
                  </Link>
                </li>
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Suporte & Contato
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-400">
                <li>
                  <span className="text-xs text-neutral-500 block">Atendimento por e-mail</span>
                  <a href={`mailto:${APP_CONFIG.supportEmail}`} className="hover:text-white font-medium">
                    {APP_CONFIG.supportEmail}
                  </a>
                </li>
                <li>
                  <span className="text-xs text-neutral-500 block">WhatsApp de suporte</span>
                  <span className="text-white">(11) 98765-4321</span>
                </li>
                <li className="pt-2">
                  <div className="rounded border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-400">
                    <p className="font-semibold text-white">Precisa de ajuda para configurar?</p>
                    <p className="mt-1">Nosso time auxilia no cadastro inicial da sua equipe e serviços.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-neutral-800/80 pt-6">
            <div className="flex flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row">
              <p>© {new Date().getFullYear()} {APP_CONFIG.fullName}. Todos os direitos reservados.</p>
              <div className="flex items-center gap-6">
                <Link to="/privacidade" className="hover:text-neutral-300 transition-colors">
                  Política de Privacidade
                </Link>
                <Link to="/auth" className="hover:text-neutral-300 transition-colors">
                  Área do barbeiro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};