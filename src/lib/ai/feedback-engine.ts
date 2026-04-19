import { huggingFaceComplete } from "./huggingface";
import { ollamaComplete } from "./ollama";

export interface GrammarFeedback {
  hasError: boolean;
  original: string;
  corrected: string;
  explanation: string;
  score: number; // 0-100
}

export interface VocabSuggestion {
  word: string;
  suggestion: string;
  naturalPhrasing: string;
}

export interface FeedbackResult {
  grammar: GrammarFeedback;
  vocabulary: VocabSuggestion[];
  fluencyScore: number;
  overallTip: string;
}

const FEEDBACK_SYSTEM_PROMPT = `
You are an expert English language analyst. Analyze the given user message and respond ONLY with valid JSON.
Never add explanation outside the JSON. Be concise and helpful.
`.trim();

const GRAMMAR_PROMPT = (text: string, level: string) => `
Analyze this English text for grammar errors: "${text}"
User level: ${level}

IMPORTANT: You must respond with ONLY valid JSON. No explanations outside the JSON.

{
  "hasError": true/false,
  "corrected": "corrected version or same if no error",
  "explanation": "brief explanation",
  "score": 0-100
}

Look for: subject-verb agreement, tense errors, article usage, preposition errors, word order.
`;

const VOCAB_PROMPT = (text: string, level: string) => `
Analyze this text for vocabulary improvement: "${text}"
User level: ${level}

IMPORTANT: You must respond with ONLY valid JSON. No explanations outside the JSON.

{
  "suggestions": [
    {
      "word": "word/phrase used",
      "suggestion": "better alternative",
      "naturalPhrasing": "example sentence"
    }
  ],
  "fluencyScore": 0-100,
  "overallTip": "one short tip"
}

Always provide 1-2 suggestions for better vocabulary.`;

export async function analyzeGrammar(
  text: string,
  userLevel: string = "INTERMEDIATE",
  aiProvider: string = "local",
): Promise<GrammarFeedback> {
  // Skip very short messages
  if (text.trim().split(" ").length < 3) {
    return {
      hasError: false,
      original: text,
      corrected: text,
      explanation: "",
      score: 100,
    };
  }

  try {
    console.log("🔍 Analyzing grammar for:", text);

    let response: string;
    try {
      response =
        aiProvider === "huggingface"
          ? await huggingFaceComplete(
              GRAMMAR_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            )
          : await ollamaComplete(
              GRAMMAR_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            );
    } catch (aiError) {
      console.log("⚠️ Primary AI failed, trying fallback:", aiError);
      // Fallback to the other provider
      response =
        aiProvider === "huggingface"
          ? await ollamaComplete(
              GRAMMAR_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            )
          : await huggingFaceComplete(
              GRAMMAR_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            );
    }

    console.log("📝 Grammar AI response:", response);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ No JSON found in grammar response");
      throw new Error("No JSON in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("✅ Parsed grammar feedback:", parsed);

    return {
      hasError: parsed.hasError ?? false,
      original: text,
      corrected: parsed.corrected ?? text,
      explanation: parsed.explanation ?? "",
      score: parsed.score ?? 80,
    };
  } catch (error) {
    console.error("❌ Grammar analysis failed:", error);
    return {
      hasError: false,
      original: text,
      corrected: text,
      explanation: "",
      score: 80,
    };
  }
}

export async function analyzeVocabulary(
  text: string,
  userLevel: string = "INTERMEDIATE",
  aiProvider: string = "local",
): Promise<{
  suggestions: VocabSuggestion[];
  fluencyScore: number;
  overallTip: string;
}> {
  if (text.trim().split(" ").length < 5) {
    return { suggestions: [], fluencyScore: 80, overallTip: "" };
  }

  try {
    console.log("🔍 Analyzing vocabulary for:", text);

    let response: string;
    try {
      response =
        aiProvider === "huggingface"
          ? await huggingFaceComplete(
              VOCAB_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            )
          : await ollamaComplete(
              VOCAB_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            );
    } catch (aiError) {
      console.log("⚠️ Primary AI failed, trying fallback:", aiError);
      // Fallback to the other provider
      response =
        aiProvider === "huggingface"
          ? await ollamaComplete(
              VOCAB_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            )
          : await huggingFaceComplete(
              VOCAB_PROMPT(text, userLevel),
              FEEDBACK_SYSTEM_PROMPT,
            );
    }

    console.log("📝 Vocabulary AI response:", response);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ No JSON found in vocabulary response");
      throw new Error("No JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("✅ Parsed vocabulary feedback:", parsed);

    return {
      suggestions: parsed.suggestions ?? [],
      fluencyScore: parsed.fluencyScore ?? 80,
      overallTip: parsed.overallTip ?? "",
    };
  } catch (error) {
    console.error("❌ Vocabulary analysis failed:", error);
    return { suggestions: [], fluencyScore: 80, overallTip: "" };
  }
}

export async function fullFeedbackAnalysis(
  text: string,
  userLevel: string = "INTERMEDIATE",
  aiProvider: string = "local",
): Promise<FeedbackResult> {
  const [grammar, vocab] = await Promise.all([
    analyzeGrammar(text, userLevel, aiProvider),
    analyzeVocabulary(text, userLevel, aiProvider),
  ]);

  return {
    grammar,
    vocabulary: vocab.suggestions,
    fluencyScore: vocab.fluencyScore,
    overallTip: vocab.overallTip,
  };
}
