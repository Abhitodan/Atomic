/**
 * Atomic Engine - Main orchestration layer
 */

import { ChangeSpecEngine, JavaScriptParser, PythonParser, JavaParser } from './ast';
import { CheckpointManager } from './checkpoints';
import { FinOpsManager } from './finops';
import { ZeroTrustGateway } from './gateway';
import { EvidenceStore } from './evidence';
import {
  Language,
  ChangeSpec,
  CheckpointMetadata,
  Budget,
  AuditPack,
  RedactionResult,
  AuditEntry,
} from './types';

export class AtomicEngine {
  private changeEngine: ChangeSpecEngine;
  private checkpointManager: CheckpointManager;
  private finopsManager: FinOpsManager;
  private gateway: ZeroTrustGateway;
  private evidenceStore: EvidenceStore;
  private initialized = false;

  constructor() {
    this.changeEngine = new ChangeSpecEngine();
    this.checkpointManager = new CheckpointManager(this.changeEngine);
    this.finopsManager = new FinOpsManager();
    this.gateway = new ZeroTrustGateway();
    this.evidenceStore = new EvidenceStore();

    // Register parsers
    this.changeEngine.registerParser(Language.JAVASCRIPT, new JavaScriptParser());
    this.changeEngine.registerParser(Language.TYPESCRIPT, new JavaScriptParser());
    this.changeEngine.registerParser(Language.PYTHON, new PythonParser());
    this.changeEngine.registerParser(Language.JAVA, new JavaParser());
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.evidenceStore.initialize();
    this.initialized = true;
  }

  async createCheckpoint(metadata: CheckpointMetadata): Promise<string> {
    if (!this.initialized) {
      throw new Error('AtomicEngine not initialized. Call initialize() first.');
    }

    const checkpoint = await this.checkpointManager.createCheckpoint([], metadata);
    return checkpoint.id;
  }

  async applyCheckpoint(
    checkpointId: string,
    fileContents: Map<string, string>
  ): Promise<Map<string, string>> {
    if (!this.initialized) {
      throw new Error('AtomicEngine not initialized. Call initialize() first.');
    }

    // Scan files for security issues before applying changes
    const scanResults = await this.gateway.scanMultiple(fileContents);
    for (const [file, result] of scanResults) {
      if (result.findings.some((f) => f.severity === 'critical')) {
        throw new Error(
          `Critical security findings in ${file}. Please address before applying changes.`
        );
      }
    }

    // Apply checkpoint
    const results = await this.checkpointManager.applyCheckpoint(checkpointId, fileContents);

    // Record audit entry
    const checkpoint = this.checkpointManager.getCheckpoint(checkpointId);
    if (checkpoint) {
      const entry: AuditEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        operation: 'apply_checkpoint',
        user: process.env.USER || 'unknown',
        changes: checkpoint.changes,
        checkpoint: checkpointId,
        outcome: 'success',
        evidence: [
          {
            type: 'security-scan',
            data: { results: Array.from(scanResults.values()) },
            verified: true,
          },
        ],
      };

      await this.evidenceStore.recordEntry(entry);
    }

    return results;
  }

  async rollbackCheckpoint(checkpointId: string): Promise<Map<string, string>> {
    if (!this.initialized) {
      throw new Error('AtomicEngine not initialized. Call initialize() first.');
    }

    const results = await this.checkpointManager.rollbackCheckpoint(checkpointId);

    // Record audit entry
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      operation: 'rollback_checkpoint',
      user: process.env.USER || 'unknown',
      changes: [],
      checkpoint: checkpointId,
      outcome: 'success',
      evidence: [],
    };

    await this.evidenceStore.recordEntry(entry);

    return results;
  }

  async scanFiles(files: Map<string, string>): Promise<Map<string, RedactionResult>> {
    if (!this.initialized) {
      throw new Error('AtomicEngine not initialized. Call initialize() first.');
    }

    return await this.gateway.scanMultiple(files);
  }

  async createBudget(budget: Budget): Promise<void> {
    if (!this.initialized) {
      throw new Error('AtomicEngine not initialized. Call initialize() first.');
    }

    this.finopsManager.createBudget(budget);
  }

  getBudget(budgetId: string): Budget | undefined {
    return this.finopsManager.getBudget(budgetId);
  }

  async generateAuditPack(checkpointId: string): Promise<AuditPack> {
    if (!this.initialized) {
      throw new Error('AtomicEngine not initialized. Call initialize() first.');
    }

    return await this.evidenceStore.createAuditPack(checkpointId);
  }

  async validateChangeSpec(
    change: ChangeSpec,
    code: string,
    language: Language
  ): Promise<boolean> {
    return await this.changeEngine.validateChange(change, code, language);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
