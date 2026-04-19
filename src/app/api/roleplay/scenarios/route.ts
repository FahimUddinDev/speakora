import { ROLEPLAY_SCENARIOS } from '@/lib/roleplay/scenarios';

export async function GET() {
  return Response.json({ scenarios: ROLEPLAY_SCENARIOS });
}
