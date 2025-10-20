import { Command } from 'commander';
import { logger } from '@atomic/utils';
import { ChangeSpec } from '@atomic/types';
import { validateChangeSpec } from '@atomic/schemas';
import axios from 'axios';
import * as fs from 'fs';

export function createDTECommand() {
  const dte = new Command('dte')
    .description('Deterministic Transform Engine commands');

  // atomic dte plan
  dte
    .command('plan')
    .description('Generate a ChangeSpec from intent')
    .requiredOption('--intent <text>', 'Description of intended change')
    .requiredOption('--scope <paths...>', 'File paths or glob patterns')
    .option('--language <lang>', 'Programming language', 'typescript')
    .option('--output <file>', 'Output file for ChangeSpec', 'changespec.json')
    .action(async (options) => {
      try {
        logger.info('Planning ChangeSpec', options);

        // This is a simplified version - in reality, this would use AI to generate the spec
        const spec: ChangeSpec = {
          id: `CS-${Date.now()}`,
          intent: options.intent,
          scope: options.scope,
          language: options.language,
          patches: [],
          invariants: [
            {
              name: 'TypeCheckAll',
              type: 'typecheck',
              spec: 'tsc --noEmit',
            },
          ],
          tests: {
            strategy: 'augment',
            targets: options.scope,
            mutationThreshold: 0.6,
          },
          risk: 'medium',
        };

        fs.writeFileSync(options.output, JSON.stringify(spec, null, 2));
        console.log(`✅ ChangeSpec written to ${options.output}`);
      } catch (error) {
        logger.error('Error planning ChangeSpec', error as Error);
        process.exit(1);
      }
    });

  // atomic dte apply
  dte
    .command('apply')
    .description('Apply a ChangeSpec to codebase')
    .requiredOption('--spec <file>', 'Path to ChangeSpec JSON file')
    .option('--dry-run', 'Preview changes without applying', false)
    .action(async (options) => {
      try {
        const specContent = fs.readFileSync(options.spec, 'utf-8');
        const spec = JSON.parse(specContent) as ChangeSpec;

        if (!validateChangeSpec(spec)) {
          console.error('❌ Invalid ChangeSpec');
          process.exit(1);
        }

        logger.info('Applying ChangeSpec', { id: spec.id, dryRun: options.dryRun });

        const dteUrl = process.env.DTE_URL || 'http://localhost:3003';
        const response = await axios.post(`${dteUrl}/dte/apply`, spec);

        if (response.data.success) {
          console.log('✅ ChangeSpec applied successfully');
          console.log(`   Modified ${response.data.patches.length} files`);
        } else {
          console.log('❌ ChangeSpec application failed');
          response.data.errors?.forEach((err: string) => console.log(`   - ${err}`));
          process.exit(1);
        }
      } catch (error) {
        logger.error('Error applying ChangeSpec', error as Error);
        process.exit(1);
      }
    });

  // atomic dte verify
  dte
    .command('verify')
    .description('Verify a ChangeSpec (run invariants and tests)')
    .requiredOption('--spec <file>', 'Path to ChangeSpec JSON file')
    .option('--ci', 'CI mode - fail on verification errors', false)
    .option('--working-dir <dir>', 'Working directory', process.cwd())
    .action(async (options) => {
      try {
        const specContent = fs.readFileSync(options.spec, 'utf-8');
        const spec = JSON.parse(specContent) as ChangeSpec;

        if (!validateChangeSpec(spec)) {
          console.error('❌ Invalid ChangeSpec');
          process.exit(1);
        }

        logger.info('Verifying ChangeSpec', { id: spec.id });

        const dteUrl = process.env.DTE_URL || 'http://localhost:3003';
        const response = await axios.post(`${dteUrl}/dte/verify`, {
          spec,
          workingDir: options.workingDir,
        });

        if (response.data.success) {
          console.log('✅ ChangeSpec verification passed');
          if (response.data.mutationReport) {
            const { score, mutantsKilled, mutantsTotal } = response.data.mutationReport;
            console.log(
              `   Mutation score: ${(score * 100).toFixed(1)}% (${mutantsKilled}/${mutantsTotal})`
            );
          }
        } else {
          console.log('❌ ChangeSpec verification failed');
          response.data.errors?.forEach((err: string) => console.log(`   - ${err}`));
          response.data.warnings?.forEach((warn: string) => console.log(`   ⚠️  ${warn}`));

          if (options.ci) {
            process.exit(1);
          }
        }
      } catch (error) {
        logger.error('Error verifying ChangeSpec', error as Error);
        process.exit(1);
      }
    });

  return dte;
}
