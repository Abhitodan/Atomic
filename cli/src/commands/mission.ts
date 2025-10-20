import { Command } from 'commander';
import { logger } from '@atomic/utils';
import axios from 'axios';

export function createMissionCommand() {
  const mission = new Command('mission').description('Mission management commands');

  // atomic mission create
  mission
    .command('create')
    .description('Create a new mission')
    .requiredOption('--title <text>', 'Mission title')
    .option('--risk <level>', 'Risk level (low|medium|high)', 'medium')
    .action(async (options) => {
      try {
        logger.info('Creating mission', options);

        const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:3002';
        const response = await axios.post(`${orchestratorUrl}/missions`, {
          title: options.title,
          risk: options.risk,
        });

        console.log(`✅ Mission created: ${response.data.missionId}`);
      } catch (error) {
        logger.error('Error creating mission', error as Error);
        process.exit(1);
      }
    });

  // atomic mission rollback
  mission
    .command('rollback')
    .description('Rollback a mission batch')
    .requiredOption('--mission <id>', 'Mission ID')
    .requiredOption('--batch <id>', 'Batch ID')
    .action(async (options) => {
      try {
        logger.info('Rolling back batch', options);

        const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:3002';
        const response = await axios.post(
          `${orchestratorUrl}/missions/${options.mission}/rollback/${options.batch}`
        );

        console.log(`✅ Batch ${options.batch} rolled back successfully`);
      } catch (error) {
        logger.error('Error rolling back batch', error as Error);
        process.exit(1);
      }
    });

  // atomic mission status
  mission
    .command('status')
    .description('Get mission status')
    .requiredOption('--mission <id>', 'Mission ID')
    .action(async (options) => {
      try {
        const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:3002';
        const response = await axios.get(`${orchestratorUrl}/missions/${options.mission}`);

        const missionData = response.data;
        console.log(`\n📋 Mission: ${missionData.missionId}`);
        console.log(`   Title: ${missionData.title}`);
        console.log(`   Risk: ${missionData.risk}`);
        console.log(`\n   Checkpoints:`);
        missionData.checkpoints.forEach((cp: any) => {
          const icon = cp.status === 'completed' ? '✅' : cp.status === 'approved' ? '👍' : '⏳';
          console.log(`   ${icon} ${cp.name}: ${cp.status}`);
        });
      } catch (error) {
        logger.error('Error getting mission status', error as Error);
        process.exit(1);
      }
    });

  return mission;
}
