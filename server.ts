import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import 'dotenv/config'; // Carrega variáveis de ambiente do ficheiro .env

// Inicializa o cliente do Stripe usando a chave do ficheiro .env
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    })
  : null;

// Registro em memória das transações do Stripe
interface ServerPaymentEvent {
  paymentId: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  receivedAt: string;
  source: string;
  payload?: any;
}

const serverPaymentEvents: Map<string, ServerPaymentEvent> = new Map();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  /**
   * ==========================================
   * STRIPE INTEGRATION ENDPOINTS
   * ==========================================
   */

  /**
   * POST /api/create-payment-intent
   * Cria uma intenção de pagamento no Stripe
   */
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: 'Chave STRIPE_SECRET_KEY não configurada no ficheiro .env.',
        });
      }

      const { amount, currency = 'brl', paymentId } = req.body;

      // Cria a Payment Intent no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount || 5000, // Valor em centavos (ex: 5000 = R$ 50,00)
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          paymentId: paymentId || `STRIPE-${Date.now()}`,
        },
      });

      // Registra o evento de pagamento pendente
      const intentId = paymentIntent.id;
      serverPaymentEvents.set(intentId, {
        paymentId: intentId,
        amount: amount || 5000,
        status: 'pending',
        receivedAt: new Date().toISOString(),
        source: 'stripe_payment_intent',
        payload: { clientSecret: paymentIntent.client_secret },
      });

      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: intentId,
      });
    } catch (err: any) {
      console.error('Erro ao criar Stripe PaymentIntent:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * GET /api/stripe/status/:paymentIntentId
   * Consulta o status de um pagamento do Stripe
   */
  app.get('/api/stripe/status/:paymentIntentId', async (req, res) => {
    const { paymentIntentId } = req.params;

    try {
      if (!stripe) {
        return res.status(500).json({ success: false, message: 'Stripe não configurado.' });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return res.json({
        success: true,
        status: paymentIntent.status, // ex: 'succeeded', 'requires_payment_method', etc.
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  /**
   * POST /api/stripe/webhook
   * Webhook para receber confirmações automáticas do Stripe
   */
  app.post('/api/stripe/webhook', (req, res) => {
    try {
      const event = req.body;

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log('Pagamento Stripe aprovado:', paymentIntent.id);

        const approvedEvent: ServerPaymentEvent = {
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount,
          status: 'approved',
          receivedAt: new Date().toISOString(),
          source: 'stripe_webhook',
          payload: paymentIntent,
        };

        serverPaymentEvents.set(paymentIntent.id, approvedEvent);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error('Erro no Webhook do Stripe:', err);
      res.status(200).json({ received: true });
    }
  });

  // Serve public directory (favicons, logos, static images)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();