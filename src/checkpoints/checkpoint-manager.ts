/**
 * Mission Checkpoints - Reversible batch operations
 */

import { Checkpoint, CheckpointState, ChangeSpec, CheckpointMetadata } from '../types';
import { ChangeSpecEngine } from '../ast';

export interface CheckpointSnapshot {
  checkpointId: string;
  files: Map<string, string>; // file path -> content
  timestamp: number;
}

export class CheckpointManager {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private snapshots: Map<string, CheckpointSnapshot> = new Map();
  private changeEngine: ChangeSpecEngine;

  constructor(changeEngine: ChangeSpecEngine) {
    this.changeEngine = changeEngine;
  }

  async createCheckpoint(
    changes: ChangeSpec[],
    metadata: CheckpointMetadata
  ): Promise<Checkpoint> {
    const checkpoint: Checkpoint = {
      id: this.generateId(),
      timestamp: Date.now(),
      changes,
      state: CheckpointState.PENDING,
      metadata,
    };

    this.checkpoints.set(checkpoint.id, checkpoint);
    return checkpoint;
  }

  async applyCheckpoint(
    checkpointId: string,
    fileContents: Map<string, string>
  ): Promise<Map<string, string>> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    if (checkpoint.state !== CheckpointState.PENDING) {
      throw new Error(`Checkpoint ${checkpointId} is not in PENDING state`);
    }

    // Create snapshot before applying changes
    await this.createSnapshot(checkpointId, fileContents);

    const modifiedFiles = new Map<string, string>();

    try {
      // Group changes by file
      const changesByFile = this.groupChangesByFile(checkpoint.changes);

      for (const [file, changes] of changesByFile) {
        const originalContent = fileContents.get(file);
        if (!originalContent) {
          throw new Error(`File ${file} not found`);
        }

        // Determine language from file extension
        const language = this.detectLanguage(file);

        // Apply all changes to this file
        const modifiedContent = await this.changeEngine.applyChangeSpec(
          changes,
          originalContent,
          language
        );

        modifiedFiles.set(file, modifiedContent);
      }

      checkpoint.state = CheckpointState.APPLIED;
      this.checkpoints.set(checkpointId, checkpoint);

      return modifiedFiles;
    } catch (error) {
      checkpoint.state = CheckpointState.FAILED;
      this.checkpoints.set(checkpointId, checkpoint);
      throw error;
    }
  }

  async verifyCheckpoint(checkpointId: string): Promise<boolean> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    if (checkpoint.state !== CheckpointState.APPLIED) {
      return false;
    }

    // All changes should have passed invariant checks during application
    // Mark as verified
    checkpoint.state = CheckpointState.VERIFIED;
    this.checkpoints.set(checkpointId, checkpoint);

    return true;
  }

  async rollbackCheckpoint(checkpointId: string): Promise<Map<string, string>> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    if (!checkpoint.metadata.reversible) {
      throw new Error(`Checkpoint ${checkpointId} is not reversible`);
    }

    const snapshot = this.snapshots.get(checkpointId);
    if (!snapshot) {
      throw new Error(`No snapshot found for checkpoint ${checkpointId}`);
    }

    checkpoint.state = CheckpointState.ROLLED_BACK;
    this.checkpoints.set(checkpointId, checkpoint);

    return snapshot.files;
  }

  getCheckpoint(checkpointId: string): Checkpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  listCheckpoints(): Checkpoint[] {
    return Array.from(this.checkpoints.values());
  }

  private async createSnapshot(
    checkpointId: string,
    fileContents: Map<string, string>
  ): Promise<void> {
    const snapshot: CheckpointSnapshot = {
      checkpointId,
      files: new Map(fileContents),
      timestamp: Date.now(),
    };

    this.snapshots.set(checkpointId, snapshot);
  }

  private groupChangesByFile(changes: ChangeSpec[]): Map<string, ChangeSpec[]> {
    const grouped = new Map<string, ChangeSpec[]>();

    for (const change of changes) {
      const file = change.range.start.file;
      if (!grouped.has(file)) {
        grouped.set(file, []);
      }
      grouped.get(file)!.push(change);
    }

    return grouped;
  }

  private detectLanguage(file: string) {
    const ext = file.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript' as any;
      case 'js':
      case 'jsx':
        return 'javascript' as any;
      case 'py':
        return 'python' as any;
      case 'java':
        return 'java' as any;
      default:
        return 'javascript' as any;
    }
  }

  private generateId(): string {
    return `ckpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
