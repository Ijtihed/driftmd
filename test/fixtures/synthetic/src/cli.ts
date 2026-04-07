import { Command } from 'commander';

const program = new Command();

program
  .name('synthetic')
  .description('A synthetic CLI for testing')
  .version('3.2.1')
  .option('--output <path>', 'Output file path')
  .option('--format <type>', 'Output format (json, table, csv)')
  .option('--dry-run', 'Run without making changes')
  .option('--log-level <level>', 'Set log level (debug, info, warn, error)')
  .option('--config <path>', 'Path to config file')
  .option('--no-color', 'Disable colored output')
  .parse();
