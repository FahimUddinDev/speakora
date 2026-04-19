import { fullFeedbackAnalysis } from "@/lib/ai/feedback-engine";
import prisma from "@/lib/db/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      userLevel = "INTERMEDIATE",
      userId,
      saveToDb = true,
      aiProvider = "local",
    } = body;

    console.log('📨 Feedback API called with:', { text, userLevel, aiProvider });

    if (!text?.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const feedback = await fullFeedbackAnalysis(text, userLevel, aiProvider);

    console.log('📤 Feedback API returning:', feedback);

    // Persist mistakes if we have a user
    if (saveToDb && userId && feedback.grammar.hasError) {
      await prisma.mistake
        .create({
          data: {
            userId,
            sentence: text,
            correction: feedback.grammar.corrected,
            explanation: feedback.grammar.explanation,
          },
        })
        .catch(() => {});
    }

    // Persist vocabulary suggestions
    if (saveToDb && userId && feedback.vocabulary.length > 0) {
      await Promise.all(
        feedback.vocabulary.map((v) =>
          prisma.vocabulary
            .create({
              data: {
                userId,
                word: v.word,
                suggestion: v.suggestion,
                context: v.naturalPhrasing,
              },
            })
            .catch(() => {}),
        ),
      );
    }

    return Response.json({ feedback });
  } catch (error) {
    console.error("Feedback error:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
