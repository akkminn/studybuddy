import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateQuiz(content: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a quiz with 5 multiple choice questions, 3 true/false questions, and 2 fill-in-the-blank questions based on the following content: \n\n${content}`,
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

export async function chatWithGemini(message: string, history: { role: string, parts: { text: string }[] }[]) {
  const chat = ai.chats.create({
    //Gemini 3.1 Flash Lite
    model: "gemini-2.5-flash-lite",
    config: {
      systemInstruction: "You are StudyBuddy AI, a helpful educational assistant. Answer questions based on the user's study materials or general knowledge. Keep responses concise and encouraging.",
    },
    // history: history // The SDK might not support history directly in create, check sendMessage
  });

  // For simplicity in this first version, we'll just send the message
  const response = await chat.sendMessage({ message });
  return response.text;
}
