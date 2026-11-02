import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Executar o frontend de testes com: npm run dev -- --mode emulator
// Em todos os outros modos, utiliza a configuracao atual de producao.
export const USE_FIREBASE_EMULATORS =
  import.meta.env.DEV &&
  import.meta.env.MODE === 'emulator' &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

if (USE_FIREBASE_EMULATORS && typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error('O modo emulador do IBARBEAR so pode ser utilizado em localhost.');
  }
}

// Uma configuracao de projeto ficticio, sem identificadores da producao,
// evita que o frontend de teste use acidentalmente o projeto verdadeiro.
const firebaseConfig = USE_FIREBASE_EMULATORS
  ? {
      apiKey: 'demo-api-key',
      authDomain: 'demo-ibarbear.firebaseapp.com',
      projectId: 'demo-ibarbear',
      storageBucket: 'demo-ibarbear.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:demo-ibarbear',
    }
  : {
      apiKey: firebaseConfigJson.apiKey,
      authDomain: firebaseConfigJson.authDomain,
      projectId: firebaseConfigJson.projectId,
      storageBucket: firebaseConfigJson.storageBucket,
      messagingSenderId: firebaseConfigJson.messagingSenderId,
      appId: firebaseConfigJson.appId,
    };

// Mantem a instancia padrao que o restante do projeto ja utiliza.
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// O mesmo banco nomeado e utilizado em producao e no emulador,
// mas o projeto muda para demo-ibarbear no modo de testes.
const firestoreDatabaseId = firebaseConfigJson.firestoreDatabaseId;
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

if (USE_FIREBASE_EMULATORS) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  console.info('[IBARBEAR] MODO EMULADOR ATIVO', {
    projectId: app.options.projectId,
    firestoreDatabaseId: firestoreDatabaseId || '(default)',
    firestore: '127.0.0.1:8080',
    auth: '127.0.0.1:9099',
  });
}
