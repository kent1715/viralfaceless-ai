import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    // Verify admin role
    if (auth.payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // Gather stats in parallel
    const [
      totalUsers,
      totalRevenue,
      totalProjects,
      activeProjects,
      totalVideos,
      totalScripts,
      totalIdeas,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.payment.aggregate({
        where: { status: 'success' },
        _sum: { amount: true },
      }),
      db.project.count(),
      db.project.count({ where: { status: { in: ['generating', 'completed'] } } }),
      db.video.count(),
      db.script.count(),
      db.idea.count(),
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, plan: true, credits: true, createdAt: true },
      }),
    ]);

    // Content generated = ideas + scripts + videos + thumbnails
    const contentGenerated = totalIdeas + totalScripts + totalVideos;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalProjects,
        activeProjects,
        totalVideos,
        totalScripts,
        totalIdeas,
        contentGenerated,
        recentUsers,
      },
    });
  } catch (error: unknown) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
