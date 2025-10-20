# Security Guidelines

## Overview

Atomic is designed with security-first principles to protect sensitive data, enforce policies, and maintain audit trails for AI-assisted code changes.

## Security Features

### 1. Zero-Trust Gateway

All content passes through the Gateway service before reaching external providers or being processed.

**Capabilities**:
- Secret detection and redaction
- PII detection and sanitization
- Content policy validation
- Request size limits
- Rate limiting (planned)

### 2. Secret Redaction

Automatic detection and redaction of sensitive credentials.

**Detected Patterns**:
- API keys (`api_key=`, `apikey:`)
- GitHub tokens (`ghp_`, `gho_`, `ghs_`, `ghu_`)
- AWS credentials (`AKIA...`)
- Generic secrets (`secret=`, `password=`)
- Private keys (`-----BEGIN PRIVATE KEY-----`)
- JWT tokens
- Bearer tokens

**Usage**:
```typescript
import { SecretRedactor } from '@atomic/utils';

const redactor = new SecretRedactor();
const { sanitized, redactions } = redactor.redact(content);
```

**Custom Patterns**:
```typescript
const customPatterns = [
  /CUSTOM_TOKEN_[A-Z0-9]{32}/g
];
const redactor = new SecretRedactor(customPatterns);
```

### 3. PII Protection

Detection and redaction of personally identifiable information.

**Detected Patterns**:
- Email addresses
- Phone numbers (US format)
- Social Security Numbers
- Credit card numbers

**Usage**:
```typescript
import { PIIRedactor } from '@atomic/utils';

const redactor = new PIIRedactor();
const { sanitized, redactions } = redactor.redact(content);
```

### 4. Composite Redaction

Combined secret and PII redaction:

```typescript
import { CompositeRedactor } from '@atomic/utils';

const redactor = new CompositeRedactor();
const { sanitized, redactions } = redactor.redactAll(content);
```

### 5. Policy Enforcement

Configurable policies enforced at the Gateway:

```env
# Size limits
MAX_REQUEST_SIZE=10485760  # 10MB

# Redaction toggles
SECRET_REDACTION_ENABLED=true
PII_REDACTION_ENABLED=true

# Provider controls
COPILOT_ENABLED=true
CURSOR_ENABLED=true
WINDSURF_ENABLED=true
```

## Environment Configuration

### .env Template

Always use `.env.template` for documentation:

```bash
# Copy template
cp .env.template .env

# Edit with your values
# NEVER commit .env to git
```

### .env.template Structure

```env
# API Keys (never commit actual keys)
GITHUB_TOKEN=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Service Configuration
GATEWAY_PORT=3001
# ... etc
```

## Secret Scanning

### Pre-commit Hooks

Set up git hooks to prevent secret commits:

```bash
# Install husky
npm install

# Hook is automatically configured
# Scans staged files before commit
```

### GitHub Secret Scanning

Enable GitHub's secret scanning:

1. Go to repository Settings
2. Security & analysis
3. Enable secret scanning
4. Enable push protection

## Best Practices

### 1. Never Commit Secrets

❌ **NEVER**:
```typescript
const apiKey = "sk-1234567890abcdef";
const token = "ghp_actualGitHubToken";
```

✅ **ALWAYS**:
```typescript
const apiKey = process.env.OPENAI_API_KEY;
const token = process.env.GITHUB_TOKEN;
```

### 2. Use Environment Variables

```typescript
import dotenv from 'dotenv';
dotenv.config();

const config = {
  apiKey: process.env.API_KEY,
  dbUrl: process.env.DATABASE_URL,
};
```

### 3. Validate Input

All external input must be validated:

```typescript
import { validateChangeSpec } from '@atomic/schemas';

app.post('/api/changespec', (req, res) => {
  if (!validateChangeSpec(req.body)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // Process...
});
```

### 4. Sanitize Logs

Never log sensitive data:

```typescript
import { logger } from '@atomic/utils';

// ❌ NEVER
logger.info('User login', { password: user.password });

// ✅ ALWAYS
logger.info('User login', { userId: user.id });
```

### 5. Principle of Least Privilege

Services only access what they need:

```typescript
// Gateway: Only needs to read/redact content
// Orchestrator: Only needs mission state
// DTE: Only needs code and specs
// FinOps: Only needs cost data
// Evidence: Only needs audit trail
```

## Audit Trail

### Event Logging

All actions are logged to the Evidence service:

```typescript
await axios.post(`${evidenceUrl}/evidence/events`, {
  type: 'MissionCreated',
  missionId: 'M-123',
  data: { title: 'API Migration', risk: 'medium' }
});
```

### Immutable Log

Events are append-only and cannot be modified or deleted.

### Audit Packs

Export complete audit trail:

```bash
curl -X POST http://localhost:3005/evidence/export \
  -H "Content-Type: application/json" \
  -d '{"missionId": "M-123"}'
```

**Audit Pack Contents**:
- All events
- Provenance graph
- Approval records
- Code diffs
- Test results
- Cost summary

## Vulnerability Management

### Dependency Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Review breaking changes
npm audit fix --force
```

### Regular Updates

Keep dependencies current:

```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm update package-name
```

### Security Headers

All services use Helmet.js:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

Headers set:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`

## Incident Response

### If Secret Leaked

1. **Immediately revoke** the compromised credential
2. **Generate new** credential
3. **Update** environment variables
4. **Audit** recent activity for the credential
5. **Document** the incident

### If PII Exposed

1. **Identify** scope of exposure
2. **Notify** affected parties (if required by law)
3. **Remove** exposed data
4. **Audit** systems for similar issues
5. **Enhance** PII detection patterns

## Compliance

### GDPR Considerations

- PII redaction enabled by default
- Audit packs for data processing records
- Zero-retention mode available

```env
ZERO_RETENTION_MODE=true
```

### SOC 2 / ISO 27001

- Immutable audit trail
- Access controls
- Encryption in transit (HTTPS)
- Security monitoring

### HIPAA

- Enhanced PII patterns
- Encryption at rest (planned)
- Access logging
- Audit trail retention

## Zero-Retention Mode

For maximum privacy:

```env
ZERO_RETENTION_MODE=true
```

**Effect**:
- No event logging
- No provenance tracking
- No audit packs
- Immediate content disposal after processing

**Trade-off**: No audit trail for compliance.

## Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security@atomic.dev (or repository owner)
2. Include detailed description
3. Provide reproduction steps
4. Allow 90 days for fix before disclosure

## Security Checklist

Before deployment:

- [ ] All secrets in environment variables
- [ ] .env file NOT committed
- [ ] Secret scanning enabled
- [ ] Pre-commit hooks active
- [ ] npm audit clean
- [ ] HTTPS/TLS configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak info
- [ ] Logging excludes secrets/PII
- [ ] Audit trail enabled
- [ ] Backup procedures documented
- [ ] Incident response plan ready

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
