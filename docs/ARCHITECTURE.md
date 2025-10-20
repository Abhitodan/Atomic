# Atomic Architecture

## System Overview

Atomic is built as a microservices architecture with clear separation of concerns. Each service is independently deployable and communicates via REST APIs and event streams.

## Core Services

### 1. Gateway Service (Port 3001)

**Purpose**: Zero-trust boundary with policy enforcement and content sanitization

**Responsibilities**:
- Secret and PII redaction before external calls
- Policy validation (size limits, content restrictions)
- Provider routing based on policies
- Latency tracking (target: p95 ≤ 80ms)

**Endpoints**:
- `POST /gateway/preflight` - Validate and sanitize content
- `POST /gateway/route` - Route requests to appropriate providers

**Key Components**:
- `SecretRedactor`: Pattern-based secret detection
- `PIIRedactor`: PII detection and sanitization
- `PolicyEngine`: Configurable policy validation

### 2. Orchestrator Service (Port 3002)

**Purpose**: Mission lifecycle management with checkpointed workflows

**Responsibilities**:
- Mission creation and state management
- Checkpoint approval workflow
- Reversible batch execution
- Rollback coordination
- Event emission

**Endpoints**:
- `POST /missions` - Create mission
- `GET /missions/:id` - Get mission status
- `POST /missions/:id/checkpoints/:name/approve` - Approve checkpoint
- `POST /missions/:id/batches` - Create batch
- `POST /missions/:id/rollback/:batchId` - Rollback batch

**Data Model**:
```typescript
Mission {
  missionId: string
  title: string
  risk: 'low' | 'medium' | 'high'
  checkpoints: Checkpoint[]
}

Checkpoint {
  name: 'plan' | 'execute' | 'verify' | 'finalize'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  actor: 'human' | 'agent' | 'both'
  artifacts: string[]
  batches?: Batch[]
}
```

### 3. Deterministic Transform Engine (Port 3003)

**Purpose**: AST-based code transformations with verifiable invariants

**Responsibilities**:
- ChangeSpec validation and execution
- Language-specific AST transformations
- Invariant verification (typecheck, semantic rules)
- Mutation testing coordination
- Diff generation

**Endpoints**:
- `POST /dte/apply` - Apply ChangeSpec transformations
- `POST /dte/verify` - Verify with invariants and mutation tests

**Language Packs**:
- **TypeScript/JavaScript**: ts-morph based
  - `renameSymbol`: Identifier renaming
  - `replaceAPI`: API call transformation
  - Future: `moveModule`, `insertNode`, `deleteNode`

- **Python**: LibCST based (v2)
- **Java**: JavaParser/Spoon based (v2)

**Invariant Types**:
- `typecheck`: Run type checker (tsc, mypy, javac)
- `symbolExists`: Verify symbol presence
- `apiCompat`: API compatibility check
- `regex`: Pattern matching
- `semanticRule`: Custom semantic validation

### 4. FinOps Service (Port 3004)

**Purpose**: Cost tracking, forecasting, and model routing

**Responsibilities**:
- Token and cost estimation
- Budget tracking and enforcement
- Model routing policies
- Budget breach webhooks
- Cost reporting

**Endpoints**:
- `POST /finops/forecast` - Generate cost forecast
- `GET /finops/budget` - Get budget status
- `POST /finops/budget` - Update consumption
- `GET /policies/models` - Get routing policies
- `PUT /policies/models` - Update routing policy

**Cost Model**:
```typescript
Forecast {
  usdEstimate: number     // Estimated USD cost
  tokens: number          // Token count estimate
  p95Latency: number      // Expected latency (ms)
}

Budget {
  total: number           // Total budget USD
  consumed: number        // Consumed so far
  remaining: number       // Remaining budget
  breached: boolean       // Over budget flag
}
```

### 5. Evidence Service (Port 3005)

**Purpose**: Immutable audit trail and provenance tracking

**Responsibilities**:
- Event recording (append-only log)
- Provenance graph generation
- Audit pack creation and export
- Artifact storage
- Compliance reporting

**Endpoints**:
- `POST /evidence/events` - Record event
- `GET /evidence/mission/:id` - Get provenance graph
- `POST /evidence/export` - Export audit pack (ZIP)

**Audit Pack Contents**:
- ChangeSpec JSON
- Provenance graph
- Event timeline
- Code diffs
- Test results
- Mutation reports
- Approval records
- FinOps summary
- Version information

## Data Flow

### Mission Execution Flow

```
1. Create Mission (Orchestrator)
   ↓
2. Plan Checkpoint
   - Generate ChangeSpec (DTE)
   - Cost Forecast (FinOps)
   - Human Approval (Orchestrator)
   ↓
3. Execute Checkpoint
   - Preflight Check (Gateway)
   - Apply Patches (DTE)
   - Create Batches (Orchestrator)
   ↓
4. Verify Checkpoint
   - Run Invariants (DTE)
   - Mutation Testing (DTE)
   - Record Results (Evidence)
   ↓
5. Finalize Checkpoint
   - Export Audit Pack (Evidence)
   - Update Budget (FinOps)
   - Close Mission (Orchestrator)
```

## Security Architecture

### Redaction Pipeline

```
User Input
   ↓
Gateway Preflight
   ↓
Secret Redactor (API keys, tokens, credentials)
   ↓
PII Redactor (emails, phone, SSN, credit cards)
   ↓
Policy Validation
   ↓
Sanitized Output
```

### Zero-Trust Principles

1. **Never trust input**: All content goes through redaction
2. **Verify every request**: Policy checks on all endpoints
3. **Minimal privilege**: Services only access what they need
4. **Audit everything**: All actions logged to Evidence store
5. **Fail secure**: Default deny on policy violations

## Scalability Considerations

### Current (v1)
- In-memory storage (development)
- Single-process services
- Local file system

### Future (v2+)
- PostgreSQL for persistent storage
- Redis for caching and queues
- S3/blob storage for artifacts
- Kafka/SQS for event streaming
- Kubernetes deployment
- Horizontal service scaling

## Performance Targets

| Service | Metric | Target |
|---------|--------|--------|
| Gateway | Preflight p95 latency | ≤ 80ms |
| Orchestrator | Batch create | ≤ 1s |
| DTE | Verify (1000 files) | ≤ 5min |
| FinOps | Forecast | ≤ 100ms |
| Evidence | Event record | ≤ 50ms |

## Monitoring & Observability

### Telemetry (opt-in)
- Request/response metrics
- Latency histograms
- Error rates
- Resource utilization

### Logging
- Structured JSON logs
- Correlation IDs across services
- Secret-free logs (redaction applied)
- Log levels: DEBUG, INFO, WARN, ERROR

### Health Checks
All services expose:
- `GET /health` - Basic health status
- Returns: `{ status: 'healthy', service: '<name>' }`

## Deployment Models

### Development
```bash
npm run dev  # All services locally
```

### Production (Future)
- Docker containers
- Kubernetes orchestration
- Load balancing
- Auto-scaling
- Blue-green deployments
