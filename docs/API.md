# API Documentation

## Core Classes

### AtomicEngine

Main orchestration class that coordinates all Atomic components.

#### Constructor

```typescript
constructor()
```

#### Methods

##### `initialize()`
Initialize the Atomic engine and evidence store.

```typescript
async initialize(): Promise<void>
```

##### `createCheckpoint(metadata)`
Create a new checkpoint for batching changes.

```typescript
async createCheckpoint(metadata: CheckpointMetadata): Promise<string>
```

**Parameters:**
- `metadata.mission` - Mission identifier
- `metadata.description` - Human-readable description
- `metadata.reversible` - Whether checkpoint can be rolled back
- `metadata.dependencies` - Array of checkpoint IDs this depends on

**Returns:** Checkpoint ID

##### `applyCheckpoint(checkpointId, fileContents)`
Apply a checkpoint's changes to files.

```typescript
async applyCheckpoint(
  checkpointId: string,
  fileContents: Map<string, string>
): Promise<Map<string, string>>
```

##### `rollbackCheckpoint(checkpointId)`
Rollback a previously applied checkpoint.

```typescript
async rollbackCheckpoint(checkpointId: string): Promise<Map<string, string>>
```

##### `scanFiles(files)`
Scan files for secrets and PII.

```typescript
async scanFiles(files: Map<string, string>): Promise<Map<string, RedactionResult>>
```

##### `createBudget(budget)`
Create a new budget for cost management.

```typescript
async createBudget(budget: Budget): Promise<void>
```

##### `generateAuditPack(checkpointId)`
Generate an audit pack for a checkpoint.

```typescript
async generateAuditPack(checkpointId: string): Promise<AuditPack>
```

---

### ChangeSpecEngine

Handles AST-based code transformations.

#### Methods

##### `registerParser(language, parser)`
Register a parser for a specific language.

```typescript
registerParser(language: Language, parser: ASTParser): void
```

##### `validateChange(change, code, language)`
Validate a change against invariants.

```typescript
async validateChange(
  change: ChangeSpec,
  code: string,
  language: Language
): Promise<boolean>
```

##### `applyChangeSpec(changes, code, language)`
Apply multiple changes to code.

```typescript
async applyChangeSpec(
  changes: ChangeSpec[],
  code: string,
  language: Language
): Promise<string>
```

---

### CheckpointManager

Manages mission checkpoints and snapshots.

#### Methods

##### `createCheckpoint(changes, metadata)`
Create a new checkpoint.

```typescript
async createCheckpoint(
  changes: ChangeSpec[],
  metadata: CheckpointMetadata
): Promise<Checkpoint>
```

##### `applyCheckpoint(checkpointId, fileContents)`
Apply checkpoint changes to files.

```typescript
async applyCheckpoint(
  checkpointId: string,
  fileContents: Map<string, string>
): Promise<Map<string, string>>
```

##### `rollbackCheckpoint(checkpointId)`
Rollback a checkpoint to its snapshot.

```typescript
async rollbackCheckpoint(checkpointId: string): Promise<Map<string, string>>
```

---

### FinOpsManager

Manages budgets and model routing.

#### Methods

##### `createBudget(budget)`
Create a new budget.

```typescript
createBudget(budget: Budget): void
```

##### `trackUsage(usage)`
Track model usage and update budgets.

```typescript
async trackUsage(usage: ModelUsage): Promise<void>
```

##### `routeRequest(budgetId, estimatedTokens)`
Route request to most cost-effective model.

```typescript
async routeRequest(budgetId: string, estimatedTokens: number): Promise<string>
```

##### `forecastCost(modelId, inputTokens, outputTokens)`
Forecast cost for a model.

```typescript
async forecastCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): Promise<CostForecast>
```

---

### ZeroTrustGateway

Security scanning and redaction.

#### Methods

##### `addPolicy(policy)`
Add a security policy.

```typescript
addPolicy(policy: Policy): void
```

##### `scan(content, file)`
Scan content for security issues.

```typescript
async scan(content: string, file: string): Promise<RedactionResult>
```

##### `scanMultiple(files)`
Scan multiple files.

```typescript
async scanMultiple(files: Map<string, string>): Promise<Map<string, RedactionResult>>
```

---

### EvidenceStore

Audit logging and evidence collection.

#### Methods

##### `initialize()`
Initialize evidence store directory.

```typescript
async initialize(): Promise<void>
```

##### `recordEntry(entry)`
Record an audit entry.

```typescript
async recordEntry(entry: AuditEntry): Promise<void>
```

##### `createAuditPack(checkpointId)`
Create an audit pack for a checkpoint.

```typescript
async createAuditPack(checkpointId: string): Promise<AuditPack>
```

##### `verifyAuditPack(packId)`
Verify integrity of an audit pack.

```typescript
async verifyAuditPack(packId: string): Promise<boolean>
```

---

## Type Definitions

### ChangeSpec

```typescript
interface ChangeSpec {
  id: string;
  type: ChangeType;
  range: CodeRange;
  content?: string;
  targetRange?: CodeRange;
  invariants: Invariant[];
  metadata: ChangeMetadata;
}
```

### Checkpoint

```typescript
interface Checkpoint {
  id: string;
  timestamp: number;
  changes: ChangeSpec[];
  state: CheckpointState;
  parentCheckpoint?: string;
  metadata: CheckpointMetadata;
}
```

### Budget

```typescript
interface Budget {
  id: string;
  maxCost: number;
  currentCost: number;
  alertThreshold: number;
  models: ModelBudget[];
}
```

### Policy

```typescript
interface Policy {
  id: string;
  name: string;
  type: 'secret' | 'pii' | 'custom';
  enabled: boolean;
  patterns: string[];
  action: 'redact' | 'block' | 'warn';
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

### AuditPack

```typescript
interface AuditPack {
  id: string;
  checkpointId: string;
  entries: AuditEntry[];
  summary: AuditSummary;
  signature?: string;
}
```

## Enums

### Language

```typescript
enum Language {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
}
```

### ChangeType

```typescript
enum ChangeType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
  MOVE = 'move',
}
```

### CheckpointState

```typescript
enum CheckpointState {
  PENDING = 'pending',
  APPLIED = 'applied',
  VERIFIED = 'verified',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}
```
