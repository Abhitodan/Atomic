# Examples

## Basic Usage

### Initialize and Create Checkpoint

```typescript
import { AtomicEngine } from '@atomic/governance';

async function main() {
  const engine = new AtomicEngine();
  await engine.initialize();

  const checkpointId = await engine.createCheckpoint({
    mission: 'add-logging',
    description: 'Add structured logging to auth module',
    reversible: true,
    dependencies: [],
  });

  console.log(`Created checkpoint: ${checkpointId}`);
}
```

### Scan Files for Secrets

```typescript
import { AtomicEngine } from '@atomic/governance';
import * as fs from 'fs/promises';

async function scanProject() {
  const engine = new AtomicEngine();
  await engine.initialize();

  // Read files
  const files = new Map([
    ['src/config.ts', await fs.readFile('src/config.ts', 'utf-8')],
    ['src/auth.ts', await fs.readFile('src/auth.ts', 'utf-8')],
  ]);

  // Scan for issues
  const results = await engine.scanFiles(files);

  for (const [file, result] of results) {
    console.log(`\n${file}:`);
    if (result.findings.length === 0) {
      console.log('  ✓ No security issues found');
    } else {
      for (const finding of result.findings) {
        console.log(`  ${finding.severity}: ${finding.message}`);
      }
    }
  }
}
```

### Budget Management

```typescript
import { FinOpsManager } from '@atomic/governance';

async function manageBudget() {
  const finops = new FinOpsManager();

  // Create budget
  finops.createBudget({
    id: 'dev-team',
    maxCost: 500,
    currentCost: 0,
    alertThreshold: 80,
    models: [
      { modelId: 'gpt-3.5-turbo', priority: 1, maxCost: 100 },
      { modelId: 'gpt-4', priority: 2, maxCost: 400 },
    ],
  });

  // Route request
  const modelId = await finops.routeRequest('dev-team', 5000);
  console.log(`Using model: ${modelId}`);

  // Track usage
  await finops.trackUsage({
    modelId,
    inputTokens: 5000,
    outputTokens: 2000,
    timestamp: Date.now(),
  });

  // Check budget status
  const budget = finops.getBudget('dev-team');
  console.log(`Budget used: $${budget!.currentCost} / $${budget!.maxCost}`);
}
```

### Complete Workflow

```typescript
import { AtomicEngine } from '@atomic/governance';
import * as fs from 'fs/promises';

async function completeWorkflow() {
  const engine = new AtomicEngine();
  await engine.initialize();

  // Step 1: Create budget
  await engine.createBudget({
    id: 'refactor-budget',
    maxCost: 50,
    currentCost: 0,
    alertThreshold: 80,
    models: [{ modelId: 'gpt-4', priority: 1 }],
  });

  // Step 2: Create checkpoint
  const checkpointId = await engine.createCheckpoint({
    mission: 'refactor-auth',
    description: 'Refactor authentication module with modern patterns',
    reversible: true,
    dependencies: [],
  });

  // Step 3: Read files
  const files = new Map([
    ['src/auth.ts', await fs.readFile('src/auth.ts', 'utf-8')],
  ]);

  // Step 4: Scan for security issues
  const scanResults = await engine.scanFiles(files);
  for (const [file, result] of scanResults) {
    if (result.findings.some(f => f.severity === 'critical')) {
      throw new Error(`Critical security issues in ${file}`);
    }
  }

  // Step 5: Generate audit pack
  const auditPack = await engine.generateAuditPack(checkpointId);
  
  // Step 6: Save audit report
  await fs.writeFile(
    'audit-report.json',
    JSON.stringify(auditPack, null, 2)
  );

  console.log('Workflow completed successfully!');
  console.log(`Total changes: ${auditPack.summary.totalChanges}`);
  console.log(`Total cost: $${auditPack.summary.totalCost}`);
}
```

### CLI Usage Examples

```bash
# Initialize Atomic in project
atomic init

# Create checkpoint
atomic checkpoint \
  -m "add-error-handling" \
  -d "Add comprehensive error handling to API routes"

# Scan specific files
atomic scan -f src/api/*.ts src/config.ts

# Scan and auto-redact
atomic scan -f src/**/*.ts --redact

# Create budget
atomic budget \
  --create \
  --id team-alpha \
  --max 1000

# Check budget status
atomic budget --status --id team-alpha

# Generate audit report
atomic audit -c ckpt_123456 -o reports/audit-2024-01.json

# Rollback if needed
atomic rollback -c ckpt_123456
```
