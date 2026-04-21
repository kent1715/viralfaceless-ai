import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'A positive numeric amount is required.' },
        { status: 400 }
      );
    }

    // Round to integer
    const creditAmount = Math.round(amount);

    // Check if user is admin (admins can add credits, users can only deduct)
    const currentUser = await db.user.findUnique({
      where: { id: auth.payload.userId },
      select: { id: true, credits: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Regular users can only deduct credits
    if (currentUser.role !== 'admin') {
      if (currentUser.credits < creditAmount) {
        return NextResponse.json(
          { error: `Insufficient credits. You have ${currentUser.credits} credits.` },
          { status: 402 }
        );
      }

      const updatedUser = await db.user.update({
        where: { id: auth.payload.userId },
        data: { credits: { decrement: creditAmount } },
        select: { id: true, credits: true },
      });

      return NextResponse.json({
        message: `${creditAmount} credit(s) deducted.`,
        credits: updatedUser.credits,
      });
    }

    // Admin can add credits
    const { targetUserId, action = 'deduct' } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId is required for admin operations.' },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, credits: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found.' },
        { status: 404 }
      );
    }

    if (action === 'add') {
      const updatedUser = await db.user.update({
        where: { id: targetUserId },
        data: { credits: { increment: creditAmount } },
        select: { id: true, credits: true },
      });

      return NextResponse.json({
        message: `${creditAmount} credit(s) added to ${targetUser.name}.`,
        credits: updatedUser.credits,
      });
    }

    // Default: deduct
    if (targetUser.credits < creditAmount) {
      return NextResponse.json(
        { error: `Target user has insufficient credits (${targetUser.credits}).` },
        { status: 402 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { credits: { decrement: creditAmount } },
      select: { id: true, credits: true },
    });

    return NextResponse.json({
      message: `${creditAmount} credit(s) deducted from ${targetUser.name}.`,
      credits: updatedUser.credits,
    });
  } catch (error: unknown) {
    console.error('Credit use error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
