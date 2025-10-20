import express from 'express';
import dotenv from 'dotenv';
import { logger, generateId } from '@atomic/utils';
import { ProvenanceGraph, ProvenanceNode, AuditPack, Event } from '@atomic/types';
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const app = express();
const port = process.env.EVIDENCE_PORT || 3005;

app.use(express.json());

// In-memory storage
const events: Event[] = [];
const provenanceGraphs = new Map<string, ProvenanceGraph>();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'evidence' });
});

// Record event
app.post('/evidence/events', (req, res) => {
  try {
    const { type, missionId, data } = req.body;

    const event: Event = {
      id: generateId('EVT'),
      type,
      timestamp: new Date().toISOString(),
      missionId,
      data,
    };

    events.push(event);
    logger.info('Event recorded', { eventId: event.id, type });

    res.status(201).json(event);
  } catch (error) {
    logger.error('Error recording event', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get mission provenance
app.get('/evidence/mission/:id', (req, res) => {
  try {
    const missionId = req.params.id;

    // Build provenance graph from events
    const missionEvents = events.filter((e) => e.missionId === missionId);

    const nodes: ProvenanceNode[] = missionEvents.map((e) => ({
      id: e.id,
      type: 'change',
      timestamp: e.timestamp,
      actor: 'system',
      data: e.data,
    }));

    const edges = nodes.slice(0, -1).map((node, i) => ({
      from: node.id,
      to: nodes[i + 1].id,
    }));

    const graph: ProvenanceGraph = { nodes, edges };
    provenanceGraphs.set(missionId, graph);

    res.json(graph);
  } catch (error) {
    logger.error('Error getting provenance', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export audit pack
app.post('/evidence/export', async (req, res) => {
  try {
    const { missionId, changeSpec } = req.body;

    logger.info('Exporting audit pack', { missionId });

    // Create temporary directory
    const tmpDir = path.join('/tmp', `audit-${missionId}`);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Write changeSpec
    fs.writeFileSync(
      path.join(tmpDir, 'changespec.json'),
      JSON.stringify(changeSpec, null, 2)
    );

    // Write provenance graph
    const graph = provenanceGraphs.get(missionId);
    if (graph) {
      fs.writeFileSync(path.join(tmpDir, 'provenance.json'), JSON.stringify(graph, null, 2));
    }

    // Write events
    const missionEvents = events.filter((e) => e.missionId === missionId);
    fs.writeFileSync(path.join(tmpDir, 'events.json'), JSON.stringify(missionEvents, null, 2));

    // Create ZIP archive
    const zipPath = path.join('/tmp', `audit-pack-${missionId}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(tmpDir, false);
    await archive.finalize();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
    });

    // Send file
    res.download(zipPath, `audit-pack-${missionId}.zip`, (err) => {
      if (err) {
        logger.error('Error sending audit pack', err);
      }
      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.unlinkSync(zipPath);
    });
  } catch (error) {
    logger.error('Error exporting audit pack', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Evidence service listening on port ${port}`, { port });
  });
}

export default app;
