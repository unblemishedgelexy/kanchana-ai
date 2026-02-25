import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://kanchana-ai-backend.onrender.com/api';

export function GET(request: NextRequest) {
  const normalizedBase = String(API_BASE_URL).replace(/\/+$/, '');
  const targetUrl = `${normalizedBase}/auth/google/callback${request.nextUrl.search}`;
  return NextResponse.redirect(targetUrl);
}
