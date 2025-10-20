/**
 * Tests for AtomicEngine
 */

import { AtomicEngine } from '../atomic-engine';
import { Language, ChangeType } from '../types';

describe('AtomicEngine', () => {
  let engine: AtomicEngine;

  beforeEach(async () => {
    engine = new AtomicEngine();
    await engine.initialize();
  });

  describe('Initialization', () => {
    test('should initialize without errors', async () => {
      const newEngine = new AtomicEngine();
      await expect(newEngine.initialize()).resolves.not.toThrow();
    });
  });

  describe('Checkpoint Management', () => {
    test('should create a checkpoint', async () => {
      const checkpointId = await engine.createCheckpoint({
        mission: 'test-mission',
        description: 'Test checkpoint',
        reversible: true,
        dependencies: [],
      });

      expect(checkpointId).toBeDefined();
      expect(typeof checkpointId).toBe('string');
    });

    test('should throw error when not initialized', async () => {
      const uninitializedEngine = new AtomicEngine();
      await expect(
        uninitializedEngine.createCheckpoint({
          mission: 'test',
          description: 'test',
          reversible: true,
          dependencies: [],
        })
      ).rejects.toThrow('AtomicEngine not initialized');
    });
  });

  describe('Security Scanning', () => {
    test('should detect AWS secret keys', async () => {
      const files = new Map([
        ['test.ts', 'const apiKey = "AKIAIOSFODNN7EXAMPLE";'],
      ]);

      const results = await engine.scanFiles(files);
      const result = results.get('test.ts');

      expect(result).toBeDefined();
      expect(result!.findings.length).toBeGreaterThan(0);
      expect(result!.findings[0].type).toBe('secret');
    });

    test('should detect email addresses', async () => {
      const files = new Map([
        ['test.ts', 'const email = "user@example.com";'],
      ]);

      const results = await engine.scanFiles(files);
      const result = results.get('test.ts');

      expect(result).toBeDefined();
      expect(result!.findings.length).toBeGreaterThan(0);
      expect(result!.findings[0].type).toBe('pii');
    });

    test('should redact secrets', async () => {
      const files = new Map([
        ['test.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";'],
      ]);

      const results = await engine.scanFiles(files);
      const result = results.get('test.ts');

      expect(result).toBeDefined();
      expect(result!.redacted).toContain('[REDACTED_SECRET]');
      expect(result!.redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });
  });

  describe('Budget Management', () => {
    test('should create a budget', async () => {
      await engine.createBudget({
        id: 'test-budget',
        maxCost: 100,
        currentCost: 0,
        alertThreshold: 80,
        models: [{ modelId: 'gpt-3.5-turbo', priority: 1 }],
      });

      const budget = engine.getBudget('test-budget');
      expect(budget).toBeDefined();
      expect(budget!.maxCost).toBe(100);
    });

    test('should return undefined for non-existent budget', () => {
      const budget = engine.getBudget('non-existent');
      expect(budget).toBeUndefined();
    });
  });

  describe('ChangeSpec Validation', () => {
    test('should validate simple JavaScript change', async () => {
      const code = 'const x = 1;';
      const change = {
        id: 'test-change',
        type: ChangeType.INSERT,
        range: {
          start: { line: 1, column: 0, file: 'test.js' },
          end: { line: 1, column: 0, file: 'test.js' },
        },
        content: 'const y = 2;',
        invariants: [],
        metadata: {
          author: 'test',
          timestamp: Date.now(),
          reason: 'test',
          confidence: 1.0,
          reviewRequired: false,
        },
      };

      const isValid = await engine.validateChangeSpec(change, code, Language.JAVASCRIPT);
      expect(isValid).toBe(true);
    });
  });
});
