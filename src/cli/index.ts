#!/usr/bin/env node

/**
 * Atomic CLI - Command-line interface for Atomic governance
 */

import { Command } from 'commander';
import { AtomicEngine } from '../atomic-engine';
import * as fs from 'fs/promises';

const program = new Command();

program
  .name('atomic')
  .description('AgentOps governance layer for Copilot/Cursor/Windsurf')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Atomic in the current directory')
  .action(async () => {
    try {
      const engine = new AtomicEngine();
      await engine.initialize();
      console.log('✓ Atomic initialized successfully');
    } catch (error) {
      console.error('✗ Failed to initialize:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('checkpoint')
  .description('Create a new checkpoint')
  .requiredOption('-m, --mission <name>', 'Mission name')
  .option('-d, --description <text>', 'Checkpoint description')
  .option('--no-reversible', 'Make checkpoint non-reversible')
  .action(async (options) => {
    try {
      const engine = new AtomicEngine();
      await engine.initialize();

      const checkpointId = await engine.createCheckpoint({
        mission: options.mission,
        description: options.description || '',
        reversible: options.reversible,
        dependencies: [],
      });

      console.log(`✓ Checkpoint created: ${checkpointId}`);
    } catch (error) {
      console.error('✗ Failed to create checkpoint:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('apply')
  .description('Apply changes to files')
  .requiredOption('-c, --checkpoint <id>', 'Checkpoint ID')
  .requiredOption('-f, --files <paths...>', 'Files to apply changes to')
  .action(async (options) => {
    try {
      const engine = new AtomicEngine();
      await engine.initialize();

      const fileContents = new Map<string, string>();
      for (const file of options.files) {
        const content = await fs.readFile(file, 'utf-8');
        fileContents.set(file, content);
      }

      const results = await engine.applyCheckpoint(options.checkpoint, fileContents);

      // Write results back to files
      for (const [file, content] of results) {
        await fs.writeFile(file, content);
        console.log(`✓ Applied changes to ${file}`);
      }
    } catch (error) {
      console.error('✗ Failed to apply changes:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('rollback')
  .description('Rollback a checkpoint')
  .requiredOption('-c, --checkpoint <id>', 'Checkpoint ID')
  .action(async (options) => {
    try {
      const engine = new AtomicEngine();
      await engine.initialize();

      const results = await engine.rollbackCheckpoint(options.checkpoint);

      // Write results back to files
      for (const [file, content] of results) {
        await fs.writeFile(file, content);
        console.log(`✓ Rolled back ${file}`);
      }
    } catch (error) {
      console.error('✗ Failed to rollback:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('scan')
  .description('Scan files for secrets and PII')
  .requiredOption('-f, --files <paths...>', 'Files to scan')
  .option('--redact', 'Redact findings and write to files')
  .action(async (options) => {
    try {
      const engine = new AtomicEngine();
      await engine.initialize();

      const files = new Map<string, string>();
      for (const file of options.files) {
        const content = await fs.readFile(file, 'utf-8');
        files.set(file, content);
      }

      const results = await engine.scanFiles(files);

      for (const [file, result] of results) {
        console.log(`\n${file}:`);
        if (result.findings.length === 0) {
          console.log('  ✓ No issues found');
        } else {
          for (const finding of result.findings) {
            console.log(
              `  ${finding.severity.toUpperCase()}: ${finding.message} at line ${finding.location.start.line}`
            );
          }

          if (options.redact) {
            await fs.writeFile(file, result.redacted);
            console.log(`  ✓ Redacted and saved`);
          }
        }
      }
    } catch (error) {
      console.error('✗ Failed to scan:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('budget')
  .description('Manage budgets')
  .option('-c, --create', 'Create a new budget')
  .option('-i, --id <id>', 'Budget ID')
  .option('-m, --max <amount>', 'Maximum cost in USD')
  .option('-s, --status', 'Show budget status')
  .action(async (options) => {
    try {
      const engine = new AtomicEngine();
      await engine.initialize();

      if (options.create) {
        if (!options.id || !options.max) {
          console.error('✗ --id and --max are required for creating a budget');
          process.exit(1);
        }

        await engine.createBudget({
          id: options.id,
          maxCost: parseFloat(options.max),
          currentCost: 0,
          alertThreshold: 80,
          models: [
            { modelId: 'gpt-3.5-turbo', priority: 1 },
            { modelId: 'gpt-4', priority: 2 },
          ],
        });

        console.log(`✓ Budget created: ${options.id} (max: $${options.max})`);
      } else if (options.status) {
        if (!options.id) {
          console.error('✗ --id is required for budget status');
          process.exit(1);
        }

        const budget = engine.getBudget(options.id);
        if (!budget) {
          console.error(`✗ Budget ${options.id} not found`);
          process.exit(1);
        }

        const percentUsed = (budget.currentCost / budget.maxCost) * 100;
        console.log(`Budget: ${budget.id}`);
        console.log(`  Max Cost: $${budget.maxCost}`);
        console.log(`  Current Cost: $${budget.currentCost.toFixed(2)}`);
        console.log(`  Used: ${percentUsed.toFixed(2)}%`);
      }
    } catch (error) {
      console.error('✗ Failed:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('audit')
  .description('Generate audit pack')
  .requiredOption('-c, --checkpoint <id>', 'Checkpoint ID')
  .option('-o, --output <path>', 'Output path for audit pack')
  .action(async (options) => {
    try {
      const engine = new AtomicEngine();
      await engine.initialize();

      const pack = await engine.generateAuditPack(options.checkpoint);

      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(pack, null, 2));
        console.log(`✓ Audit pack saved to ${options.output}`);
      } else {
        console.log(JSON.stringify(pack, null, 2));
      }

      console.log(`\nSummary:`);
      console.log(`  Total Changes: ${pack.summary.totalChanges}`);
      console.log(`  Successful: ${pack.summary.successfulChanges}`);
      console.log(`  Failed: ${pack.summary.failedChanges}`);
      console.log(`  Total Cost: $${pack.summary.totalCost.toFixed(4)}`);
      console.log(`  Security Findings: ${pack.summary.securityFindings}`);
    } catch (error) {
      console.error('✗ Failed to generate audit pack:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);
