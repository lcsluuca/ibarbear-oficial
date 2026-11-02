import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

// Identifica se o projeto foi iniciado em modo emulador.
const useFirebaseEmulatorMode =
  process.argv.some(
    (arg, i) =>
      arg === '--mode' &&
      process.argv[i + 1] === 'emulator'
  ) ||
  process.argv.includes('--mode=emulator');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  // Verificacao de funcionamento do servidor.
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString()
    });
  });

  // Arquivos publicos: logos, imagens e favicon.
  app.use(
    express.static(path.join(process.cwd(), 'public'))
  );

  if (process.env.NODE_ENV !== 'production') {
    // Preserva o modo de desenvolvimento com Firebase Emulator.
    const viteMode =
      useFirebaseEmulatorMode
        ? 'emulator'
        : 'development';

    const vite = await createViteServer({
      mode: viteMode,
      server: {
        middlewareMode: true
      },
      appType: 'spa'
    });

    console.log(
      `[IBARBEAR] Vite mode: ${vite.config.mode}`
    );

    console.log(
      '[IBARBEAR] Firebase Emulator habilitado:',
      vite.config.env.VITE_USE_FIREBASE_EMULATORS === 'true'
    );

    if (
      useFirebaseEmulatorMode &&
      vite.config.env.VITE_USE_FIREBASE_EMULATORS !== 'true'
    ) {
      throw new Error(
        'Modo emulator solicitado, mas ' +
        'VITE_USE_FIREBASE_EMULATORS nao esta true.'
      );
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(
      process.cwd(),
      'dist'
    );

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(
        path.join(distPath, 'index.html')
      );
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
}

startServer();