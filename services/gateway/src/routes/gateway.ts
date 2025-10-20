import { Request, Response, NextFunction } from 'express';
import { PreflightRequest, PreflightResponse, PolicyViolation } from '@atomic/types';
import { CompositeRedactor } from '@atomic/utils';

const redactor = new CompositeRedactor();

// Policy rules
const policies = {
  maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '10485760', 10), // 10MB default
  secretRedactionEnabled: process.env.SECRET_REDACTION_ENABLED !== 'false',
  piiRedactionEnabled: process.env.PII_REDACTION_ENABLED !== 'false',
};

export async function preflightHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { content, provider, metadata } = req.body as PreflightRequest;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const violations: PolicyViolation[] = [];
    let sanitizedContent = content;
    let allRedactions: any[] = [];

    // Check size policy
    if (content.length > policies.maxRequestSize) {
      violations.push({
        rule: 'max_request_size',
        severity: 'error',
        message: `Content exceeds maximum size of ${policies.maxRequestSize} bytes`,
      });
    }

    // Redact secrets and PII if enabled
    if (policies.secretRedactionEnabled || policies.piiRedactionEnabled) {
      const { sanitized, redactions } = redactor.redactAll(content);
      sanitizedContent = sanitized;
      allRedactions = redactions;

      if (redactions.length > 0) {
        violations.push({
          rule: 'sensitive_data_detected',
          severity: 'warning',
          message: `Found ${redactions.length} sensitive data items that were redacted`,
        });
      }
    }

    const response: PreflightResponse = {
      ok: violations.filter((v) => v.severity === 'error').length === 0,
      violations,
      redactions: allRedactions,
      sanitizedContent: sanitizedContent !== content ? sanitizedContent : undefined,
    };

    // Track latency
    const latencyMs = Date.now() - (req as any).startTime;
    res.setHeader('X-Preflight-Latency-Ms', latencyMs.toString());

    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function routeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { task, budget, preferredProvider } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    // Simple routing logic - can be enhanced with actual policy engine
    const providers = ['copilot', 'cursor', 'windsurf', 'openai', 'anthropic'] as const;
    
    let selectedProvider = preferredProvider || 'copilot';
    
    // Check if preferred provider is enabled
    const providerEnabled = process.env[`${selectedProvider.toUpperCase()}_ENABLED`] !== 'false';
    
    if (!providerEnabled) {
      // Fall back to first enabled provider
      selectedProvider = providers.find(
        (p) => process.env[`${p.toUpperCase()}_ENABLED`] !== 'false'
      ) || 'copilot';
    }

    const response = {
      provider: selectedProvider,
      policyApplied: true,
      estimatedCost: budget ? Math.min(budget, 10) : 5, // Placeholder logic
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}
