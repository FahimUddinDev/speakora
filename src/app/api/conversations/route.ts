import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ conversations: [] });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });

    return Response.json({ conversations });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const body = await req.json();
    const { type = 'CHAT', scenario } = body;

    // Use guest user if not authenticated
    const effectiveUserId = userId || await getOrCreateGuestUser();

    const conversation = await prisma.conversation.create({
      data: {
        userId: effectiveUserId,
        type,
        scenario,
      },
    });

    return Response.json({ conversation });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

async function getOrCreateGuestUser(): Promise<string> {
  let guest = await prisma.user.findFirst({ where: { email: 'guest@speakora.local' } });
  if (!guest) {
    guest = await prisma.user.create({
      data: {
        name: 'Guest',
        email: 'guest@speakora.local',
        level: 'BEGINNER',
      },
    });
  }
  return guest.id;
}
