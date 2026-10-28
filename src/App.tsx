import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/home/Index';
import { PrecosPage } from './pages/precos/Index';
import { ShopPublicPage } from './pages/shop/Index';
import { AuthPage } from './pages/auth/Index';
import { PainelPage } from './pages/painel/Index';
import { PainelServicos } from './pages/painel/Servicos';
import { PainelProdutos } from './pages/painel/Produtos';
import { PainelEquipe } from './pages/painel/Equipe';
import { PainelLoja } from './pages/painel/Loja';
import { PainelAssinatura } from './pages/painel/Assinatura';
import { PagamentoPage } from './pages/pagamento/Index';
import { NotFoundPage } from './pages/not-found/Index';
import { PainelComissoes } from './pages/painel/Comissoes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing & Public Website */}
        <Route path="/" element={<HomePage />} />
        <Route path="/precos" element={<PrecosPage />} />

        {/* PIX Payment Checkout */}
        <Route path="/pagamento" element={<PagamentoPage />} />

        {/* Public Client Booking Interface */}
        <Route path="/b/:slug" element={<ShopPublicPage />} />
        <Route path="/b" element={<Navigate to="/b/navalha" replace />} />

        {/* Authentication */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Barbershop Admin Panel */}
        <Route path="/painel" element={<PainelPage />} />
        <Route path="/painel/servicos" element={<PainelServicos />} />
        <Route path="/painel/produtos" element={<PainelProdutos />} />
        <Route path="/painel/equipe" element={<PainelEquipe />} />
        <Route path="/painel/loja" element={<PainelLoja />} />
        <Route path="/painel/assinatura" element={<PainelAssinatura />} />
        <Route path="/painel/comissoes" element={<PainelComissoes />} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

