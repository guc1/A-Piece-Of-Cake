import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import {
  saveReportHighlight,
  type ReportHighlightType,
} from '@/lib/report-highlights';

const REPORT_TYPES: ReportHighlightType[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await ensureUser(session);
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const {
    reportType,
    targetSlug,
    blockId,
    startOffset,
    endOffset,
    color,
    snippet,
  } = body as Record<string, unknown>;

  if (!REPORT_TYPES.includes(reportType as ReportHighlightType)) {
    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  }

  try {
    const highlight = await saveReportHighlight(user.id, {
      reportType: reportType as ReportHighlightType,
      targetSlug: String(targetSlug ?? ''),
      blockId: String(blockId ?? ''),
      startOffset: Number(startOffset ?? 0),
      endOffset: Number(endOffset ?? 0),
      color: String(color ?? ''),
      snippet: String(snippet ?? ''),
    });
    return NextResponse.json({ highlight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save highlight';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
