import { Redaction } from '@atomic/types';

// Common secret patterns
const SECRET_PATTERNS = [
  // API Keys
  /(?:api[_-]?key|apikey)[_-]?[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
  // GitHub tokens
  /gh[pousr]_[A-Za-z0-9_]{36,}/g,
  // AWS keys
  /AKIA[0-9A-Z]{16}/g,
  // Generic secrets
  /(?:secret|password|passwd|pwd)[_-]?[:=]\s*['"]?([^\s'"]{8,})['"]?/gi,
  // Private keys
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
  // JWT tokens
  /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
  // Bearer tokens
  /Bearer\s+[A-Za-z0-9_\-\.=]+/gi,
];

// PII patterns
const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers (basic US format)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // SSN
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Credit card numbers (basic pattern)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];

export class SecretRedactor {
  private patterns: RegExp[];

  constructor(customPatterns: RegExp[] = []) {
    this.patterns = [...SECRET_PATTERNS, ...customPatterns];
  }

  redact(content: string): { sanitized: string; redactions: Redaction[] } {
    let sanitized = content;
    const redactions: Redaction[] = [];

    for (const pattern of this.patterns) {
      const matches = content.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        if (match.index !== undefined && match[0]) {
          const position = match.index;
          const length = match[0].length;
          const placeholder = '***REDACTED_SECRET***';

          redactions.push({
            type: 'secret',
            position,
            length,
            placeholder,
          });

          // Replace in sanitized content
          sanitized =
            sanitized.slice(0, position) +
            placeholder +
            sanitized.slice(position + length);
        }
      }
    }

    return { sanitized, redactions };
  }

  scan(content: string): boolean {
    return this.patterns.some((pattern) => pattern.test(content));
  }
}

export class PIIRedactor {
  private patterns: RegExp[];

  constructor(customPatterns: RegExp[] = []) {
    this.patterns = [...PII_PATTERNS, ...customPatterns];
  }

  redact(content: string): { sanitized: string; redactions: Redaction[] } {
    let sanitized = content;
    const redactions: Redaction[] = [];

    for (const pattern of this.patterns) {
      const matches = content.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        if (match.index !== undefined && match[0]) {
          const position = match.index;
          const length = match[0].length;
          const placeholder = '***REDACTED_PII***';

          redactions.push({
            type: 'pii',
            position,
            length,
            placeholder,
          });

          sanitized =
            sanitized.slice(0, position) +
            placeholder +
            sanitized.slice(position + length);
        }
      }
    }

    return { sanitized, redactions };
  }

  scan(content: string): boolean {
    return this.patterns.some((pattern) => pattern.test(content));
  }
}

export class CompositeRedactor {
  private secretRedactor: SecretRedactor;
  private piiRedactor: PIIRedactor;

  constructor() {
    this.secretRedactor = new SecretRedactor();
    this.piiRedactor = new PIIRedactor();
  }

  redactAll(content: string): { sanitized: string; redactions: Redaction[] } {
    // First redact secrets
    const { sanitized: secretsSanitized, redactions: secretRedactions } =
      this.secretRedactor.redact(content);

    // Then redact PII
    const { sanitized: finalSanitized, redactions: piiRedactions } =
      this.piiRedactor.redact(secretsSanitized);

    return {
      sanitized: finalSanitized,
      redactions: [...secretRedactions, ...piiRedactions],
    };
  }

  scanForSensitiveData(content: string): {
    hasSecrets: boolean;
    hasPII: boolean;
  } {
    return {
      hasSecrets: this.secretRedactor.scan(content),
      hasPII: this.piiRedactor.scan(content),
    };
  }
}
