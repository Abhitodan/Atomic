import express from 'express';
import dotenv from 'dotenv';
import { logger } from '@atomic/utils';
import { ForecastRequest, ForecastResponse, ModelPolicy, BudgetStatus } from '@atomic/types';

dotenv.config();

const app = express();
const port = process.env.FINOPS_PORT || 3004;

app.use(express.json());

// In-memory storage
const policies: ModelPolicy[] = [];
const budgets = new Map<string, BudgetStatus>();

// Default budget
const defaultBudget: BudgetStatus = {
  total: parseFloat(process.env.DEFAULT_BUDGET_USD || '100'),
  consumed: 0,
  remaining: parseFloat(process.env.DEFAULT_BUDGET_USD || '100'),
  breached: false,
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'finops' });
});

// Cost forecast
app.post('/finops/forecast', (req, res) => {
  try {
    const { changeSpec, provider } = req.body as ForecastRequest;

    // Simple cost estimation based on scope size
    const fileCount = changeSpec.scope.length;
    const patchCount = changeSpec.patches.length;

    // Placeholder calculation
    const baseTokens = fileCount * 1000 + patchCount * 500;
    const usdPerToken = 0.00002; // Example rate

    const forecast: ForecastResponse = {
      usdEstimate: baseTokens * usdPerToken,
      tokens: baseTokens,
      p95Latency: 2000, // ms
    };

    logger.info('Cost forecast generated', { changeSpecId: changeSpec.id, forecast });

    res.json(forecast);
  } catch (error) {
    logger.error('Error generating forecast', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get budget status
app.get('/finops/budget', (req, res) => {
  res.json(defaultBudget);
});

// Update budget
app.post('/finops/budget', (req, res) => {
  const { consumed } = req.body;

  defaultBudget.consumed += consumed || 0;
  defaultBudget.remaining = defaultBudget.total - defaultBudget.consumed;
  defaultBudget.breached = defaultBudget.remaining < 0;

  if (defaultBudget.breached && process.env.BUDGET_BREACH_WEBHOOK_URL) {
    // In a real implementation, send webhook notification
    logger.warn('Budget breached', { budget: defaultBudget });
  }

  res.json(defaultBudget);
});

// Get policies
app.get('/policies/models', (req, res) => {
  res.json(policies);
});

// Set policy
app.put('/policies/models', (req, res) => {
  const policy = req.body as ModelPolicy;

  // Remove existing policy for the same task
  const index = policies.findIndex((p) => p.task === policy.task);
  if (index !== -1) {
    policies.splice(index, 1);
  }

  policies.push(policy);
  logger.info('Model policy updated', { policy });

  res.json(policy);
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`FinOps service listening on port ${port}`, { port });
  });
}

export default app;
