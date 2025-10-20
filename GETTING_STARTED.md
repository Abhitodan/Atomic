# Getting Started with Atomic

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- TypeScript 5.x (included in dependencies)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Abhitodan/Atomic.git
cd Atomic
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies for all workspaces (packages, services, CLI).

### 3. Build the Project

```bash
npm run build
```

This compiles all TypeScript packages and services.

### 4. Configure Environment

```bash
# Copy environment template
cp .env.template .env

# Edit with your values
nano .env  # or use your preferred editor
```

**Minimal configuration for local development**:
```env
# Service ports (defaults are fine for local dev)
GATEWAY_PORT=3001
ORCHESTRATOR_PORT=3002
DTE_PORT=3003
FINOPS_PORT=3004
EVIDENCE_PORT=3005

# Feature flags
ENABLE_TELEMETRY=false
ENABLE_MUTATION_TESTING=false

# Security (keep enabled)
SECRET_REDACTION_ENABLED=true
PII_REDACTION_ENABLED=true
```

## Quick Start

### Option 1: Run All Services (Recommended for E2E Testing)

```bash
npm run dev
```

This starts all five services in development mode:
- Gateway (http://localhost:3001)
- Orchestrator (http://localhost:3002)
- DTE (http://localhost:3003)
- FinOps (http://localhost:3004)
- Evidence (http://localhost:3005)

### Option 2: Run Individual Services

```bash
# Gateway only
npm run dev --workspace=services/gateway

# Orchestrator only
npm run dev --workspace=services/orchestrator

# DTE only
npm run dev --workspace=services/dte

# FinOps only
npm run dev --workspace=services/finops

# Evidence only
npm run dev --workspace=services/evidence
```

### Health Check

Verify services are running:

```bash
curl http://localhost:3001/health  # Gateway
curl http://localhost:3002/health  # Orchestrator
curl http://localhost:3003/health  # DTE
curl http://localhost:3004/health  # FinOps
curl http://localhost:3005/health  # Evidence
```

Expected response: `{"status":"healthy","service":"<name>"}`

## Your First Mission

### 1. Install the CLI

```bash
# Install globally
npm install -g @atomic/cli

# Or use from repository
cd cli
npm link
```

### 2. Create a Mission

```bash
atomic mission create \
  --title "My First API Migration" \
  --risk medium
```

This returns a mission ID (e.g., `M-1234567890`).

### 3. Create a ChangeSpec

```bash
atomic dte plan \
  --intent "Rename UserId to AccountId in types" \
  --scope "examples/demo-repo/src/**/*.ts" \
  --output changespec.json
```

Edit `changespec.json` to add your specific patches:

```json
{
  "id": "CS-001",
  "intent": "Rename UserId to AccountId",
  "scope": ["examples/demo-repo/src"],
  "language": "typescript",
  "patches": [
    {
      "path": "examples/demo-repo/src/types.ts",
      "astOp": "renameSymbol",
      "selector": "Identifier[name='UserId']",
      "details": {
        "newName": "AccountId"
      }
    }
  ],
  "invariants": [
    {
      "name": "TypeCheck",
      "type": "typecheck",
      "spec": "tsc --noEmit"
    }
  ],
  "tests": {
    "strategy": "augment",
    "targets": ["examples/demo-repo/src"],
    "mutationThreshold": 0.6
  },
  "risk": "medium"
}
```

### 4. Apply the ChangeSpec

```bash
# Dry run first
atomic dte apply --spec changespec.json --dry-run

# Apply for real
atomic dte apply --spec changespec.json
```

### 5. Verify Changes

```bash
cd examples/demo-repo
atomic dte verify --spec ../../changespec.json --ci
```

### 6. Export Audit Pack

```bash
# Using CLI (when integrated)
# atomic mission finalize --mission M-123

# Or directly via API
curl -X POST http://localhost:3005/evidence/export \
  -H "Content-Type: application/json" \
  -d '{"missionId":"M-123"}' \
  --output audit-pack.zip
```

## Example Workflow: Complete E2E

Here's a complete example transforming the demo repository:

```bash
#!/bin/bash
# complete-mission.sh

set -e

echo "🚀 Starting Atomic mission..."

# 1. Create mission
MISSION=$(atomic mission create --title "Auth API Migration" --risk medium)
MISSION_ID=$(echo $MISSION | jq -r '.missionId')
echo "✅ Mission created: $MISSION_ID"

# 2. Use example ChangeSpec
cp examples/specs/CS-001.json /tmp/changespec.json

# 3. Get cost forecast
curl -X POST http://localhost:3004/finops/forecast \
  -H "Content-Type: application/json" \
  -d @/tmp/changespec.json

# 4. Apply changes
echo "🔧 Applying changes..."
atomic dte apply --spec /tmp/changespec.json

# 5. Verify
echo "✅ Verifying changes..."
atomic dte verify \
  --spec /tmp/changespec.json \
  --working-dir examples/demo-repo \
  --ci

# 6. Export audit pack
echo "📦 Exporting audit pack..."
curl -X POST http://localhost:3005/evidence/export \
  -H "Content-Type: application/json" \
  -d "{\"missionId\":\"$MISSION_ID\"}" \
  --output audit-pack-$MISSION_ID.zip

echo "✅ Mission complete! Audit pack: audit-pack-$MISSION_ID.zip"
```

Run it:
```bash
chmod +x complete-mission.sh
./complete-mission.sh
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests for Specific Package

```bash
npm test --workspace=packages/utils
```

### Run with Coverage

```bash
npm run test:coverage --workspace=packages/utils
```

## Development

### Type Checking

```bash
# Check all packages
npm run typecheck

# Check specific package
npm run typecheck --workspace=packages/types
```

### Linting

```bash
# Lint all files
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Code Formatting

```bash
# Check formatting
npm run format:check

# Auto-format
npm run format
```

## Common Issues

### Port Already in Use

If you see `EADDRINUSE`, another process is using the port:

```bash
# Find process
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different ports in .env
GATEWAY_PORT=4001
```

### TypeScript Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Module Not Found

Ensure you've built all packages:

```bash
npm run build
```

## IDE Setup

### VS Code

Recommended extensions (`.vscode/extensions.json` will be added):
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### IntelliJ IDEA / WebStorm

1. Enable TypeScript support
2. Configure ESLint
3. Configure Prettier
4. Set Node.js interpreter to local node

## Next Steps

1. **Read the Architecture**: See [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
2. **Understand ChangeSpecs**: See [CHANGE_SPEC.md](./docs/CHANGE_SPEC.md)
3. **Review Security**: See [SECURITY.md](./docs/SECURITY.md)
4. **API Reference**: See [API.md](./docs/API.md)
5. **Operations**: See [RUNBOOK.md](./docs/RUNBOOK.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## Getting Help

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Security**: See [SECURITY.md](./docs/SECURITY.md) for reporting vulnerabilities

## Resources

- **Repository**: https://github.com/Abhitodan/Atomic
- **License**: Apache-2.0 (see [LICENSE](./LICENSE))
- **Documentation**: [docs/](./docs/)

## What's Next?

This is the M1 (Milestone 1) release with:
- ✅ Core services (Gateway, Orchestrator, DTE, FinOps, Evidence)
- ✅ CLI for all operations
- ✅ TypeScript language pack
- ✅ Basic mutation testing
- ✅ Secret/PII redaction
- ✅ GitHub Actions

**Coming in M2**:
- VS Code extension
- Advanced UI for missions
- Python language pack
- Enhanced mutation testing
- Kubernetes deployment
- Advanced provenance tracking

**Coming in M3**:
- Java language pack
- Multi-language projects
- Advanced cost optimization
- Real-time collaboration
- Enterprise features

---

Happy coding with Atomic! 🚀
