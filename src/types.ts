/**
 * Core types for Atomic governance layer
 */

export enum Language {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
}

export enum ChangeType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
  MOVE = 'move',
}

export interface Location {
  line: number;
  column: number;
  file: string;
}

export interface CodeRange {
  start: Location;
  end: Location;
}

export interface ChangeSpec {
  id: string;
  type: ChangeType;
  range: CodeRange;
  content?: string;
  targetRange?: CodeRange; // For MOVE operations
  invariants: Invariant[];
  metadata: ChangeMetadata;
}

export interface Invariant {
  id: string;
  description: string;
  type: 'syntax' | 'semantic' | 'test' | 'custom';
  validator: string; // Expression or function reference
}

export interface ChangeMetadata {
  author: string;
  timestamp: number;
  reason: string;
  confidence: number; // 0.0 to 1.0
  reviewRequired: boolean;
}

export interface Checkpoint {
  id: string;
  timestamp: number;
  changes: ChangeSpec[];
  state: CheckpointState;
  parentCheckpoint?: string;
  metadata: CheckpointMetadata;
}

export enum CheckpointState {
  PENDING = 'pending',
  APPLIED = 'applied',
  VERIFIED = 'verified',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

export interface CheckpointMetadata {
  mission: string;
  description: string;
  reversible: boolean;
  dependencies: string[];
}

export interface Budget {
  id: string;
  maxCost: number; // In USD
  currentCost: number;
  alertThreshold: number; // Percentage
  models: ModelBudget[];
}

export interface ModelBudget {
  modelId: string;
  maxTokens?: number;
  maxCost?: number;
  priority: number; // Higher priority = preferred
}

export interface CostForecast {
  estimatedCost: number;
  confidence: number;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  modelId: string;
  tokens: number;
  cost: number;
}

export interface Policy {
  id: string;
  name: string;
  type: 'secret' | 'pii' | 'custom';
  enabled: boolean;
  patterns: string[]; // Regex patterns
  action: 'redact' | 'block' | 'warn';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RedactionResult {
  original: string;
  redacted: string;
  findings: Finding[];
}

export interface Finding {
  type: string;
  location: CodeRange;
  severity: string;
  message: string;
  policy: string;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  operation: string;
  user: string;
  changes: ChangeSpec[];
  checkpoint?: string;
  outcome: 'success' | 'failure';
  evidence: Evidence[];
}

export interface Evidence {
  type: 'diff' | 'test-result' | 'invariant-check' | 'cost-report' | 'security-scan';
  data: unknown;
  verified: boolean;
}

export interface AuditPack {
  id: string;
  checkpointId: string;
  entries: AuditEntry[];
  summary: AuditSummary;
  signature?: string; // For cryptographic verification
}

export interface AuditSummary {
  totalChanges: number;
  successfulChanges: number;
  failedChanges: number;
  totalCost: number;
  securityFindings: number;
  testsRun: number;
  testsPassed: number;
}
