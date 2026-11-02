import { useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { setCurrentUser } from './storage';
import type { BarberShop, User } from '../types';

type Mode = 'owner' | 'admin';
type AccessStatus = 'loading' | 'allowed' | 'denied';

type VerifiedAccess = {
  status: AccessStatus;
  user: User | null;
  shop: BarberShop | null;
};

export function useVerifiedPanelAccess(mode: Mode): VerifiedAccess {
  const [access, setAccess] = useState<VerifiedAccess>({
    status: 'loading',
    user: null,
    shop: null,
  });

  useEffect(() => {
    let mounted = true;
    let sequence = 0;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const requestId = ++sequence;
      if (!mounted) return;

      setAccess({ status: 'loading', user: null, shop: null });

      if (!firebaseUser) {
        setCurrentUser(null);
        setAccess({ status: 'denied', user: null, shop: null });
        return;
      }

      try {
        if (mode === 'admin') {
          const token = await getIdTokenResult(firebaseUser, true);

          if (token.claims.superadmin !== true) {
            throw new Error('Sem permissao de Super Admin.');
          }

          if (
            !mounted ||
            requestId !== sequence ||
            auth.currentUser?.uid !== firebaseUser.uid
          ) return;

          const adminUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Administrador',
            email: firebaseUser.email || '',
            shopSlug: '',
          };

          setCurrentUser(adminUser);
          setAccess({
            status: 'allowed',
            user: adminUser,
            shop: null,
          });
          return;
        }

        // IBARBEAR_ETAPA41: exige resposta do servidor; offline falha fechado.
        const userSnapshot = await getDocFromServer(
          doc(db, 'users', firebaseUser.uid)
        );

        if (!userSnapshot.exists()) {
          throw new Error('Perfil nao encontrado.');
        }

        const data = userSnapshot.data() as User;

        if (
          typeof data.shopSlug !== 'string' ||
          !data.shopSlug.trim()
        ) {
          throw new Error('Perfil sem barbearia.');
        }

        const shopSnapshot = await getDocFromServer(
          doc(db, 'shops', data.shopSlug)
        );

        if (
          !shopSnapshot.exists() ||
          shopSnapshot.data().ownerUid !== firebaseUser.uid
        ) {
          throw new Error('Usuario nao e proprietario desta barbearia.');
        }

        if (
          !mounted ||
          requestId !== sequence ||
          auth.currentUser?.uid !== firebaseUser.uid
        ) return;

        const verifiedUser: User = {
          ...data,
          id: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          shopSlug: shopSnapshot.id,
        };

        delete verifiedUser.passwordHash;

        setCurrentUser(verifiedUser);
        setAccess({
          status: 'allowed',
          user: verifiedUser,
          shop: shopSnapshot.data() as BarberShop,
        });
      } catch (error) {
        if (!mounted || requestId !== sequence) return;

        console.warn('Acesso ao painel recusado:', error);
        setCurrentUser(null);
        setAccess({
          status: 'denied',
          user: null,
          shop: null,
        });
      }
    });

    return () => {
      mounted = false;
      sequence += 1;
      unsubscribe();
    };
  }, [mode]);

  return access;
}
