import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const user = await db.user.findUnique({
      where: { id: auth.payload.userId },
      select: { id: true, credits: true, plan: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: user.id,
      credits: user.credits,
      plan: user.plan,
    });
  } catch (error: unknown) {
    console.error('Credit balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
