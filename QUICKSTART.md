# Quick Start Guide

Get started with Atomic in 5 minutes.

## Installation

```bash
npm install -g @atomic/governance
```

Or add to your project:

```bash
npm install --save-dev @atomic/governance
```

## Basic Workflow

### 1. Initialize Atomic

```bash
cd your-project
atomic init
```

This creates a `.atomic` directory for evidence storage.

### 2. Create a Budget

```bash
atomic budget --create --id team-budget --max 100
```

This sets a $100 monthly budget for your team.

### 3. Scan Your Code

```bash
atomic scan -f src/**/*.ts
```

Atomic will detect secrets and PII:

```
src/config.ts:
  CRITICAL: AWS Secret Key: secret detected at line 15
  HIGH: API Key: secret detected at line 42
  MEDIUM: Email Address: pii detected at line 8
```

### 4. Auto-Redact Secrets

```bash
atomic scan -f src/**/*.ts --redact
```

This automatically redacts detected secrets and saves the files.

### 5. Create a Checkpoint

```bash
atomic checkpoint -m "refactor-auth" -d "Refactor authentication module"
```

Output:
```
✓ Checkpoint created: ckpt_1234567890_abc123
```

### 6. Apply Changes (Programmatic)

In your automation script:

```typescript
import { AtomicEngine } from '@atomic/governance';
import * as fs from 'fs/promises';

const engine = new AtomicEngine();
await engine.initialize();

// Apply checkpoint to files
const files = new Map([
  ['src/auth.ts', await fs.readFile('src/auth.ts', 'utf-8')]
]);

const results = await engine.applyCheckpoint('ckpt_1234567890_abc123', files);

// Write results
for (const [file, content] of results) {
  await fs.writeFile(file, content);
}
```

### 7. Generate Audit Report

```bash
atomic audit -c ckpt_1234567890_abc123 -o audit.json
```

Output:
```json
{
  "id": "1234567890_xyz789",
  "checkpointId": "ckpt_1234567890_abc123",
  "summary": {
    "totalChanges": 15,
    "successfulChanges": 15,
    "failedChanges": 0,
    "totalCost": 0.042,
    "securityFindings": 0,
    "testsRun": 25,
    "testsPassed": 25
  }
}
```

## Common Use Cases

### Use Case 1: Secure Code Review

```bash
# Initialize
atomic init

# Scan all TypeScript files
atomic scan -f src/**/*.ts

# Fix critical issues (manually or with --redact)
atomic scan -f src/**/*.ts --redact

# Create checkpoint for tracking
atomic checkpoint -m "security-fix" -d "Fix security vulnerabilities"
```

### Use Case 2: Cost-Controlled Refactoring

```typescript
import { AtomicEngine } from '@atomic/governance';

const engine = new AtomicEngine();
await engine.initialize();

// Set budget
await engine.createBudget({
  id: 'refactor-budget',
  maxCost: 50,
  currentCost: 0,
  alertThreshold: 80,
  models: [
    { modelId: 'gpt-3.5-turbo', priority: 1 },
    { modelId: 'gpt-4', priority: 2 }
  ]
});

// Your refactoring logic here...
// Budget will be enforced automatically
```

### Use Case 3: CI/CD Integration

Add to `.github/workflows/atomic.yml`:

```yaml
name: Atomic Governance

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Atomic
        run: npm install -g @atomic/governance
      
      - name: Initialize
        run: atomic init
      
      - name: Scan changed files
        run: |
          atomic scan -f $(git diff --name-only origin/main...HEAD | grep -E '\.(ts|js)$')
      
      - name: Block on critical
        run: |
          if grep -q "CRITICAL" scan-results.txt; then
            exit 1
          fi
```

### Use Case 4: Team Budget Monitoring

```typescript
import { FinOpsManager } from '@atomic/governance';

const finops = new FinOpsManager();

// Create team budget
finops.createBudget({
  id: 'engineering',
  maxCost: 1000,
  currentCost: 0,
  alertThreshold: 80,
  models: [
    { modelId: 'gpt-3.5-turbo', priority: 1, maxCost: 200 },
    { modelId: 'gpt-4', priority: 2, maxCost: 800 }
  ]
});

// Track usage
await finops.trackUsage({
  modelId: 'gpt-4',
  inputTokens: 5000,
  outputTokens: 2000,
  timestamp: Date.now()
});

// Get budget status
const budget = finops.getBudget('engineering');
console.log(`Used: $${budget.currentCost} / $${budget.maxCost}`);
```

## Pro Tips

### Tip 1: Custom Security Policies

```typescript
import { ZeroTrustGateway } from '@atomic/governance';

const gateway = new ZeroTrustGateway();

// Add company-specific pattern
gateway.addPolicy({
  id: 'company-token',
  name: 'Company API Token',
  type: 'secret',
  enabled: true,
  patterns: ['COMPANY_[A-Z0-9]{32}'],
  action: 'block',
  severity: 'critical'
});

// Scan with custom policy
const result = await gateway.scan(code, 'file.ts');
```

### Tip 2: Checkpoint Rollback

```bash
# Create reversible checkpoint
atomic checkpoint -m "risky-change" -d "Testing new feature"

# Apply changes...
atomic apply -c ckpt_123 -f src/*.ts

# Rollback if issues arise
atomic rollback -c ckpt_123
```

### Tip 3: Cost Forecasting

```typescript
import { FinOpsManager } from '@atomic/governance';

const finops = new FinOpsManager();

// Forecast before execution
const forecast = await finops.forecastCost(
  'gpt-4',
  5000,  // input tokens
  2000   // output tokens
);

console.log(`Estimated cost: $${forecast.estimatedCost}`);

// Decide whether to proceed
if (forecast.estimatedCost < 1.0) {
  // Execute operation
}
```

### Tip 4: Batch Scanning

```bash
# Scan entire codebase
find src -name "*.ts" -o -name "*.js" | xargs atomic scan -f

# Or use glob patterns
atomic scan -f "src/**/*.{ts,js,py,java}"
```

## Troubleshooting

### Issue: Budget Not Found

**Problem**: `✗ Budget test-budget not found`

**Solution**: Budgets are in-memory by default in v1.0. Create budget in the same session or use programmatic API for persistence.

### Issue: Python/Java Parsing Errors

**Problem**: `Python parsing not yet implemented`

**Solution**: Python and Java have limited support in v1.0. TypeScript/JavaScript fully supported.

### Issue: Permission Denied

**Problem**: Cannot write to `.atomic` directory

**Solution**: 
```bash
chmod 755 .atomic
# or
sudo atomic init
```

## Next Steps

- Read the [API Documentation](docs/API.md)
- Check out [Examples](docs/EXAMPLES.md)
- Review [Security Policy](SECURITY.md)
- Contribute! See [CONTRIBUTING.md](CONTRIBUTING.md)

## Getting Help

- GitHub Issues: https://github.com/Abhitodan/Atomic/issues
- Discussions: https://github.com/Abhitodan/Atomic/discussions
- Security: See SECURITY.md
