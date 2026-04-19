import { NextRequest } from 'next/server';
import { getScenarioById } from '@/lib/roleplay/scenarios';
import prisma from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, userId } = body;

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return Response.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Get or create user
    const effectiveUserId = userId || await getOrCreateGuestUser();

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: effectiveUserId,
        type: 'ROLEPLAY',
        scenario: scenarioId,
      },
    });

    return Response.json({ conversation, scenario });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to start roleplay' }, { status: 500 });
  }
}

async function getOrCreateGuestUser(): Promise<string> {
  let guest = await prisma.user.findFirst({ where: { email: 'guest@speakora.local' } });
  if (!guest) {
    guest = await prisma.user.create({
      data: { name: 'Guest', email: 'guest@speakora.local', level: 'BEGINNER' },
    });
  }
  return guest.id;
}
