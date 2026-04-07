export type Severity = 'error' | 'warning' | 'info';

export type CheckType =
  | 'file-reference'
  | 'internal-link'
  | 'dir-tree'
  | 'cli-flag'
  | 'env-var'
  | 'badge'
  | 'signature';

export interface Finding {
  type: CheckType;
  severity: Severity;
  line: number;
  column?: number;
  message: string;
  suggestion?: string;
  source?: string;
  readme: string;
}

export interface DriftReport {
  readme: string;
  findings: Finding[];
  checkedAt: string;
  duration: number;
  hasErrors: boolean;
  hasWarnings: boolean;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

export interface ChecksConfig {
  fileReferences?: boolean;
  dirTree?: boolean;
  internalLinks?: boolean;
  cliFlags?: boolean;
  envVars?: boolean;
  badges?: boolean;
  signatures?: boolean;
}

export interface VerifyConfig {
  enabled: boolean;
  provider: 'ollama' | 'anthropic' | 'openai';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface DriftConfig {
  readme?: string[];
  checks?: ChecksConfig;
  ignore?: string[];
  cliEntry?: string;
  severity?: Severity;
  verify?: VerifyConfig;
}

export interface ParsedReadme {
  filePath: string;
  links: ExtractedLink[];
  codeBlocks: ExtractedCodeBlock[];
  fileReferences: ExtractedFileReference[];
  dirTrees: ExtractedDirTree[];
  envVars: ExtractedEnvVar[];
  cliFlags: ExtractedCliFlag[];
  badgeUrls: ExtractedBadge[];
}

export interface ExtractedLink {
  href: string;
  line: number;
  column: number;
  text: string;
}

export interface ExtractedCodeBlock {
  lang: string | null;
  value: string;
  line: number;
}

export interface ExtractedFileReference {
  path: string;
  line: number;
  column: number;
  context: 'prose' | 'code-block' | 'inline-code';
}

export interface ExtractedDirTree {
  line: number;
  raw: string;
  entries: DirTreeEntry[];
}

export interface DirTreeEntry {
  path: string;
  isDirectory: boolean;
  depth: number;
}

export interface ExtractedEnvVar {
  name: string;
  line: number;
  column: number;
}

export interface ExtractedCliFlag {
  flag: string;
  line: number;
  column: number;
}

export interface ExtractedBadge {
  url: string;
  line: number;
  packageName?: string;
  version?: string;
}
