# Atomic

**AgentOps Governance Platform for Software Delivery**

Atomic is a neutral orchestration and governance layer that makes AI coding agents provable, reversible, and affordable across GitHub Copilot, Windsurf, and Cursor.

## 🎯 Overview

Atomic provides:

- **Deterministic Transform Engine (DTE)**: Converts agent plans into typed ChangeSpecs with AST patches, invariants, and tests
- **Mission Checkpoints**: Plan → Execute → Verify workflow with reversible batches and human gates
- **FinOps & Policy Router**: Budgets, cost forecasts, and model routing policies
- **Zero-Trust Boundary Gateway**: Secret/PII redaction and policy enforcement
- **Evidence Store**: Immutable provenance graph with exportable audit packs

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build all packages and services
npm run build

# Start all services
npm run dev
```

### CLI Usage

```bash
# Install CLI globally
npm install -g @atomic/cli

# Create a ChangeSpec plan
atomic dte plan --intent "Rename UserId to AccountId" --scope "src/**/*.ts"

# Apply a ChangeSpec
atomic dte apply --spec specs/changespec.json

# Verify with invariants and mutation testing
atomic dte verify --spec specs/changespec.json --ci

# Create a mission
atomic mission create --title "API Migration" --risk medium

# Rollback a batch
atomic mission rollback --mission M-123 --batch batch-1
```

## 📦 Architecture

```
┌─────────────────────────────────────────────────────┐
│           Adapters (IDE/CLI/Git hooks)              │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Zero-Trust Boundary Gateway (policy, redaction)    │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Orchestrator (missions, checkpoints, batches)      │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Deterministic Transform Engine (AST, invariants)   │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  FinOps & Policy Router (metering, budgets)         │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  Evidence Store (provenance, audit packs)           │
└─────────────────────────────────────────────────────┘
```

## 🏗️ Project Structure

```
atomic/
├── packages/           # Shared packages
│   ├── types/         # TypeScript type definitions
│   ├── schemas/       # JSON schemas and validators
│   └── utils/         # Common utilities (redaction, logging)
├── services/          # Microservices
│   ├── gateway/       # Zero-trust boundary gateway
│   ├── orchestrator/  # Mission orchestration
│   ├── dte/          # Deterministic Transform Engine
│   ├── finops/       # Cost tracking and routing
│   └── evidence/     # Provenance and audit packs
├── cli/              # Command-line interface
├── adapters/         # IDE/tool adapters
├── actions/          # GitHub Actions
│   ├── verify/       # Verification action
│   └── audit-pack/   # Audit pack generation
└── examples/         # Demo repositories and specs
```

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and components
- [Change Spec](./docs/CHANGE_SPEC.md) - ChangeSpec schema and usage
- [Security](./docs/SECURITY.md) - Security guidelines and practices
- [API Reference](./docs/API.md) - REST API documentation
- [Runbook](./docs/RUNBOOK.md) - Operational procedures

## 🔒 Security

Atomic includes built-in security features:

- **Secret Redaction**: Automatic detection and redaction of API keys, tokens, and credentials
- **PII Protection**: Pattern-based PII detection and sanitization
- **Policy Enforcement**: Configurable policies for request validation
- **Audit Trail**: Immutable event log with full provenance tracking

See [SECURITY.md](./docs/SECURITY.md) for details.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct.

## 📄 License

Apache-2.0 License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with modern tools:
- TypeScript & Node.js
- ts-morph for AST transformations
- Express for REST APIs
- Stryker for mutation testing
