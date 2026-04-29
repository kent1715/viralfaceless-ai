import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// ============================================
// POST — Create Analytics Record
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ideaId,
      platform,
      ctr = 0,
      retention = 0,
      watchTime = 0,
      likes = 0,
      shares = 0,
      comments = 0,
      views = 0,
    } = body;

    // Validate required fields
    if (!ideaId || !platform) {
      return NextResponse.json(
        { error: 'ideaId and platform are required' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ['tiktok', 'youtube', 'instagram', 'twitter'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify idea ownership
    const idea = await db.viralIdea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    if (idea.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You do not own this idea' },
        { status: 403 }
      );
    }

    // Create analytics record
    const analytics = await db.viralAnalytics.create({
      data: {
        ideaId,
        userId: user.userId,
        platform,
        ctr: Number(ctr) || 0,
        retention: Number(retention) || 0,
        watchTime: Number(watchTime) || 0,
        likes: Number(likes) || 0,
        shares: Number(shares) || 0,
        comments: Number(comments) || 0,
        views: Number(views) || 0,
      },
    });

    return NextResponse.json({ analytics }, { status: 201 });
  } catch (error) {
    console.error('Create analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// GET — Fetch Analytics Records
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || undefined;
    const ideaId = searchParams.get('ideaId') || undefined;
    const skip = Math.max(0, Number(searchParams.get('skip')) || 0);
    const take = Math.min(50, Math.max(1, Number(searchParams.get('take')) || 20));

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      userId: user.userId,
    };

    if (platform) {
      where.platform = platform;
    }

    if (ideaId) {
      where.ideaId = ideaId;
    }

    // Fetch analytics
    const analytics = await db.viralAnalytics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            niche: true,
          },
        },
      },
    });

    // Get total count
    const total = await db.viralAnalytics.count({ where });

    return NextResponse.json({
      analytics,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
