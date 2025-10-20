/**
 * Tests for ZeroTrustGateway
 */

import { ZeroTrustGateway } from '../gateway';

describe('ZeroTrustGateway', () => {
  let gateway: ZeroTrustGateway;

  beforeEach(() => {
    gateway = new ZeroTrustGateway();
  });

  describe('Secret Detection', () => {
    test('should detect AWS secret keys', async () => {
      const result = await gateway.scan('AKIAIOSFODNN7EXAMPLE', 'test.ts');
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].type).toBe('secret');
    });

    test('should detect private keys', async () => {
      const result = await gateway.scan('-----BEGIN PRIVATE KEY-----', 'test.ts');
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].type).toBe('secret');
    });

    test('should detect API keys', async () => {
      const result = await gateway.scan(
        'api_key = "sk_test_abcdefghijklmnopqrstuvwxyz123456"',
        'test.ts'
      );
      expect(result.findings.length).toBeGreaterThan(0);
    });
  });

  describe('PII Detection', () => {
    test('should detect email addresses', async () => {
      const result = await gateway.scan('user@example.com', 'test.ts');
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].type).toBe('pii');
    });

    test('should detect credit card numbers', async () => {
      const result = await gateway.scan('4532-1488-0343-6467', 'test.ts');
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].type).toBe('pii');
    });

    test('should detect SSN', async () => {
      const result = await gateway.scan('123-45-6789', 'test.ts');
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0].type).toBe('pii');
    });
  });

  describe('Redaction', () => {
    test('should redact AWS keys', async () => {
      const result = await gateway.scan('AKIAIOSFODNN7EXAMPLE', 'test.ts');
      expect(result.redacted).toContain('[REDACTED_SECRET]');
      expect(result.redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    test('should redact PII', async () => {
      const result = await gateway.scan('user@example.com', 'test.ts');
      expect(result.redacted).toContain('[REDACTED_PII]');
      expect(result.redacted).not.toContain('user@example.com');
    });
  });

  describe('Policy Management', () => {
    test('should add custom policy', async () => {
      gateway.addPolicy({
        id: 'custom-test',
        name: 'Custom Test',
        type: 'custom',
        enabled: true,
        patterns: ['SECRET_PATTERN'],
        action: 'redact',
        severity: 'high',
      });

      const result = await gateway.scan('SECRET_PATTERN', 'test.ts');
      expect(result.findings.length).toBeGreaterThan(0);
    });

    test('should disable policy', async () => {
      const policies = gateway.listPolicies();
      const emailPolicy = policies.find((p) => p.id === 'email');

      if (emailPolicy) {
        emailPolicy.enabled = false;
        gateway.addPolicy(emailPolicy);
      }

      const result = await gateway.scan('user@example.com', 'test.ts');
      const emailFindings = result.findings.filter((f) => f.policy === 'email');
      expect(emailFindings.length).toBe(0);
    });
  });
});
