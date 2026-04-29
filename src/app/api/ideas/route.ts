import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pagination params
    const { searchParams } = new URL(request.url);
    const skip = Math.max(0, Number(searchParams.get('skip')) || 0);
    const take = Math.min(50, Math.max(1, Number(searchParams.get('take')) || 20));

    // Fetch user's ideas with pagination
    const ideas = await db.viralIdea.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        _count: {
          select: { analytics: true },
        },
      },
    });

    // Get total count for pagination
    const total = await db.viralIdea.count({
      where: { userId: user.userId },
    });

    return NextResponse.json({
      ideas,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch ideas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
