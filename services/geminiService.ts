
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getJarvisResponse(prompt: string, context: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are JARVIS, the neural network assistant for AITE. 
          Your voice is sophisticated, British, and analytical. 
          Current context: ${context}.
          Analyze user performance, psychology, and market regimes. Provide actionable trading advice. Maintain the JARVIS persona at all times.`,
          temperature: 0.7,
        },
      });
      return response.text || "I'm sorry, Sir, I'm having trouble processing that request.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sir, my neural processors are experiencing an interruption.";
    }
  }

  async predictMarketMovement(symbol: string, candleData: any[]) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Analyze the last 100 candles for ${symbol}: ${JSON.stringify(candleData.slice(-100))}. 
        Predict the next move (Bullish/Bearish/Neutral), state the confidence percentage, and identify key SMC levels (Order Blocks, FVG).`,
        config: {
          systemInstruction: "You are a professional quantitative analyst for high-frequency trading. Provide precise, technical analysis.",
        }
      });
      return response.text || "Insufficient data for a neural prediction, Sir.";
    } catch (e) {
      return "Analysis failure in the neural core.";
    }
  }

  async analyzeChartData(data: any[]) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this market data: ${JSON.stringify(data)}. 
        Provide 2-3 specific annotations for a chart (e.g., "Potential Resistance at X", "Bullish Divergence detected", "Optimal Long Entry").
        Return the result as a JSON array of objects with 'label' and 'index' (where index is the position in the data array).`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a professional SMC and Supply/Demand trader. Analyze numerical data trends accurately.",
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  }

  async getMarketSentiment(newsHeadlines: string[]) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these headlines and give a sentiment score from -100 to 100 for EUR, USD, GBP, and JPY: ${newsHeadlines.join(". ")}`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Return a JSON object with currency keys and 'score', 'label' (Bullish/Bearish), and 'reason' as properties.",
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  }
}

export const jarvis = new GeminiService();
