
import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysisResult } from '../types';

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<AIAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error('API Key is missing. Please set the API_KEY environment variable.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prompt designed for image metadata utility
  const prompt = `Analyze this image for a file management system. 
  1. Provide a concise, descriptive Alt Text (max 20 words).
  2. Provide 3-5 relevant keywords/tags.
  3. Suggest a clean, SEO-friendly filename (in kebab-case, without extension).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            altText: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedFilename: { type: Type.STRING }
          },
          required: ['altText', 'tags', 'suggestedFilename']
        }
      }
    });

    // Access .text property directly (not a method)
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean potential markdown formatting if the model adds it
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    return JSON.parse(jsonStr) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image with AI.");
  }
};
