import { NextRequest, NextResponse } from 'next/server';
import { listSubflavors } from '@/lib/subflavors-store';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const flavorId = req.nextUrl.searchParams.get('flavorId');
  if (!userId || !flavorId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  const subs = await listSubflavors(userId, flavorId);
  return NextResponse.json(subs);
}
