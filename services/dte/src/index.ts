import express from 'express';
import dotenv from 'dotenv';
import { logger } from '@atomic/utils';
import { ChangeSpec, DTEResult } from '@atomic/types';
import { validateChangeSpec } from '@atomic/schemas';
import { TypeScriptPack } from './language-packs/typescript';
import { InvariantRunner } from './invariants/runner';
import { MutationTester } from './mutations/tester';

dotenv.config();

const app = express();
const port = process.env.DTE_PORT || 3003;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'dte' });
});

// Apply ChangeSpec
app.post('/dte/apply', async (req, res) => {
  try {
    const spec = req.body as ChangeSpec;

    if (!validateChangeSpec(spec)) {
      return res.status(400).json({ error: 'Invalid ChangeSpec' });
    }

    logger.info('Applying ChangeSpec', { id: spec.id });

    let result: DTEResult;

    switch (spec.language) {
      case 'typescript':
      case 'javascript': {
        const pack = new TypeScriptPack();
        const transformResult = await pack.applyPatches(spec.patches, false);

        result = {
          success: transformResult.success,
          patches: transformResult.filesModified,
          errors: transformResult.errors,
        };
        break;
      }
      default:
        return res.status(400).json({
          error: `Language not supported: ${spec.language}`,
        });
    }

    res.json(result);
  } catch (error) {
    logger.error('Error applying ChangeSpec', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify ChangeSpec
app.post('/dte/verify', async (req, res) => {
  try {
    const { spec, workingDir } = req.body as { spec: ChangeSpec; workingDir: string };

    if (!validateChangeSpec(spec)) {
      return res.status(400).json({ error: 'Invalid ChangeSpec' });
    }

    logger.info('Verifying ChangeSpec', { id: spec.id });

    const invariantRunner = new InvariantRunner();
    const mutationTester = new MutationTester();

    // Run invariants
    const invariantResults = await invariantRunner.runAll(
      spec.invariants,
      workingDir || process.cwd()
    );

    const allInvariantsPassed = invariantResults.every((r) => r.passed);

    // Run mutation tests
    const mutationReport = await mutationTester.runMutationTests(
      spec.tests.targets,
      spec.tests.mutationThreshold,
      workingDir || process.cwd()
    );

    const mutationPassed = mutationReport.score >= spec.tests.mutationThreshold;

    const result: DTEResult = {
      success: allInvariantsPassed && mutationPassed,
      errors: invariantResults
        .filter((r) => !r.passed)
        .map((r) => `${r.name}: ${r.message}`),
      warnings: mutationPassed
        ? []
        : [`Mutation score ${mutationReport.score.toFixed(2)} below threshold ${spec.tests.mutationThreshold}`],
      mutationReport,
    };

    res.json(result);
  } catch (error) {
    logger.error('Error verifying ChangeSpec', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`DTE service listening on port ${port}`, { port });
  });
}

export default app;
