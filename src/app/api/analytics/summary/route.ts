import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }

  const [
    totalConversations,
    mistakes,
    vocabulary,
    recentMessages,
  ] = await Promise.all([
    prisma.conversation.count({ where: { userId } }),
    prisma.mistake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.vocabulary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.message.findMany({
      where: {
        conversation: { userId },
        role: 'USER',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  // Daily conversations count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyConversations = await prisma.conversation.groupBy({
    by: ['createdAt'],
    where: { userId, createdAt: { gte: sevenDaysAgo } },
    _count: true,
  });

  return Response.json({
    totalConversations,
    totalMistakes: mistakes.length,
    totalVocab: vocabulary.length,
    mistakes: mistakes.slice(0, 10),
    vocabulary: vocabulary.slice(0, 10),
    dailyConversations,
    totalMessages: recentMessages.length,
  });
}
