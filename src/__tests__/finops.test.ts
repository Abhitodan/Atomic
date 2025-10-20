/**
 * Tests for FinOpsManager
 */

import { FinOpsManager } from '../finops';

describe('FinOpsManager', () => {
  let finops: FinOpsManager;

  beforeEach(() => {
    finops = new FinOpsManager();
  });

  describe('Budget Management', () => {
    test('should create and retrieve budget', () => {
      finops.createBudget({
        id: 'test-budget',
        maxCost: 100,
        currentCost: 0,
        alertThreshold: 80,
        models: [{ modelId: 'gpt-3.5-turbo', priority: 1 }],
      });

      const budget = finops.getBudget('test-budget');
      expect(budget).toBeDefined();
      expect(budget!.maxCost).toBe(100);
    });
  });

  describe('Usage Tracking', () => {
    test('should track usage and update budget', async () => {
      finops.createBudget({
        id: 'test-budget',
        maxCost: 10,
        currentCost: 0,
        alertThreshold: 80,
        models: [{ modelId: 'gpt-3.5-turbo', priority: 1 }],
      });

      await finops.trackUsage({
        modelId: 'gpt-3.5-turbo',
        inputTokens: 1000,
        outputTokens: 500,
        timestamp: Date.now(),
      });

      const budget = finops.getBudget('test-budget');
      expect(budget!.currentCost).toBeGreaterThan(0);
    });

    test('should throw error when budget exceeded', async () => {
      finops.createBudget({
        id: 'test-budget',
        maxCost: 0.001,
        currentCost: 0,
        alertThreshold: 80,
        models: [{ modelId: 'gpt-3.5-turbo', priority: 1 }],
      });

      await expect(
        finops.trackUsage({
          modelId: 'gpt-3.5-turbo',
          inputTokens: 10000,
          outputTokens: 5000,
          timestamp: Date.now(),
        })
      ).rejects.toThrow('Budget');
    });
  });

  describe('Model Routing', () => {
    test('should route to highest priority model within budget', async () => {
      finops.createBudget({
        id: 'test-budget',
        maxCost: 10,
        currentCost: 0,
        alertThreshold: 80,
        models: [
          { modelId: 'gpt-3.5-turbo', priority: 1 },
          { modelId: 'gpt-4', priority: 2 },
        ],
      });

      const modelId = await finops.routeRequest('test-budget', 1000);
      expect(modelId).toBe('gpt-4');
    });

    test('should fallback to cheaper model when budget low', async () => {
      finops.createBudget({
        id: 'test-budget',
        maxCost: 0.01,
        currentCost: 0,
        alertThreshold: 80,
        models: [
          { modelId: 'gpt-3.5-turbo', priority: 1 },
          { modelId: 'gpt-4', priority: 2 },
        ],
      });

      const modelId = await finops.routeRequest('test-budget', 1000);
      expect(modelId).toBe('gpt-3.5-turbo');
    });
  });

  describe('Cost Forecasting', () => {
    test('should forecast cost accurately', async () => {
      const forecast = await finops.forecastCost('gpt-3.5-turbo', 1000, 500);

      expect(forecast.estimatedCost).toBeGreaterThan(0);
      expect(forecast.confidence).toBeGreaterThan(0);
      expect(forecast.breakdown).toHaveLength(1);
      expect(forecast.breakdown[0].modelId).toBe('gpt-3.5-turbo');
    });
  });

  describe('Cost Reporting', () => {
    test('should calculate total cost', async () => {
      await finops.trackUsage({
        modelId: 'gpt-3.5-turbo',
        inputTokens: 1000,
        outputTokens: 500,
        timestamp: Date.now(),
      });

      const total = finops.getTotalCost();
      expect(total).toBeGreaterThan(0);
    });

    test('should calculate model-specific cost', async () => {
      await finops.trackUsage({
        modelId: 'gpt-3.5-turbo',
        inputTokens: 1000,
        outputTokens: 500,
        timestamp: Date.now(),
      });

      await finops.trackUsage({
        modelId: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 500,
        timestamp: Date.now(),
      });

      const gpt35Cost = finops.getModelCost('gpt-3.5-turbo');
      const gpt4Cost = finops.getModelCost('gpt-4');

      expect(gpt35Cost).toBeGreaterThan(0);
      expect(gpt4Cost).toBeGreaterThan(gpt35Cost); // GPT-4 is more expensive
    });
  });
});
