# Security Policy

## Reporting a Vulnerability

We take the security of Atomic seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT** create a public GitHub issue
2. Email security details to the maintainers (create a security advisory on GitHub)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

Atomic includes several built-in security features:

### Zero-Trust Gateway

- **Secret Detection**: Automatically identifies and redacts sensitive data
  - AWS Access Keys
  - Private Keys (RSA, EC, DSA)
  - API Keys and Tokens
  - OAuth Tokens
  
- **PII Protection**: Detects and redacts personally identifiable information
  - Email addresses
  - Credit card numbers
  - Social Security Numbers
  - IP addresses (optional)

### Default Policies

All policies can be customized or disabled. Default actions:

- **Critical Severity**: Block merge/deployment
- **High Severity**: Redact and warn
- **Medium Severity**: Redact
- **Low Severity**: Warn only

### Audit Trail

Every operation is logged with:
- Timestamp
- User
- Changes made
- Outcome
- Evidence (diffs, test results, security scans)

### Best Practices

1. **Enable all security policies** in production environments
2. **Review audit packs** regularly
3. **Set budget alerts** to prevent cost overruns
4. **Use checkpoints** for reversible changes
5. **Run security scans** on all PRs
6. **Block merges** on critical findings

## Known Limitations

1. Python AST parsing is currently a stub (external tooling required)
2. Java AST manipulation is partial (CST traversal only)
3. Cryptographic signatures for audit packs are placeholders
4. Budget data is in-memory only (not persisted between CLI runs)

## Security Updates

Security updates will be published as GitHub releases and security advisories.
