import * as fs from 'node:fs';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { analyzeDrift } from '@driftmd/core';
import type { DriftConfig, ChecksConfig, VerifyConfig } from '@driftmd/core';
import { formatPRComment } from './reporter/pr-comment.js';
import { formatSarif } from './reporter/sarif.js';

async function run(): Promise<void> {
  try {
    const readmeInput = core.getInput('readme') || 'README.md';
    const checksInput = core.getInput('checks');
    const ignoreInput = core.getInput('ignore');
    const cliEntry = core.getInput('cli-entry') || undefined;
    const failOnError = core.getBooleanInput('fail-on-error');
    const commentOnPr = core.getBooleanInput('comment-on-pr');
    const sarifOutput = core.getInput('sarif-output') || '';
    const enableSignatures = core.getInput('signatures') === 'true';

    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();

    const enabledChecks = checksInput
      ? new Set(checksInput.split(',').map((s) => s.trim()))
      : null;

    const checks: ChecksConfig = {
      fileReferences: enabledChecks?.has('file-references') ?? true,
      dirTree: enabledChecks?.has('dir-tree') ?? true,
      internalLinks: enabledChecks?.has('internal-links') ?? true,
      cliFlags: enabledChecks?.has('cli-flags') ?? true,
      envVars: enabledChecks?.has('env-vars') ?? true,
      badges: enabledChecks?.has('badges') ?? true,
      signatures: enabledChecks?.has('signatures') ?? enableSignatures,
    };

    let verify: VerifyConfig | undefined;
    if (core.getInput('verify') === 'true') {
      const provider = (core.getInput('verify-provider') || 'anthropic') as VerifyConfig['provider'];
      const apiKey = core.getInput('verify-api-key') || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
      if (apiKey || provider === 'ollama') {
        verify = { enabled: true, provider, apiKey };
      }
    }

    const config: DriftConfig = {
      readme: readmeInput.split(',').map((s) => s.trim()),
      checks,
      ignore: ignoreInput ? ignoreInput.split(',').map((s) => s.trim()) : undefined,
      cliEntry,
      verify,
    };

    core.info(`driftmd: scanning ${config.readme?.join(', ')} against codebase...`);

    const report = await analyzeDrift(workspace, config);

    core.setOutput('findings', report.summary.total);
    core.setOutput('has-errors', report.hasErrors);
    core.setOutput('report', JSON.stringify(report));

    if (sarifOutput) {
      const sarif = formatSarif(report);
      fs.writeFileSync(sarifOutput, JSON.stringify(sarif, null, 2), 'utf-8');
      core.info(`SARIF report written to ${sarifOutput}`);
    }

    if (commentOnPr && github.context.payload.pull_request) {
      const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
      if (token) {
        const octokit = github.getOctokit(token);
        const prNumber = github.context.payload.pull_request.number;
        const comment = formatPRComment(report);

        await octokit.rest.issues.createComment({
          ...github.context.repo,
          issue_number: prNumber,
          body: comment,
        });

        core.info('Posted drift report as PR comment.');
      } else {
        core.warning('No GitHub token provided — skipping PR comment.');
      }
    }

    for (const finding of report.findings) {
      const annotation = `${finding.readme}:${finding.line}: ${finding.message}`;
      if (finding.severity === 'error') {
        core.error(annotation, {
          file: finding.readme,
          startLine: finding.line || undefined,
        });
      } else if (finding.severity === 'warning') {
        core.warning(annotation, {
          file: finding.readme,
          startLine: finding.line || undefined,
        });
      } else {
        core.notice(annotation, {
          file: finding.readme,
          startLine: finding.line || undefined,
        });
      }
    }

    if (report.summary.total > 0) {
      core.info(
        `driftmd found ${report.summary.total} finding(s): ${report.summary.errors} error(s), ${report.summary.warnings} warning(s), ${report.summary.info} info`,
      );
    } else {
      core.info('driftmd: README is in sync with codebase.');
    }

    if (failOnError && report.hasErrors) {
      core.setFailed(
        `driftmd found ${report.summary.errors} error(s) in your README.`,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
