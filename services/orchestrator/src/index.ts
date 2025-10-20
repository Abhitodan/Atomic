import express from 'express';
import dotenv from 'dotenv';
import { logger, generateId } from '@atomic/utils';
import { Mission, Checkpoint } from '@atomic/types';
import { validateMission } from '@atomic/schemas';

dotenv.config();

const app = express();
const port = process.env.ORCHESTRATOR_PORT || 3002;

app.use(express.json());

// In-memory storage (replace with database in production)
const missions = new Map<string, Mission>();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'orchestrator' });
});

// Create mission
app.post('/missions', (req, res) => {
  try {
    const { title, risk } = req.body;

    const missionId = generateId('M');

    const checkpoints: Checkpoint[] = [
      { name: 'plan', status: 'pending', actor: 'human', artifacts: [] },
      { name: 'execute', status: 'pending', actor: 'agent', batches: [] },
      { name: 'verify', status: 'pending', actor: 'agent', metrics: {} },
      { name: 'finalize', status: 'pending', actor: 'human' },
    ];

    const mission: Mission = {
      missionId,
      title,
      risk: risk || 'medium',
      checkpoints,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!validateMission(mission)) {
      return res.status(400).json({ error: 'Invalid mission data' });
    }

    missions.set(missionId, mission);
    logger.info('Mission created', { missionId });

    res.status(201).json(mission);
  } catch (error) {
    logger.error('Error creating mission', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get mission
app.get('/missions/:id', (req, res) => {
  const mission = missions.get(req.params.id);

  if (!mission) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  res.json(mission);
});

// Approve checkpoint
app.post('/missions/:id/checkpoints/:name/approve', (req, res) => {
  const mission = missions.get(req.params.id);

  if (!mission) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  const checkpoint = mission.checkpoints.find((cp) => cp.name === req.params.name);

  if (!checkpoint) {
    return res.status(404).json({ error: 'Checkpoint not found' });
  }

  checkpoint.status = 'approved';
  mission.updatedAt = new Date().toISOString();

  logger.info('Checkpoint approved', { missionId: mission.missionId, checkpoint: req.params.name });

  res.json(mission);
});

// Create batch
app.post('/missions/:id/batches', (req, res) => {
  const mission = missions.get(req.params.id);

  if (!mission) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  const executeCheckpoint = mission.checkpoints.find((cp) => cp.name === 'execute');

  if (!executeCheckpoint) {
    return res.status(404).json({ error: 'Execute checkpoint not found' });
  }

  const batchId = generateId('batch');
  const batch = {
    id: batchId,
    reversible: true,
    prs: [],
  };

  if (!executeCheckpoint.batches) {
    executeCheckpoint.batches = [];
  }

  executeCheckpoint.batches.push(batch);
  mission.updatedAt = new Date().toISOString();

  logger.info('Batch created', { missionId: mission.missionId, batchId });

  res.status(201).json(batch);
});

// Rollback batch
app.post('/missions/:missionId/rollback/:batchId', (req, res) => {
  const mission = missions.get(req.params.missionId);

  if (!mission) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  logger.info('Rolling back batch', {
    missionId: req.params.missionId,
    batchId: req.params.batchId,
  });

  // In a real implementation, this would:
  // 1. Find the batch
  // 2. Revert all changes in the batch
  // 3. Update the mission state

  res.json({ success: true, message: 'Batch rolled back' });
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Orchestrator service listening on port ${port}`, { port });
  });
}

export default app;
