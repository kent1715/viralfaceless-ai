import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { amount, method, userId } = body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'A positive numeric amount is required.' },
        { status: 400 }
      );
    }

    const validMethods = ['qris', 'bank_transfer', 'ewallet'];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine target user (admin can create for other users)
    const targetUserId = userId || auth.payload.userId;

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Only admin can create payments for other users
    if (userId && auth.payload.userId !== userId && auth.payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only create payments for your own account.' },
        { status: 403 }
      );
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: targetUserId,
        amount: Number(amount),
        method,
        creditsAdded: 0, // Credits added after payment confirmation
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        message: 'Payment record created successfully.',
        payment,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
