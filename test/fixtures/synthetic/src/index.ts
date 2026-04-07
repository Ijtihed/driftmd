import { Command } from 'commander';

export function main() {
  const dbUrl = process.env.DATABASE_URL;
  const apiKey = process.env.API_KEY;
  const secretToken = process.env.SECRET_TOKEN;
  const cacheHost = process.env.CACHE_HOST;
  console.log('Running synthetic-app');
}
