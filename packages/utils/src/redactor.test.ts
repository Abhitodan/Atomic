import { SecretRedactor, PIIRedactor, CompositeRedactor } from './redactor';

describe('SecretRedactor', () => {
  let redactor: SecretRedactor;

  beforeEach(() => {
    redactor = new SecretRedactor();
  });

  test('should redact API keys', () => {
    const content = 'apikey: abcdef1234567890abcdef1234567890';
    const { sanitized, redactions } = redactor.redact(content);

    expect(redactions.length).toBeGreaterThan(0);
    expect(redactions[0].type).toBe('secret');
    expect(sanitized).toContain('***REDACTED_SECRET***');
  });

  test('should redact GitHub tokens', () => {
    const content = 'token: ghp_abcdefghijklmnopqrstuvwxyz1234567890';
    const { sanitized, redactions } = redactor.redact(content);

    expect(redactions.length).toBeGreaterThan(0);
    expect(sanitized).toContain('***REDACTED_SECRET***');
  });

  test('should redact AWS keys', () => {
    const content = 'AWS_KEY=AKIAIOSFODNN7EXAMPLE';
    const { sanitized, redactions } = redactor.redact(content);

    expect(redactions.length).toBeGreaterThan(0);
    expect(sanitized).toContain('***REDACTED_SECRET***');
  });

  test('should detect secrets without redacting', () => {
    const content = 'password=secret123';
    const hasSecrets = redactor.scan(content);

    expect(hasSecrets).toBe(true);
  });

  test('should not detect secrets in clean content', () => {
    const content = 'This is normal text without secrets';
    const hasSecrets = redactor.scan(content);

    expect(hasSecrets).toBe(false);
  });
});

describe('PIIRedactor', () => {
  let redactor: PIIRedactor;

  beforeEach(() => {
    redactor = new PIIRedactor();
  });

  test('should redact email addresses', () => {
    const content = 'Contact: user@example.com';
    const { sanitized, redactions } = redactor.redact(content);

    expect(redactions.length).toBeGreaterThan(0);
    expect(redactions[0].type).toBe('pii');
    expect(sanitized).toContain('***REDACTED_PII***');
  });

  test('should redact phone numbers', () => {
    const content = 'Call: 555-123-4567';
    const { sanitized, redactions } = redactor.redact(content);

    expect(redactions.length).toBeGreaterThan(0);
    expect(sanitized).toContain('***REDACTED_PII***');
  });

  test('should redact SSN', () => {
    const content = 'SSN: 123-45-6789';
    const { sanitized, redactions } = redactor.redact(content);

    expect(redactions.length).toBeGreaterThan(0);
    expect(sanitized).toContain('***REDACTED_PII***');
  });

  test('should detect PII without redacting', () => {
    const content = 'Email: test@test.com';
    const hasPII = redactor.scan(content);

    expect(hasPII).toBe(true);
  });

  test('should not detect PII in clean content', () => {
    const content = 'This is normal text';
    const hasPII = redactor.scan(content);

    expect(hasPII).toBe(false);
  });
});

describe('CompositeRedactor', () => {
  let redactor: CompositeRedactor;

  beforeEach(() => {
    redactor = new CompositeRedactor();
  });

  test('should redact both secrets and PII', () => {
    const content = 'password: secret123456789 Email: user@test.com';
    const { sanitized, redactions } = redactor.redactAll(content);

    expect(redactions.length).toBeGreaterThan(0);
    const secretRedactions = redactions.filter((r: any) => r.type === 'secret');
    const piiRedactions = redactions.filter((r: any) => r.type === 'pii');

    expect(secretRedactions.length).toBeGreaterThan(0);
    expect(piiRedactions.length).toBeGreaterThan(0);
  });

  test('should scan for both secrets and PII', () => {
    const content = 'password: testpassword123 email@example.com';
    const { hasSecrets, hasPII } = redactor.scanForSensitiveData(content);

    expect(hasSecrets).toBe(true);
    expect(hasPII).toBe(true);
  });

  test('should handle clean content', () => {
    const content = 'This is completely clean text with no sensitive data';
    const { hasSecrets, hasPII } = redactor.scanForSensitiveData(content);

    expect(hasSecrets).toBe(false);
    expect(hasPII).toBe(false);
  });
});
