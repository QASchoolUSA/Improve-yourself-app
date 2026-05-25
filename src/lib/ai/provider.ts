import { GoogleGenerativeAI } from "@google/generative-ai";

export type AiCallInput = {
  prompt: string;
  system?: string;
  history?: { role: "user" | "model"; text: string }[];
  json?: boolean;
};

export type AiProvider = {
  name: string;
  generate: (input: AiCallInput) => Promise<string>;
};

export function getProvider(apiKey: string | undefined, modelName?: string): AiProvider {
  if (!apiKey) {
    return {
      name: "none",
      generate: async () => {
        throw new Error(
          "No AI API key configured. Add GEMINI_API_KEY to your environment."
        );
      },
    };
  }
  const client = new GoogleGenerativeAI(apiKey);
  const model = modelName || "gemini-2.0-flash";
  return {
    name: `gemini:${model}`,
    generate: async ({ prompt, system, history, json }) => {
      const m = client.getGenerativeModel({
        model,
        systemInstruction: system,
        generationConfig: json
          ? { responseMimeType: "application/json", temperature: 0.7 }
          : { temperature: 0.8 },
      });
      const chat = m.startChat({
        history:
          history?.map((h) => ({ role: h.role, parts: [{ text: h.text }] })) ?? [],
      });
      const res = await chat.sendMessage(prompt);
      return res.response.text();
    },
  };
}

export function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]) as T;
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
