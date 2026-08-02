import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Fake PaySuite API integration as requested in backend
app.post('/api/paysuite/checkout', async (req, res) => {
  const { method, number, amount, company_id, plan } = req.body;
  console.log('Initiating PaySuite checkout:', { method, number, amount, company_id, plan });
  
  // Simulate delay for the payment process
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // In a real application, this would securely communicate with the PaySuite API using the PAYSUITE_API_KEY
  // and we would await a webhook or check status. For this demo, we simulate a successful initiation.
  
  res.json({ 
    status: 'pending', 
    message: 'Aguardando confirmação no seu telefone...', 
    transaction_id: `txn_${Date.now()}` 
  });
});

app.post('/api/paysuite/confirm', async (req, res) => {
  // Simulate polling for confirmation or a direct confirmation from the demo UI
  await new Promise(resolve => setTimeout(resolve, 1500));
  res.json({ status: 'approved' });
});

// Vite middleware for development
async function startServer() {
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
