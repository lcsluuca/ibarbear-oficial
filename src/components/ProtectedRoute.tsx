
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getSubscriptionInfo } from '../lib/storage';
import { useVerifiedPanelAccess } from '../lib/useVerifiedPanelAccess';

type ProtectedRouteProps = {
  mode: 'owner' | 'admin';
};

export function ProtectedRoute({ mode }: ProtectedRouteProps) {
  const { status, user, shop } = useVerifiedPanelAccess(mode);
  const location = useLocation();

  // Aguarda o Firebase validar a autenticação.
  if (status === 'loading') {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-neutral-50"
        role="status"
      >
        <p className="text-sm font-medium text-neutral-600">
          Verificando suas permissões...
        </p>
      </div>
    );
  }

  // Usuário não autenticado ou sem autorização.
  if (status !== 'allowed') {
    return <Navigate to="/auth" replace />;
  }

  // IBARBEAR_ETAPA41: impedir montagem das telas operacionais sem assinatura.
  // /painel/assinatura continua disponivel para consultar e regularizar o plano.
  if (
    mode === 'owner' &&
    user &&
    getSubscriptionInfo(user).isLocked &&
    location.pathname !== '/painel/assinatura'
  ) {
    return <Navigate to="/painel/assinatura" replace />;
  }

  // Renderiza as paginas somente apos a verificacao do Firebase.
  return <Outlet context={{ user, shop }} />;
}
