import { GoogleGenAI } from "@google/genai";

// Vite only exposes env vars prefixed with VITE_
const apiKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  '';

// Safely initialize the client only when needed to avoid issues if key is missing during render
const getClient = () => {
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const getResponseText = (response: any) => {
  if (!response) return '';
  if (typeof response.text === 'function') return response.text();
  if (typeof response.text === 'string') return response.text;
  if (response.response?.text && typeof response.response.text === 'function') {
    return response.response.text();
  }
  if (typeof response.response?.text === 'string') return response.response.text;
  const firstPart = response.response?.candidates?.[0]?.content?.parts?.[0];
  if (firstPart?.text) return firstPart.text;
  const topCandidatePart = response.candidates?.[0]?.content?.parts?.[0];
  if (topCandidatePart?.text) return topCandidatePart.text;
  return '';
};

export const getCoachResponse = async (userMessage: string, context?: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Configuration Error: API Key missing.";

  try {
    const systemInstruction = `You are IronBot, an elite bodybuilding coach with the knowledge of legends like Arnold, scientific approach of Jeff Nippard, and intensity of CBUM.
Your goal is to help the user with workout advice, form tips (text-based), split recommendations, and recovery science.
Keep answers concise, direct, and motivating. No fluff. Use bodybuilding terminology correctly (e.g., hypertrophy, progressive overload, RPE, volume, frequency).`;

    const prompt = `${context || 'No active workout context.'}\n\nUser question: ${userMessage}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    });

    const text = getResponseText(response)?.trim();
    if (!text) {
      console.error("Gemini returned empty response", response);
      return "Train harder, I couldn't process that.";
    }
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the neural link. Check your connection.";
  }
};
