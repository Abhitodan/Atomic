#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { createDTECommand } from './commands/dte';
import { createMissionCommand } from './commands/mission';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('atomic')
  .description('Atomic - AgentOps Governance Platform CLI')
  .version('1.0.0');

// Add commands
program.addCommand(createDTECommand());
program.addCommand(createMissionCommand());

// Parse arguments
program.parse(process.argv);
