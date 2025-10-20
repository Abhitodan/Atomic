# Atomic

**AgentOps Governance Layer for Copilot/Cursor/Windsurf**

[![Build Status](https://github.com/Abhitodan/Atomic/workflows/Build%20and%20Test/badge.svg)](https://github.com/Abhitodan/Atomic/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Atomic provides deterministic code transformations, mission checkpoints, financial operations management, and zero-trust security for AI coding assistants.

## 🚀 Features

### AST ChangeSpec
- **Deterministic Transforms**: Apply precise, verifiable code changes via AST manipulation
- **Language Support**: TypeScript/JavaScript, Python (stub), Java (partial)
- **Invariant Checking**: Syntax, semantic, and custom invariants ensure safe transformations
- **Patch Management**: Track and apply patches with full audit trail

### Mission Checkpoints
- **Reversible Batches**: Group changes into checkpoints that can be rolled back
- **State Management**: Track checkpoint lifecycle (pending, applied, verified, failed, rolled back)
- **Snapshot System**: Automatic file snapshots before applying changes
- **Dependency Tracking**: Manage checkpoint dependencies

### FinOps
- **Budget Management**: Set and enforce cost limits per project/team
- **Model Routing**: Automatically route requests to most cost-effective models
- **Cost Forecasting**: Predict costs before execution
- **Usage Tracking**: Monitor token usage and costs across models

### Zero-Trust Gateway
- **Secret Detection**: Identify AWS keys, API tokens, private keys, OAuth tokens
- **PII Redaction**: Detect and redact emails, credit cards, SSNs, IP addresses
- **Policy Engine**: Customizable security policies with redact/block/warn actions
- **Multi-file Scanning**: Batch scan entire codebases

### Evidence Store
- **Audit Logging**: Complete audit trail of all operations
- **Audit Packs**: Generate comprehensive reports per checkpoint
- **Evidence Types**: Diffs, test results, invariant checks, cost reports, security scans
- **Verification**: Cryptographic verification support (signature placeholder)

## 📦 Installation

```bash
npm install -g @atomic/governance
```

Or use locally in your project:

```bash
npm install --save-dev @atomic/governance
```

## 🎯 Quick Start

### Initialize Atomic

```bash
atomic init
```

### Create a Checkpoint

```bash
atomic checkpoint -m "refactor-auth" -d "Refactor authentication module"
```

### Scan for Secrets

```bash
atomic scan -f src/**/*.ts --redact
```

### Manage Budgets

```bash
# Create a budget
atomic budget --create --id dev-team --max 100

# Check status
atomic budget --status --id dev-team
```

### Generate Audit Pack

```bash
atomic audit -c <checkpoint-id> -o audit-report.json
```

## 📖 Usage

### Programmatic API

```typescript
import { AtomicEngine, Language, ChangeType } from '@atomic/governance';

// Initialize
const engine = new AtomicEngine();
await engine.initialize();

// Create checkpoint
const checkpointId = await engine.createCheckpoint({
  mission: 'refactor-auth',
  description: 'Refactor authentication',
  reversible: true,
  dependencies: [],
});

// Scan files for security issues
const files = new Map([
  ['src/config.ts', await fs.readFile('src/config.ts', 'utf-8')]
]);
const results = await engine.scanFiles(files);

// Create budget
await engine.createBudget({
  id: 'dev-budget',
  maxCost: 100,
  currentCost: 0,
  alertThreshold: 80,
  models: [
    { modelId: 'gpt-3.5-turbo', priority: 1 },
    { modelId: 'gpt-4', priority: 2 },
  ],
});

// Generate audit pack
const auditPack = await engine.generateAuditPack(checkpointId);
```

### GitHub Actions Integration

Add to `.github/workflows/atomic-governance.yml`:

```yaml
name: Atomic Governance Check

on:
  pull_request:
    branches: [main]

jobs:
  atomic-governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g @atomic/governance
      - run: atomic init
      - run: atomic scan -f $(git diff --name-only HEAD~1)
```

## 🔒 Security Policies

### Default Policies

Atomic comes with built-in detection for:

**Secrets:**
- AWS Secret Keys (`AKIA...`)
- Private Keys (PEM format)
- API Keys (generic patterns)
- OAuth Tokens (Google, GitHub)

**PII:**
- Email addresses
- Credit card numbers
- Social Security Numbers
- IP addresses (optional)

### Custom Policies

```typescript
import { ZeroTrustGateway } from '@atomic/governance';

const gateway = new ZeroTrustGateway();
gateway.addPolicy({
  id: 'custom-token',
  name: 'Custom Token',
  type: 'secret',
  enabled: true,
  patterns: ['TOKEN_[A-Z0-9]{32}'],
  action: 'block',  // or 'redact', 'warn'
  severity: 'critical',
});
```

## 💰 FinOps Model Routing

Atomic automatically routes requests to the most cost-effective model within budget:

```typescript
import { FinOpsManager } from '@atomic/governance';

const finops = new FinOpsManager();

// Set custom pricing
finops.setPricing({
  modelId: 'custom-model',
  inputTokenCost: 0.001,
  outputTokenCost: 0.002,
});

// Route request
const modelId = await finops.routeRequest('budget-id', estimatedTokens);

// Forecast costs
const forecast = await finops.forecastCost('gpt-4', 1000, 500);
console.log(`Estimated cost: $${forecast.estimatedCost}`);
```

## 🧪 Testing

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Atomic Engine                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │AST ChangeSpec│  │  Checkpoints │  │   FinOps     │  │
│  │              │  │              │  │              │  │
│  │ • Parsers    │  │ • Snapshots  │  │ • Budgets    │  │
│  │ • Validation │  │ • Rollback   │  │ • Routing    │  │
│  │ • Invariants │  │ • State Mgmt │  │ • Forecasts  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │Zero-Trust    │  │Evidence Store│                     │
│  │Gateway       │  │              │                     │
│  │ • Secrets    │  │ • Audit Logs │                     │
│  │ • PII        │  │ • Audit Packs│                     │
│  │ • Policies   │  │ • Evidence   │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## 📝 Design Principles

1. **Deterministic**: All transformations are predictable and reproducible
2. **Non-manipulative**: Ask on ambiguity, never assume
3. **Evidence-based**: Every operation produces verifiable evidence
4. **Fail-safe**: Block merges on critical security findings
5. **Cost-aware**: Enforce budgets and optimize model usage
6. **Auditable**: Complete trail of all operations

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🔮 Roadmap

- [ ] Full Python AST support (currently stub)
- [ ] Complete Java AST manipulation
- [ ] WebAssembly-based Python parser
- [ ] Cryptographic signing for audit packs
- [ ] Advanced semantic analysis
- [ ] ML-based cost prediction
- [ ] Integration with more AI coding tools
- [ ] Real-time cost dashboard
- [ ] Team collaboration features

## 📞 Support

- Documentation: [GitHub Wiki](https://github.com/Abhitodan/Atomic/wiki)
- Issues: [GitHub Issues](https://github.com/Abhitodan/Atomic/issues)
- Discussions: [GitHub Discussions](https://github.com/Abhitodan/Atomic/discussions)
