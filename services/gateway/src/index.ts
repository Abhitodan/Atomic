import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { preflightHandler, routeHandler } from './routes/gateway';
import { latencyTracking, errorHandler, validateContentType } from './middleware';
import { logger } from '@atomic/utils';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.GATEWAY_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '10mb' }));

// Custom middleware
app.use(latencyTracking);
app.use(validateContentType);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway' });
});

// Gateway routes
app.post('/gateway/preflight', preflightHandler);
app.post('/gateway/route', routeHandler);

// Error handling
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Gateway service listening on port ${port}`, { port });
  });
}

export default app;
