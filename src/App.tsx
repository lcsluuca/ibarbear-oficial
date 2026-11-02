
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// PAGINAS PUBLICAS
import { HomePage } from './pages/home/Index';
import { PrecosPage } from './pages/precos/Index';
import { ShopPublicPage } from './pages/shop/Index';
import { AuthPage } from './pages/auth/Index';
import { PagamentoPage } from './pages/pagamento/Index';
import { NotFoundPage } from './pages/not-found/Index';
import { PrivacidadePage } from './pages/privacidade/Index';

// PAINEL DOS PROPRIETARIOS
import { PainelPage } from './pages/painel/Index';
import { PainelServicos } from './pages/painel/Servicos';
import { PainelProdutos } from './pages/painel/Produtos';
import { PainelEquipe } from './pages/painel/Equipe';
import { PainelLoja } from './pages/painel/Loja';
import { PainelAssinatura } from './pages/painel/Assinatura';
import { PainelComissoes } from './pages/painel/Comissoes';

// SUPER ADMIN
import { AdminDashboardPage } from './pages/admin/Index';

// COMPONENTES
import { CookieConsent } from './components/common/CookieConsent';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <CookieConsent />

      <Routes>

        {/* =====================================
            SITE PUBLICO
        ===================================== */}

        <Route path="/" element={<HomePage />} />

        <Route
          path="/precos"
          element={<PrecosPage />}
        />

        <Route
          path="/privacidade"
          element={<PrivacidadePage />}
        />

        {/* =====================================
            PAGAMENTOS
        ===================================== */}

        <Route
          path="/pagamento"
          element={<PagamentoPage />}
        />

        {/* =====================================
            PAGINAS PUBLICAS DAS BARBEARIAS
        ===================================== */}

        <Route
          path="/b/:slug"
          element={<ShopPublicPage />}
        />

        <Route
          path="/b"
          element={
            <Navigate to="/b/navalha" replace />
          }
        />

        {/* =====================================
            AUTENTICACAO
        ===================================== */}

        <Route
          path="/auth"
          element={<AuthPage />}
        />

        {/* =====================================
            PAINEL DOS PROPRIETARIOS

            Exige:
            - Firebase Authentication
            - Perfil users/{uid}
            - ownerUid valido na barbearia
        ===================================== */}

        <Route
          element={<ProtectedRoute mode="owner" />}
        >

          <Route
            path="/painel"
            element={<PainelPage />}
          />

          <Route
            path="/painel/servicos"
            element={<PainelServicos />}
          />

          <Route
            path="/painel/produtos"
            element={<PainelProdutos />}
          />

          <Route
            path="/painel/equipe"
            element={<PainelEquipe />}
          />

          <Route
            path="/painel/loja"
            element={<PainelLoja />}
          />

          <Route
            path="/painel/assinatura"
            element={<PainelAssinatura />}
          />

          <Route
            path="/painel/comissoes"
            element={<PainelComissoes />}
          />

        </Route>

        {/* =====================================
            SUPER ADMIN

            Exige:
            - Firebase Authentication
            - Custom Claim superadmin = true
        ===================================== */}

        <Route
          element={<ProtectedRoute mode="admin" />}
        >

          <Route
            path="/admin"
            element={
              <Navigate
                to="/admin/barbearias"
                replace
              />
            }
          />

          <Route
            path="/admin/barbearias"
            element={<AdminDashboardPage />}
          />

        </Route>

        {/* =====================================
            PAGINA 404
        ===================================== */}

        <Route
          path="*"
          element={<NotFoundPage />}
        />

      </Routes>
    </BrowserRouter>
  );
}
