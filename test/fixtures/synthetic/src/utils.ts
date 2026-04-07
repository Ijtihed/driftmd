export function formatOutput(data: unknown, format: string): string {
  if (format === 'json') return JSON.stringify(data, null, 2);
  return String(data);
}

export function loadConfig(path: string): Record<string, unknown> {
  return {};
}
