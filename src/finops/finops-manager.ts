/**
 * FinOps - Budget tracking, model routing, and cost forecasting
 */

import { Budget, CostForecast } from '../types';

export interface ModelUsage {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: number;
}

export interface ModelPricing {
  modelId: string;
  inputTokenCost: number; // Cost per 1K tokens
  outputTokenCost: number; // Cost per 1K tokens
}

export class FinOpsManager {
  private budgets: Map<string, Budget> = new Map();
  private usage: ModelUsage[] = [];
  private pricing: Map<string, ModelPricing> = new Map();

  constructor() {
    this.initializeDefaultPricing();
  }

  createBudget(budget: Budget): void {
    this.budgets.set(budget.id, budget);
  }

  getBudget(budgetId: string): Budget | undefined {
    return this.budgets.get(budgetId);
  }

  async trackUsage(usage: ModelUsage): Promise<void> {
    this.usage.push(usage);

    // Update budget costs
    const cost = this.calculateCost(usage);

    for (const budget of this.budgets.values()) {
      const modelBudget = budget.models.find((m) => m.modelId === usage.modelId);
      if (modelBudget) {
        budget.currentCost += cost;

        // Check if alert threshold is reached
        const percentUsed = (budget.currentCost / budget.maxCost) * 100;
        if (percentUsed >= budget.alertThreshold) {
          await this.sendAlert(budget, percentUsed);
        }

        // Check if budget is exceeded
        if (budget.currentCost >= budget.maxCost) {
          throw new Error(`Budget ${budget.id} exceeded: $${budget.currentCost} / $${budget.maxCost}`);
        }
      }
    }
  }

  async routeRequest(
    budgetId: string,
    estimatedTokens: number
  ): Promise<string> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    // Sort models by priority (highest first)
    const sortedModels = [...budget.models].sort((a, b) => b.priority - a.priority);

    for (const modelBudget of sortedModels) {
      // Check if this model is within budget
      const pricing = this.pricing.get(modelBudget.modelId);
      if (!pricing) continue;

      const estimatedCost = (estimatedTokens / 1000) * pricing.inputTokenCost;
      const remainingBudget = budget.maxCost - budget.currentCost;

      if (estimatedCost <= remainingBudget) {
        // Check model-specific limits
        if (modelBudget.maxCost !== undefined) {
          const modelCurrentCost = this.getModelCost(modelBudget.modelId);
          if (modelCurrentCost + estimatedCost > modelBudget.maxCost) {
            continue;
          }
        }

        return modelBudget.modelId;
      }
    }

    throw new Error('No suitable model found within budget constraints');
  }

  async forecastCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<CostForecast> {
    const pricing = this.pricing.get(modelId);
    if (!pricing) {
      throw new Error(`No pricing information for model ${modelId}`);
    }

    const inputCost = (inputTokens / 1000) * pricing.inputTokenCost;
    const outputCost = (outputTokens / 1000) * pricing.outputTokenCost;
    const totalCost = inputCost + outputCost;

    return {
      estimatedCost: totalCost,
      confidence: 0.95, // High confidence for direct calculation
      breakdown: [
        {
          modelId,
          tokens: inputTokens + outputTokens,
          cost: totalCost,
        },
      ],
    };
  }

  getTotalCost(): number {
    let total = 0;
    for (const usage of this.usage) {
      total += this.calculateCost(usage);
    }
    return total;
  }

  getModelCost(modelId: string): number {
    let total = 0;
    for (const usage of this.usage) {
      if (usage.modelId === modelId) {
        total += this.calculateCost(usage);
      }
    }
    return total;
  }

  private calculateCost(usage: ModelUsage): number {
    const pricing = this.pricing.get(usage.modelId);
    if (!pricing) return 0;

    const inputCost = (usage.inputTokens / 1000) * pricing.inputTokenCost;
    const outputCost = (usage.outputTokens / 1000) * pricing.outputTokenCost;
    return inputCost + outputCost;
  }

  private async sendAlert(budget: Budget, percentUsed: number): Promise<void> {
    // In a real implementation, this would send notifications
    console.warn(
      `Budget alert: ${budget.id} is ${percentUsed.toFixed(2)}% used ($${budget.currentCost} / $${budget.maxCost})`
    );
  }

  private initializeDefaultPricing(): void {
    // Default pricing based on common models (as of 2024)
    this.pricing.set('gpt-4', {
      modelId: 'gpt-4',
      inputTokenCost: 0.03,
      outputTokenCost: 0.06,
    });

    this.pricing.set('gpt-3.5-turbo', {
      modelId: 'gpt-3.5-turbo',
      inputTokenCost: 0.0015,
      outputTokenCost: 0.002,
    });

    this.pricing.set('claude-3-opus', {
      modelId: 'claude-3-opus',
      inputTokenCost: 0.015,
      outputTokenCost: 0.075,
    });

    this.pricing.set('claude-3-sonnet', {
      modelId: 'claude-3-sonnet',
      inputTokenCost: 0.003,
      outputTokenCost: 0.015,
    });
  }

  setPricing(pricing: ModelPricing): void {
    this.pricing.set(pricing.modelId, pricing);
  }
}
