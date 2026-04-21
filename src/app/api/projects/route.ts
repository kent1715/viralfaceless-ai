import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = { userId: auth.payload.userId };
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              ideas: true,
              scripts: true,
              videos: true,
              thumbnails: true,
              posts: true,
            },
          },
        },
      }),
      db.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Projects list error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { title, niche } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required.' },
        { status: 400 }
      );
    }

    const project = await db.project.create({
      data: {
        userId: auth.payload.userId,
        title,
        niche: niche || null,
        status: 'draft',
      },
    });

    return NextResponse.json(
      {
        message: 'Project created successfully.',
        project,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required.' },
        { status: 400 }
      );
    }

    // Verify ownership
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 }
      );
    }

    if (project.userId !== auth.payload.userId && auth.payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only delete your own projects.' },
        { status: 403 }
      );
    }

    // Delete project (cascade will handle related records)
    await db.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      message: 'Project deleted successfully.',
    });
  } catch (error: unknown) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
