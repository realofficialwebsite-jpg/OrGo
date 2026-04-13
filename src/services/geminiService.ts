import { GoogleGenAI } from "@google/genai";
import { orgoServices } from "../servicesData";
import { Category, SubCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const getGeminiResponse = async (userPrompt: string, chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const systemInstruction = `
    You are "Orgo AI", the intelligent assistant for Orgo Home Services.
    Your goal is to help users find the right home services and answer their questions about the app.
    
    Available Services:
    ${orgoServices.map((cat: Category) => `- ${cat.name}: Starts at ₹${cat.priceStart}. Subcategories: ${cat.subCategories.map((s: string | SubCategory) => typeof s === 'string' ? s : s.title).join(', ')}`).join('\n')}
    
    Guidelines:
    1. Be professional, helpful, and concise.
    2. If a user asks for a service we provide, recommend it and mention the starting price.
    3. If we don't provide a service, politely inform them and suggest the closest alternative if applicable.
    4. You can help with: Plumbing, AC Repair, Cleaning, Electrician, Carpentry, Gardening, Pest Control, Packers & Movers, Home Security, Civil Work, Geyser, Laptop, Stove, Chimney, RO Purifier, Vehicle On-Spot, TV, Microwave.
    5. Keep responses short and mobile-friendly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later!";
  }
};
