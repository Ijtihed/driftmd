import { NextResponse } from 'next/server';
import { getReport } from '@/lib/cache';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing report ID' }, { status: 400 });
  }

  const cached = getReport(id);
  if (!cached) {
    return NextResponse.json({ error: 'Report not found or expired' }, { status: 404 });
  }

  return NextResponse.json(cached);
}
