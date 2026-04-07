import { describe, it, expect } from 'vitest';
import { extractCommanderFlags } from '../extractor/commander.js';
import { extractArgparseFlags } from '../extractor/argparse.js';
import { extractClickFlags } from '../extractor/click.js';
import { extractClapFlags } from '../extractor/clap.js';

describe('commander extractor', () => {
  it('extracts .option() flags', () => {
    const code = `
program
  .option('--verbose', 'Enable verbose output')
  .option('-o, --output <path>', 'Output file')
  .option('--dry-run', 'Dry run mode')
`;
    const flags = extractCommanderFlags(code, 'cli.ts');
    const names = flags.map((f) => f.flag);
    expect(names).toContain('--verbose');
    expect(names).toContain('--output');
    expect(names).toContain('-o');
    expect(names).toContain('--dry-run');
  });
});

describe('argparse extractor', () => {
  it('extracts single-line add_argument flags', () => {
    const code = `
parser.add_argument('--verbose', action='store_true')
parser.add_argument('-o', '--output', type=str)
parser.add_argument('--dry-run', action='store_true')
`;
    const flags = extractArgparseFlags(code, 'cli.py');
    const names = flags.map((f) => f.flag);
    expect(names).toContain('--verbose');
    expect(names).toContain('-o');
    expect(names).toContain('--output');
    expect(names).toContain('--dry-run');
  });

  it('extracts multi-line add_argument flags', () => {
    const code = `
network.add_argument(
    '--offline',
    action='store_true',
    help='Run in offline mode'
)
auth.add_argument(
    '-a', '--auth',
    default=None,
    metavar='USER[:PASS]',
    help='Authentication credentials'
)
parser.add_argument('--simple', help='Simple flag')
`;
    const flags = extractArgparseFlags(code, 'cli.py');
    const names = flags.map((f) => f.flag);
    expect(names).toContain('--offline');
    expect(names).toContain('-a');
    expect(names).toContain('--auth');
    expect(names).toContain('--simple');
  });
});

describe('click extractor', () => {
  it('extracts @click.option() flags', () => {
    const code = `
@click.option('--verbose', '-v', is_flag=True)
@click.option('--output', '-o', type=str)
`;
    const flags = extractClickFlags(code, 'cli.py');
    const names = flags.map((f) => f.flag);
    expect(names).toContain('--verbose');
    expect(names).toContain('-v');
    expect(names).toContain('--output');
    expect(names).toContain('-o');
  });
});

describe('clap extractor', () => {
  it('extracts .long() and .short() flags', () => {
    const code = `
Arg::new("verbose").long("verbose").short('v')
Arg::new("output").long("output")
`;
    const flags = extractClapFlags(code, 'main.rs');
    const names = flags.map((f) => f.flag);
    expect(names).toContain('--verbose');
    expect(names).toContain('-v');
    expect(names).toContain('--output');
  });
});
