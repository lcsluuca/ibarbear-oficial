import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '../../components/site/SiteLayout';
import { PageHeader } from '../../components/site/PageHeader';
import { APP_CONFIG } from '../../lib/storage';
import { Check, ArrowRight, Shield, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

export const PrecosPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const price = billingCycle === 'monthly' ? 89 : 74;
  const priceLabel = billingCycle === 'monthly' ? 'R$ 89' : 'R$ 74';

  const planFeatures = [
    'Agendamentos online 24h ilimitados',
    'Página exclusiva de agendamentos (ibarbear.com/b/suabarbearia)',
    'Cadastro ilimitado de barbeiros e horários individuais',
    'Catálogo completo de serviços com preços e durações',
    'Bloqueio automático de horários em tempo real',
    'Painel de controle com status dos clientes',
    'Link direto para contato via WhatsApp',
    'Filtros por data, barbeiro e status do agendamento',
    'Zero comissão sobre os atendimentos',
    'Suporte direto por e-mail e WhatsApp',
  ];

  const faqs = [
    {
      q: 'Como funciona o período de teste?',
      a: 'Você pode criar sua conta gratuitamente e configurar todos os dados da sua barbearia sem compromisso. Explore todas as funcionalidades do sistema e compartilhe com sua equipe.',
    },
    {
      q: 'Existe taxa de adesão ou taxa de cancelamento?',
      a: 'Não! Não cobramos taxa de instalação, setup nem fidelidade contratual. Você pode cancelar sua assinatura quando desejar com apenas um clique.',
    },
    {
      q: 'Como recebo os pagamentos dos clientes?',
      a: 'O sistema gerencia os horários e o agendamento. O pagamento é realizado diretamente pelo cliente na sua barbearia (Pix, dinheiro ou cartão). Nós não retemos nenhuma porcentagem.',
    },
    {
      q: 'Quantos barbeiros da minha equipe podem usar?',
      a: 'Quantos você precisar! Não há limitação de profissionais cadastrados nem cobrança por barbeiro adicional.',
    },
    {
      q: 'Como meus clientes acessam para agendar?',
      a: 'Você recebe um link exclusivo como ibarbear.com/b/suabarbearia. Basta colocar no perfil do Instagram, enviar no WhatsApp ou gerar um QR Code para deixar no balcão.',
    },
  ];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Preços"
        title="Um plano, tudo incluído"
      >
        Sem pegadinhas, sem taxas escondidas. Um valor mensal para toda a operação da sua barbearia.
      </PageHeader>

      <section className="py-16 sm:py-24 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-md border border-neutral-300 bg-white p-1 shadow-2xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded px-4 py-1.5 text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Cobrança Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <span>Anual</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                  Economize 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="mx-auto mt-10 max-w-xl rounded-md border border-neutral-300 bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Plano Barbearia Pro
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl font-extrabold text-neutral-900">
                    {priceLabel}
                  </span>
                  <span className="text-sm text-neutral-500">/mês</span>
                </div>
              </div>
              <div className="rounded border border-black bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                Completo
              </div>
            </div>

            <p className="mt-3 text-xs text-neutral-600">
              {billingCycle === 'monthly'
                ? 'Cobrado mensalmente. Cancele quando quiser.'
                : 'Faturado anualmente (R$ 888/ano). O melhor custo-benefício.'}
            </p>

            <div className="mt-8 border-t border-neutral-100 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
                O que está incluído:
              </h4>
              <ul className="space-y-3">
                {planFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-neutral-700">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                to="/auth?mode=signup"
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-black py-4 text-center text-sm font-bold text-white shadow-md transition-colors hover:bg-neutral-800"
              >
                <span>Criar minha barbearia</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                <Shield className="h-3.5 w-3.5 text-neutral-400" />
                <span>Garantia de 7 dias ou seu dinheiro de volta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ on Pricing */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Tire suas dúvidas
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-4xl">
              Perguntas sobre planos e pagamentos
            </h2>
          </div>

          <div className="mt-12 divide-y divide-neutral-200 border-y border-neutral-200">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="py-5">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="font-bold text-neutral-900 text-base sm:text-lg">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-neutral-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-black' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};
