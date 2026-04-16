import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface QuizSettings {
  difficulty: string;
  questionCount: number;
  quizType: string;
}

export async function generateQuiz(content: string, settings?: QuizSettings) {
  const difficultyStr = settings?.difficulty || "Medium";
  const count = settings?.questionCount || 10;
  const typeStr = settings?.quizType || "Mixed";
  
  let typePrompt = "a mix of multiple choice, true/false, and fill-in-the-blank questions";
  if (typeStr === "Multiple Choice") typePrompt = "all multiple choice questions";
  if (typeStr === "True/False") typePrompt = "all true/false questions";

  const prompt = `Generate a ${difficultyStr.toLowerCase()} difficulty quiz with ${count} questions. The format should be ${typePrompt}. Base the questions strictly on the following content: \n\n${content}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["mcq", "true-false", "fill-in-the-blank"] }
              },
              required: ["question", "correctAnswer", "type"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini quiz JSON:", response.text);
    throw new Error("AI failed to output a valid quiz structure. Please try again or provide a simpler text.");
  }
}

export async function generateFlashcards(content: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract 10 key concepts and definitions from the following content and format them as flashcards: \n\n${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ["front", "back"]
            }
          }
        },
        required: ["title", "cards"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini flashcards JSON:", response.text);
    throw new Error("AI failed to output a valid flashcard structure. Please try again or provide a simpler text.");
  }
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function chatWithGemini(
  message: string,
  history: ChatMessage[],
  contextText?: string | null
): Promise<string> {
  const systemInstruction = contextText
    ? `You are StudyBuddy AI, a friendly and encouraging study assistant.
The user is currently studying the following document — use it as your primary knowledge source when answering:

---DOCUMENT START---
${contextText}
---DOCUMENT END---

Guidelines:
- Ground your answers in the document above whenever the question is relevant to it.
- If the user asks something not covered by the document, answer from general knowledge but note that it is outside the document.
- Keep responses clear, concise, and encouraging.
- Use markdown formatting (bullet points, bold, etc.) to improve readability.
- Remember the full conversation history and refer back to earlier messages when needed.`
    : `You are StudyBuddy AI, a friendly and encouraging educational assistant.
Help the user study by answering their questions clearly and concisely.
Use markdown formatting (bullet points, bold, etc.) to improve readability.
Keep responses encouraging and educational.`;

  // Build history in the format expected by the SDK
  const sdkHistory = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const chat = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    config: { systemInstruction },
    history: sdkHistory,
  });

  const response = await chat.sendMessage({ message });
  return response.text ?? "";
}
