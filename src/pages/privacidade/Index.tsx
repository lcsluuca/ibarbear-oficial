import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/site/Logo';
import { ArrowLeft, Shield } from 'lucide-react';

export const PrivacidadePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between border-b border-neutral-800 pb-6">
          <Logo size="md" />
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao início</span>
          </Link>
        </div>

        <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-400" />
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              Política de Privacidade & Proteção de Dados (LGPD)
            </h1>
          </div>

          <p className="text-xs text-neutral-500">Última atualização: Outubro de 2026</p>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Informações Gerais</h2>
            <p>
              A plataforma <strong>IBarbear</strong> compromete-se a proteger a privacidade e os dados pessoais dos seus utilizadores (barbeiros e estabelecimentos) e dos clientes finais que utilizam a plataforma para agendamentos, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Dados Recolhidos e Finalidade</h2>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Barbearias e Administradores:</strong> Nome, e-mail, palavra-passe encriptada e dados do estabelecimento para gestão da conta e autenticação.</li>
              <li><strong>Clientes Finais:</strong> Nome, telefone/WhatsApp e histórico de marcações para viabilizar o agendamento e envio de lembretes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Partilha de Dados</h2>
            <p>
              O IBarbear não vende, aluga nem partilha dados pessoais com terceiros para fins de marketing. Os dados dos clientes são acessíveis estritamente pelo estabelecimento comercial onde a marcação foi realizada.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Seus Direitos como Titular de Dados</h2>
            <p>
              Conforme o artigo 18 da LGPD, pode a qualquer momento solicitar a confirmação da existência de tratamento, correção de dados incompletos ou a eliminação definitiva dos seus dados do nosso sistema enviando um pedido ao nosso suporte.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Contato do Encarregado (DPO)</h2>
            <p>
              Para dúvidas ou pedidos de eliminação de dados pessoais, entre em contacto via e-mail: <strong className="text-white">suporte@ibarbear.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};