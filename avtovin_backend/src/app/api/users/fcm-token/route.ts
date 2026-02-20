import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { fcmToken } = await request.json();
    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'fcmToken обязателен' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { fcmToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('FCM token update error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
