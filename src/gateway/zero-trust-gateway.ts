/**
 * Zero-Trust Gateway - Secret and PII detection/redaction
 */

import { Policy, RedactionResult, Finding, CodeRange } from '../types';

export class ZeroTrustGateway {
  private policies: Map<string, Policy> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  addPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
  }

  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  listPolicies(): Policy[] {
    return Array.from(this.policies.values()).filter((p) => p.enabled);
  }

  async scan(content: string, file: string): Promise<RedactionResult> {
    const findings: Finding[] = [];
    let redacted = content;

    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      for (const pattern of policy.patterns) {
        const regex = new RegExp(pattern, 'g');
        let match;

        while ((match = regex.exec(content)) !== null) {
          const finding: Finding = {
            type: policy.type,
            location: this.getLocation(content, match.index, match[0].length, file),
            severity: policy.severity,
            message: `${policy.name}: ${policy.type} detected`,
            policy: policy.id,
          };

          findings.push(finding);

          // Apply action
          if (policy.action === 'redact') {
            redacted = this.redactMatch(redacted, match[0], policy.type);
          } else if (policy.action === 'block') {
            throw new Error(
              `Blocked by policy ${policy.name}: ${policy.type} detected at ${finding.location.start.line}:${finding.location.start.column}`
            );
          }
        }
      }
    }

    return {
      original: content,
      redacted,
      findings,
    };
  }

  async scanMultiple(files: Map<string, string>): Promise<Map<string, RedactionResult>> {
    const results = new Map<string, RedactionResult>();

    for (const [file, content] of files) {
      const result = await this.scan(content, file);
      results.set(file, result);
    }

    return results;
  }

  private redactMatch(content: string, match: string, type: string): string {
    const redactionMap: { [key: string]: string } = {
      secret: '[REDACTED_SECRET]',
      pii: '[REDACTED_PII]',
      custom: '[REDACTED]',
    };

    return content.replace(match, redactionMap[type] || '[REDACTED]');
  }

  private getLocation(
    content: string,
    index: number,
    length: number,
    file: string
  ): CodeRange {
    const lines = content.substring(0, index).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length;

    return {
      start: { line, column, file },
      end: { line, column: column + length, file },
    };
  }

  private initializeDefaultPolicies(): void {
    // AWS Secret Keys
    this.addPolicy({
      id: 'aws-secret-key',
      name: 'AWS Secret Key',
      type: 'secret',
      enabled: true,
      patterns: ['AKIA[0-9A-Z]{16}'],
      action: 'redact',
      severity: 'critical',
    });

    // Private Keys
    this.addPolicy({
      id: 'private-key',
      name: 'Private Key',
      type: 'secret',
      enabled: true,
      patterns: ['-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'],
      action: 'redact',
      severity: 'critical',
    });

    // API Keys (generic)
    this.addPolicy({
      id: 'api-key',
      name: 'API Key',
      type: 'secret',
      enabled: true,
      patterns: [
        'api[_-]?key[\'"]?\\s*[:=]\\s*[\'"][a-zA-Z0-9_\\-]{20,}[\'"]',
        'apikey[\'"]?\\s*[:=]\\s*[\'"][a-zA-Z0-9_\\-]{20,}[\'"]',
      ],
      action: 'redact',
      severity: 'high',
    });

    // OAuth Tokens
    this.addPolicy({
      id: 'oauth-token',
      name: 'OAuth Token',
      type: 'secret',
      enabled: true,
      patterns: ['ya29\\.[0-9A-Za-z_\\-]{68,}', 'gho_[0-9A-Za-z]{36}'],
      action: 'redact',
      severity: 'critical',
    });

    // Email Addresses (PII)
    this.addPolicy({
      id: 'email',
      name: 'Email Address',
      type: 'pii',
      enabled: true,
      patterns: ['[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'],
      action: 'redact',
      severity: 'medium',
    });

    // Credit Card Numbers (PII)
    this.addPolicy({
      id: 'credit-card',
      name: 'Credit Card',
      type: 'pii',
      enabled: true,
      patterns: ['\\b(?:\\d{4}[- ]?){3}\\d{4}\\b'],
      action: 'redact',
      severity: 'high',
    });

    // Social Security Numbers (PII)
    this.addPolicy({
      id: 'ssn',
      name: 'Social Security Number',
      type: 'pii',
      enabled: true,
      patterns: ['\\b\\d{3}-\\d{2}-\\d{4}\\b'],
      action: 'redact',
      severity: 'high',
    });

    // IP Addresses (PII - can be considered PII in some contexts)
    this.addPolicy({
      id: 'ip-address',
      name: 'IP Address',
      type: 'pii',
      enabled: false, // Disabled by default as IPs are often needed
      patterns: ['\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b'],
      action: 'warn',
      severity: 'low',
    });
  }
}
