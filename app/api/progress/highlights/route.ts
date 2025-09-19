import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureUser } from '@/lib/users';
import {
  saveReportHighlight,
  deleteReportHighlight,
  type ReportHighlightType,
} from '@/lib/report-highlights';
import { revalidatePath } from 'next/cache';

const REPORT_TYPES: ReportHighlightType[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

function revalidateReportPages(reportType: ReportHighlightType) {
  const base = `/progress/overview/${reportType}`;
  const paths = [
    base,
    `${base}/highlights`,
    `/view/[viewId]/progress/overview/${reportType}`,
    `/view/[viewId]/progress/overview/${reportType}/highlights`,
  ];
  for (const path of paths) {
    revalidatePath(path);
  }
}

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
    revalidateReportPages(reportType as ReportHighlightType);
    return NextResponse.json({ highlight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save highlight';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await ensureUser(session);
  const idParam = req.nextUrl.searchParams.get('id');
  if (!idParam) {
    return NextResponse.json({ error: 'Highlight id is required' }, { status: 400 });
  }
  const highlightId = Number(idParam);
  if (!Number.isFinite(highlightId)) {
    return NextResponse.json({ error: 'Invalid highlight id' }, { status: 400 });
  }
  try {
    const highlight = await deleteReportHighlight(user.id, highlightId);
    revalidateReportPages(highlight.reportType);
    return NextResponse.json({ highlight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete highlight';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
