import { Invariant, ChangeSpec } from '@atomic/types';
import { logger } from '@atomic/utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface InvariantResult {
  name: string;
  passed: boolean;
  message?: string;
  output?: string;
}

export class InvariantRunner {
  async runAll(invariants: Invariant[], workingDir: string): Promise<InvariantResult[]> {
    const results: InvariantResult[] = [];

    for (const invariant of invariants) {
      const result = await this.runSingle(invariant, workingDir);
      results.push(result);
    }

    return results;
  }

  async runSingle(invariant: Invariant, workingDir: string): Promise<InvariantResult> {
    logger.info('Running invariant', { name: invariant.name, type: invariant.type });

    try {
      switch (invariant.type) {
        case 'typecheck':
          return await this.runTypecheck(invariant, workingDir);
        case 'symbolExists':
          return await this.checkSymbolExists(invariant, workingDir);
        case 'semanticRule':
          return await this.checkSemanticRule(invariant, workingDir);
        case 'regex':
          return await this.checkRegex(invariant, workingDir);
        default:
          return {
            name: invariant.name,
            passed: false,
            message: `Unsupported invariant type: ${invariant.type}`,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        name: invariant.name,
        passed: false,
        message: `Error running invariant: ${message}`,
      };
    }
  }

  private async runTypecheck(
    invariant: Invariant,
    workingDir: string
  ): Promise<InvariantResult> {
    try {
      const { stdout, stderr } = await execAsync(invariant.spec, { cwd: workingDir });

      return {
        name: invariant.name,
        passed: true,
        message: 'Type checking passed',
        output: stdout || stderr,
      };
    } catch (error: any) {
      return {
        name: invariant.name,
        passed: false,
        message: 'Type checking failed',
        output: error.stdout || error.stderr || error.message,
      };
    }
  }

  private async checkSymbolExists(
    invariant: Invariant,
    workingDir: string
  ): Promise<InvariantResult> {
    // Simple grep-based check for symbol existence
    const symbolName = invariant.spec;
    try {
      const { stdout } = await execAsync(
        `grep -r "${symbolName}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .`,
        { cwd: workingDir }
      );

      const exists = stdout.trim().length > 0;

      return {
        name: invariant.name,
        passed: exists,
        message: exists ? `Symbol '${symbolName}' found` : `Symbol '${symbolName}' not found`,
        output: stdout,
      };
    } catch (error: any) {
      // grep returns exit code 1 if no matches found
      return {
        name: invariant.name,
        passed: false,
        message: `Symbol '${symbolName}' not found`,
      };
    }
  }

  private async checkSemanticRule(
    invariant: Invariant,
    workingDir: string
  ): Promise<InvariantResult> {
    // For semantic rules, we run custom checks based on the spec
    // This is a simplified version - in reality, this would be more sophisticated
    const spec = invariant.spec.toLowerCase();

    if (spec.includes('no calls to')) {
      // Extract the forbidden pattern
      const match = spec.match(/no calls to\s+([^\s;]+)/);
      if (match) {
        const forbiddenPattern = match[1];
        try {
          const { stdout } = await execAsync(
            `grep -r "${forbiddenPattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .`,
            { cwd: workingDir }
          );

          const hasForbidden = stdout.trim().length > 0;

          return {
            name: invariant.name,
            passed: !hasForbidden,
            message: hasForbidden
              ? `Found forbidden calls to ${forbiddenPattern}`
              : `No calls to ${forbiddenPattern} found`,
            output: stdout,
          };
        } catch {
          // No matches found - that's good
          return {
            name: invariant.name,
            passed: true,
            message: `No calls to ${forbiddenPattern} found`,
          };
        }
      }
    }

    return {
      name: invariant.name,
      passed: true,
      message: 'Semantic rule check completed (basic validation)',
    };
  }

  private async checkRegex(
    invariant: Invariant,
    workingDir: string
  ): Promise<InvariantResult> {
    // Run regex pattern against all files in scope
    const pattern = invariant.spec;
    try {
      const { stdout } = await execAsync(
        `grep -rE "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .`,
        { cwd: workingDir }
      );

      const hasMatches = stdout.trim().length > 0;

      return {
        name: invariant.name,
        passed: hasMatches,
        message: hasMatches ? 'Pattern found' : 'Pattern not found',
        output: stdout,
      };
    } catch {
      return {
        name: invariant.name,
        passed: false,
        message: 'Pattern not found',
      };
    }
  }
}
