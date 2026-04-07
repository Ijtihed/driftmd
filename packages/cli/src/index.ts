import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { analyzeDrift } from 'driftmd-core';
import type { DriftConfig, DriftReport, ChecksConfig, Severity, VerifyConfig } from 'driftmd-core';
import { loadConfig } from './config.js';
import { printConsoleReport } from './reporter/console.js';
import { printJsonReport } from './reporter/json.js';
import { VERSION } from './version.js';

const SEVERITY_RANK: Record<Severity, number> = {
  error: 3,
  warning: 2,
  info: 1,
};

function filterBySeverity(report: DriftReport, threshold: Severity): DriftReport {
  const minRank = SEVERITY_RANK[threshold];
  const filtered = report.findings.filter(
    (f) => SEVERITY_RANK[f.severity] >= minRank,
  );
  const errors = filtered.filter((f) => f.severity === 'error').length;
  const warnings = filtered.filter((f) => f.severity === 'warning').length;
  const info = filtered.filter((f) => f.severity === 'info').length;

  return {
    ...report,
    findings: filtered,
    hasErrors: errors > 0,
    hasWarnings: warnings > 0,
    summary: { total: filtered.length, errors, warnings, info },
  };
}

export function createCli(): Command {
  const program = new Command();

  program
    .name('driftmd')
    .description('Your README is lying. driftmd catches it.')
    .version(VERSION)
    .argument('[path]', 'Path to the repository to check', '.')
    .option('--json', 'Output results as JSON')
    .option('--readme <files...>', 'README file(s) to check')
    .option('--no-file-references', 'Disable file reference checks')
    .option('--no-dir-tree', 'Disable directory tree checks')
    .option('--no-internal-links', 'Disable internal link checks')
    .option('--no-cli-flags', 'Disable CLI flag checks')
    .option('--no-env-vars', 'Disable env var checks')
    .option('--no-badges', 'Disable badge version checks')
    .option('--signatures', 'Enable function signature checks')
    .option('--severity <level>', 'Minimum severity to report: error, warning, info', 'error')
    .option('--verify', 'Enable LLM-verified deep checks (requires ollama or API key)')
    .option('--provider <name>', 'LLM provider: ollama, anthropic, openai', 'ollama')
    .option('--model <name>', 'LLM model name')
    .option('--api-key <key>', 'API key for anthropic/openai')
    .option('--init', 'Generate .driftmdrc.json with defaults')
    .option('--cli-entry <path>', 'Path to CLI entry point for flag extraction')
    .option('--ignore <patterns...>', 'Patterns to ignore')
    .option('--reporter <type>', 'Reporter type: console, json, github-pr', 'console')
    .action(async (repoPath: string, options: Record<string, unknown>) => {
      try {
        if (options.init) {
          const configPath = path.resolve(process.cwd(), '.driftmdrc.json');
          if (fs.existsSync(configPath)) {
            console.log('.driftmdrc.json already exists.');
            process.exit(0);
          }
          const defaults = {
            readme: ['README.md'],
            checks: {
              'file-references': true,
              'dir-tree': true,
              'internal-links': true,
              'cli-flags': true,
              'env-vars': true,
              badges: true,
              signatures: false,
            },
            ignore: ['node_modules', 'dist', '.git'],
            severity: 'error',
          };
          fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2) + '\n');
          console.log('Created .driftmdrc.json');
          process.exit(0);
        }

        const cwd = repoPath === '.' ? process.cwd() : repoPath;
        const fileConfig = loadConfig(cwd);

        const checks: ChecksConfig = {
          fileReferences: options.fileReferences as boolean ?? fileConfig.checks?.fileReferences ?? true,
          dirTree: options.dirTree as boolean ?? fileConfig.checks?.dirTree ?? true,
          internalLinks: options.internalLinks as boolean ?? fileConfig.checks?.internalLinks ?? true,
          cliFlags: options.cliFlags as boolean ?? fileConfig.checks?.cliFlags ?? true,
          envVars: options.envVars as boolean ?? fileConfig.checks?.envVars ?? true,
          badges: options.badges as boolean ?? fileConfig.checks?.badges ?? true,
          signatures: (options.signatures as boolean) ?? fileConfig.checks?.signatures ?? false,
        };

        let verify: VerifyConfig | undefined;
        if (options.verify) {
          const provider = (options.provider as string) || 'ollama';
          let apiKey = options.apiKey as string | undefined;
          if (!apiKey && provider === 'anthropic') apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey && provider === 'openai') apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey && provider !== 'ollama') {
            console.error(`Error: --api-key or ${provider.toUpperCase()}_API_KEY required for ${provider}`);
            process.exit(1);
          }
          verify = {
            enabled: true,
            provider: provider as VerifyConfig['provider'],
            model: options.model as string | undefined,
            apiKey,
          };
        }

        const config: DriftConfig = {
          readme: (options.readme as string[]) ?? fileConfig.readme,
          checks,
          ignore: (options.ignore as string[]) ?? fileConfig.ignore,
          cliEntry: (options.cliEntry as string) ?? fileConfig.cliEntry,
          verify,
        };

        const rawReport = await analyzeDrift(cwd, config);

        const severity = (options.severity as string) ?? fileConfig.severity ?? 'error';
        const report = filterBySeverity(rawReport, severity as Severity);

        const reporter = options.json ? 'json' : (options.reporter as string ?? 'console');

        switch (reporter) {
          case 'json':
            printJsonReport(report);
            break;
          case 'github-pr':
            printJsonReport(report);
            break;
          default:
            printConsoleReport(report, !!options.verify);
        }

        process.exit(report.hasErrors ? 1 : 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        if (process.env.DEBUG?.includes('driftmd') && err instanceof Error) {
          console.error(err.stack);
        }
        process.exit(1);
      }
    });

  return program;
}
