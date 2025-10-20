// Core Types for Atomic Platform

// ============================================
// ChangeSpec Types
// ============================================

export type Language = 'typescript' | 'javascript' | 'python' | 'java';

export type ASTOperation =
  | 'renameSymbol'
  | 'moveModule'
  | 'replaceAPI'
  | 'insertNode'
  | 'deleteNode'
  | 'editString'
  | 'editRegex';

export interface Patch {
  path: string;
  astOp: ASTOperation;
  selector?: string;
  details: Record<string, unknown>;
}

export type InvariantType =
  | 'typecheck'
  | 'symbolExists'
  | 'apiCompat'
  | 'regex'
  | 'semanticRule';

export interface Invariant {
  name: string;
  type: InvariantType;
  spec: string;
}

export type TestStrategy = 'augment' | 'generate' | 'hybrid';

export interface TestPlan {
  strategy: TestStrategy;
  targets: string[];
  mutationThreshold: number;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ChangeSpec {
  id: string;
  intent: string;
  scope: string[];
  language: Language;
  assumptions?: string[];
  patches: Patch[];
  invariants: Invariant[];
  tests: TestPlan;
  risk?: RiskLevel;
  telemetry?: Record<string, unknown>;
}

// ============================================
// Mission Types
// ============================================

export type CheckpointName = 'plan' | 'execute' | 'verify' | 'finalize';
export type CheckpointStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type CheckpointActor = 'human' | 'agent' | 'both';

export interface Batch {
  id: string;
  reversible: boolean;
  prs: string[];
}

export interface CheckpointMetrics {
  testsAdded?: number;
  mutationScore?: number;
}

export interface Checkpoint {
  name: CheckpointName;
  status: CheckpointStatus;
  actor?: CheckpointActor;
  artifacts?: string[];
  batches?: Batch[];
  metrics?: CheckpointMetrics;
  auditPack?: string;
}

export interface Mission {
  missionId: string;
  title: string;
  risk: RiskLevel;
  checkpoints: Checkpoint[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Gateway Types
// ============================================

export interface PreflightRequest {
  content: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyViolation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface Redaction {
  type: 'secret' | 'pii' | 'proprietary';
  position: number;
  length: number;
  placeholder: string;
}

export interface PreflightResponse {
  ok: boolean;
  violations: PolicyViolation[];
  redactions: Redaction[];
  sanitizedContent?: string;
}

export type Provider = 'copilot' | 'cursor' | 'windsurf' | 'openai' | 'anthropic';

export interface RouteRequest {
  task: string;
  budget?: number;
  preferredProvider?: Provider;
}

export interface RouteResponse {
  provider: Provider;
  policyApplied: boolean;
  estimatedCost?: number;
}

// ============================================
// FinOps Types
// ============================================

export interface ForecastRequest {
  changeSpec: ChangeSpec;
  provider?: Provider;
}

export interface ForecastResponse {
  usdEstimate: number;
  tokens: number;
  p95Latency: number;
}

export interface ModelPolicy {
  task: string;
  model: string;
  budgetCeiling?: number;
  priority?: number;
}

export interface BudgetStatus {
  total: number;
  consumed: number;
  remaining: number;
  breached: boolean;
}

// ============================================
// Evidence Types
// ============================================

export interface ProvenanceNode {
  id: string;
  type: 'mission' | 'checkpoint' | 'batch' | 'change';
  timestamp: string;
  actor: string;
  parent?: string;
  data: Record<string, unknown>;
}

export interface ProvenanceGraph {
  nodes: ProvenanceNode[];
  edges: Array<{ from: string; to: string }>;
}

export interface AuditPack {
  missionId: string;
  changeSpec: ChangeSpec;
  diffs: string[];
  tests: string[];
  mutationScore: number;
  approvals: Array<{ checkpoint: string; actor: string; timestamp: string }>;
  finOpsSummary: {
    totalCost: number;
    provider: Provider;
  };
  versions: Record<string, string>;
}

// ============================================
// DTE Types
// ============================================

export interface DTEPlanRequest {
  intent: string;
  scope: string[];
  language: Language;
}

export interface DTEApplyRequest {
  spec: ChangeSpec;
  dryRun?: boolean;
}

export interface DTEVerifyRequest {
  spec: ChangeSpec;
  ci?: boolean;
}

export interface DTEResult {
  success: boolean;
  patches?: string[];
  errors?: string[];
  warnings?: string[];
  mutationReport?: MutationReport;
}

export interface MutationReport {
  score: number;
  mutantsKilled: number;
  mutantsTotal: number;
  details: Array<{
    file: string;
    mutant: string;
    status: 'killed' | 'survived' | 'timeout';
  }>;
}

// ============================================
// Event Types
// ============================================

export type EventType =
  | 'MissionCreated'
  | 'CheckpointApproved'
  | 'CheckpointRejected'
  | 'BatchExecuted'
  | 'RollbackApplied'
  | 'BudgetBreached'
  | 'AuditPackGenerated';

export interface Event {
  id: string;
  type: EventType;
  timestamp: string;
  missionId?: string;
  data: Record<string, unknown>;
}
