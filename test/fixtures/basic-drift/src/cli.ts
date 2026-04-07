import { Command } from 'commander';

const program = new Command();

program
  .option('--output <path>', 'Output file path')
  .option('--dry-run', 'Run without making changes')
  .option('--log-level <level>', 'Set log level')
  .parse();
