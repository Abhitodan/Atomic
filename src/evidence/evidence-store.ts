/**
 * Evidence Store - Audit logging and evidence collection
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { AuditEntry, AuditPack, AuditSummary, Evidence } from '../types';

export class EvidenceStore {
  private storePath: string;
  private entries: Map<string, AuditEntry> = new Map();

  constructor(storePath: string = '.atomic/evidence') {
    this.storePath = storePath;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storePath, { recursive: true });
    } catch (error) {
      console.warn('Failed to create evidence store directory:', error);
    }
  }

  async recordEntry(entry: AuditEntry): Promise<void> {
    this.entries.set(entry.id, entry);

    // Persist to disk
    const entryPath = path.join(this.storePath, `${entry.id}.json`);
    try {
      await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
    } catch (error) {
      console.warn('Failed to persist audit entry:', error);
    }
  }

  async createAuditPack(checkpointId: string): Promise<AuditPack> {
    const entries = Array.from(this.entries.values()).filter(
      (e) => e.checkpoint === checkpointId
    );

    const summary = this.generateSummary(entries);

    const pack: AuditPack = {
      id: this.generateId(),
      checkpointId,
      entries,
      summary,
    };

    // Save audit pack
    const packPath = path.join(this.storePath, `pack_${pack.id}.json`);
    try {
      await fs.writeFile(packPath, JSON.stringify(pack, null, 2));
    } catch (error) {
      console.warn('Failed to persist audit pack:', error);
    }

    return pack;
  }

  async verifyAuditPack(packId: string): Promise<boolean> {
    const packPath = path.join(this.storePath, `pack_${packId}.json`);

    try {
      const content = await fs.readFile(packPath, 'utf-8');
      const pack: AuditPack = JSON.parse(content);

      // Verify all evidence
      for (const entry of pack.entries) {
        for (const evidence of entry.evidence) {
          if (!evidence.verified) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to verify audit pack:', error);
      return false;
    }
  }

  async getEntry(entryId: string): Promise<AuditEntry | undefined> {
    // Try memory first
    if (this.entries.has(entryId)) {
      return this.entries.get(entryId);
    }

    // Try disk
    const entryPath = path.join(this.storePath, `${entryId}.json`);
    try {
      const content = await fs.readFile(entryPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  }

  async getAuditPack(packId: string): Promise<AuditPack | undefined> {
    const packPath = path.join(this.storePath, `pack_${packId}.json`);
    try {
      const content = await fs.readFile(packPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  }

  async listAuditPacks(): Promise<AuditPack[]> {
    try {
      const files = await fs.readdir(this.storePath);
      const packFiles = files.filter((f) => f.startsWith('pack_'));

      const packs: AuditPack[] = [];
      for (const file of packFiles) {
        const packPath = path.join(this.storePath, file);
        const content = await fs.readFile(packPath, 'utf-8');
        packs.push(JSON.parse(content));
      }

      return packs;
    } catch {
      return [];
    }
  }

  async addEvidence(entryId: string, evidence: Evidence): Promise<void> {
    const entry = await this.getEntry(entryId);
    if (!entry) {
      throw new Error(`Audit entry ${entryId} not found`);
    }

    entry.evidence.push(evidence);
    await this.recordEntry(entry);
  }

  private generateSummary(entries: AuditEntry[]): AuditSummary {
    let totalChanges = 0;
    let successfulChanges = 0;
    let failedChanges = 0;
    let totalCost = 0;
    let securityFindings = 0;
    let testsRun = 0;
    let testsPassed = 0;

    for (const entry of entries) {
      totalChanges += entry.changes.length;

      if (entry.outcome === 'success') {
        successfulChanges += entry.changes.length;
      } else {
        failedChanges += entry.changes.length;
      }

      for (const evidence of entry.evidence) {
        switch (evidence.type) {
          case 'cost-report':
            if (typeof evidence.data === 'object' && evidence.data && 'cost' in evidence.data) {
              totalCost += (evidence.data as any).cost || 0;
            }
            break;
          case 'security-scan':
            if (typeof evidence.data === 'object' && evidence.data && 'findings' in evidence.data) {
              securityFindings += ((evidence.data as any).findings || []).length;
            }
            break;
          case 'test-result':
            if (typeof evidence.data === 'object' && evidence.data) {
              testsRun += (evidence.data as any).total || 0;
              testsPassed += (evidence.data as any).passed || 0;
            }
            break;
        }
      }
    }

    return {
      totalChanges,
      successfulChanges,
      failedChanges,
      totalCost,
      securityFindings,
      testsRun,
      testsPassed,
    };
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
