import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const response = `Echo: ${message}`;
  return NextResponse.json({ response });
}
