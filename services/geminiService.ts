const GEMINI_API_KEY = 'AIzaSyCuiwrYTV2zV-pNkYysAU10WVFs-Vo3xhc';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export interface TradingSignal {
  action: 'CALL' | 'PUT' | 'WAIT';
  strength: number; // 0-100
  confidence: number; // 0-100
  reasons: string[];
  indicators: {
    rsi?: number;
    macd?: { value: number; signal: string };
    bb?: { position: string };
    trend?: string;
    stochastic?: number;
  };
}

export class GeminiService {
  
  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(`${API_BASE}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async getJarvisResponse(prompt: string, context: string) {
    try {
      const fullPrompt = `You are JARVIS, the neural network assistant for AITE. Your voice is sophisticated, British, and analytical. Current context: ${context}. Analyze user performance, psychology, and market regimes. Provide actionable trading advice.\n\nUser: ${prompt}`;
      
      return await this.callGemini(fullPrompt) || "I'm sorry, Sir, I'm having trouble processing that request.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sir, my neural processors are experiencing an interruption.";
    }
  }

  async predictMarketMovement(symbol: string, candleData: any[]) {
    try {
      if (!candleData || candleData.length === 0) return "Insufficient market data for analysis.";
      
      const recentData = candleData.slice(-30).map(c => ({
        o: c.open?.toFixed(5),
        h: c.high?.toFixed(5),
        l: c.low?.toFixed(5),
        c: c.close?.toFixed(5)
      }));
      
      const prompt = `You are JARVIS, an elite AI trading analyst. Analyze ${symbol} market data concisely.

Recent OHLC: ${JSON.stringify(recentData)}

Provide a brief professional analysis (max 200 words):
• Market Structure: Bullish/Bearish/Ranging
• Key Levels: Support & Resistance zones
• Bias: Direction with confidence %
• Trade Setup: Entry, SL, TP if applicable

Address the trader as "Sir". Be direct and actionable.`;
      
      return await this.callGemini(prompt) || "Insufficient data for analysis, Sir.";
    } catch (e: any) {
      console.error("Gemini Prediction Error:", e);
      return `Analysis failure in the neural core. Error: ${e.message || 'Connection error.'}`;
    }
  }

  async analyzeChartData(data: any[]): Promise<Array<{label: string, index: number, type: string}>> {
    try {
      if (!data || data.length === 0) {
        console.log("No data provided for analysis");
        return [];
      }
      
      const dataLength = Math.min(data.length, 50);
      const recentData = data.slice(-dataLength).map((c, i) => ({
        i,
        o: Number(c.open).toFixed(4),
        h: Number(c.high).toFixed(4),
        l: Number(c.low).toFixed(4),
        c: Number(c.close).toFixed(4)
      }));
      
      const prompt = `You are an expert ICT/SMC trader analyzing price action. Perform deep market structure analysis.

Price Data (last ${dataLength} candles):
${JSON.stringify(recentData)}

ANALYSIS REQUIREMENTS:

1. MARKET STRUCTURE:
   - Identify Higher Highs (HH) and Higher Lows (HL) = BULLISH trend
   - Identify Lower Highs (LH) and Lower Lows (LL) = BEARISH trend
   - Find Break of Structure (BOS) points where trend changes
   - Mark Change of Character (ChoCH) if present

2. KEY LEVELS:
   - Swing Highs (SH): Strong resistance peaks
   - Swing Lows (SL): Strong support troughs
   - Order Blocks (OB): Last up-candle before down-move or last down-candle before up-move
   - Fair Value Gaps (FVG): Gaps between candles

3. TRADE SETUPS:
   - Mark LONG entries at support/demand zones in uptrend
   - Mark SHORT entries at resistance/supply zones in downtrend
   - Identify optimal entry points based on structure

4. CURRENT BIAS:
   Determine if market is:
   - BULLISH (uptrend) = recommend LONG entries
   - BEARISH (downtrend) = recommend SHORT entries
   - RANGING = mark both support and resistance

RETURN FORMAT (JSON array ONLY, no explanation):
[{"label":"HH","index":47,"type":"resistance"},{"label":"HL","index":42,"type":"support"},{"label":"BOS↑","index":45,"type":"structure"},{"label":"LONG","index":48,"type":"entry"}]

LABEL OPTIONS:
- Structure: "HH", "HL", "LH", "LL", "BOS↑", "BOS↓", "ChoCH"
- Levels: "SH", "SL", "OB", "FVG"
- Entries: "LONG", "SHORT"

TYPE OPTIONS:
- "resistance" (red): Swing highs, supply zones, short entries
- "support" (green): Swing lows, demand zones, long entries  
- "structure" (purple): BOS, ChoCH, structure breaks
- "entry" (amber): Specific entry points

RULES:
- Return 6-12 annotations
- Index range: 0 to ${dataLength - 1}
- MUST identify market bias and provide entry signals
- Return ONLY valid JSON array, no markdown, no text`;
      
      console.log("Calling Gemini for annotations...");
      const text = await this.callGemini(prompt);
      console.log("Gemini raw response:", text);
      
      // Extract JSON array from response
      let jsonStr = text.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Find array pattern
      const arrayMatch = jsonStr.match(/\[[\s\S]*?\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
      
      console.log("Cleaned JSON:", jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      console.log("Parsed annotations:", parsed);
      
      // Validate and filter
      const validated = parsed.filter((ann: any) => 
        ann && 
        typeof ann.label === 'string' && 
        typeof ann.index === 'number' && 
        ann.index >= 0 && 
        ann.index < dataLength
      );
      
      console.log("Validated annotations:", validated);
      return validated;
      
    } catch (e: any) {
      console.error("Gemini Chart Analysis Error:", e);
      console.error("Error details:", e.message);
      return [];
    }
  }

  async getMarketSentiment(newsHeadlines: string[]) {
    try {
      const prompt = `Return a JSON object with currency keys and 'score', 'label' (Bullish/Bearish), and 'reason' as properties.

Analyze these headlines and give a sentiment score from -100 to 100 for EUR, USD, GBP, and JPY: ${newsHeadlines.join(". ")}`;
      
      const text = await this.callGemini(prompt);
      return JSON.parse(text || "{}");
    } catch (e) {
      console.error("Gemini Sentiment Error:", e);
      return {};
    }
  }

  async refineBotStrategy(strategy: any): Promise<any> {
    try {
      const prompt = `You are an expert quantitative trader. Analyze and refine this trading bot strategy for optimal performance.

Current Strategy:
- Name: ${strategy.name}
- Symbol: ${strategy.symbol}
- Contract Type: ${strategy.contractType}
- Duration: ${strategy.duration} ${strategy.durationUnit}
- Stake: $${strategy.amount}
- Martingale: ${strategy.martingale ? 'Yes (' + strategy.martingaleMultiplier + 'x)' : 'No'}
- Take Profit: ${strategy.takeProfit}%
- Stop Loss: ${strategy.stopLoss}%
- Max Trades: ${strategy.maxTrades}

PROVIDE PROFESSIONAL REFINEMENTS:

1. RISK MANAGEMENT:
   - Optimize stake size based on Kelly Criterion
   - Suggest proper stop loss and take profit levels
   - Assess martingale risk (should it be enabled?)

2. TIMING:
   - Recommend optimal duration for the symbol
   - Suggest best trading times/sessions

3. CONTRACT TYPE:
   - Is ${strategy.contractType} optimal for ${strategy.symbol}?
   - Alternative contract types to consider

4. OVERALL STRATEGY:
   - Win rate expectations
   - Risk-reward ratio
   - Recommended improvements

Return response as JSON:
{
  "optimizedStake": number,
  "optimizedDuration": number,
  "optimizedDurationUnit": string,
  "recommendedContractType": string,
  "martingaleAdvice": "enable" | "disable" | "keep",
  "stopLoss": number,
  "takeProfit": number,
  "expectedWinRate": number,
  "riskLevel": "low" | "medium" | "high",
  "improvements": ["improvement 1", "improvement 2", ...],
  "reasoning": "Brief explanation of changes"
}`;

      const text = await this.callGemini(prompt);
      
      // Extract JSON
      let jsonStr = text.trim();
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      const objMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
      
      return JSON.parse(jsonStr);
    } catch (e: any) {
      console.error("Gemini Strategy Refinement Error:", e);
      throw new Error('Failed to refine strategy: ' + e.message);
    }
  }

  async createBotFromDescription(description: string): Promise<any> {
    try {
      const prompt = `You are a trading bot configuration expert. Convert this natural language description into a complete bot strategy.

User Request: "${description}"

Create a profitable trading bot configuration. Return as JSON:
{
  "name": "Strategy Name (descriptive)",
  "description": "Brief strategy description",
  "symbol": "R_100" (or R_50, R_25, R_10, VOLATILITY_10, etc),
  "contractType": "CALL" | "PUT" | "DIGITEVEN" | "DIGITODD",
  "duration": number (1-60 for minutes, 1-24 for hours),
  "durationUnit": "m" | "t" | "s" | "h",
  "amount": number (0.35-100, recommend starting small),
  "martingale": boolean (use cautiously),
  "martingaleMultiplier": number (2-3 max if enabled),
  "maxMartingaleSteps": number (2-4 max),
  "takeProfit": number (10-100 percent),
  "stopLoss": number (10-50 percent),
  "maxTrades": number (10-1000)
}

GUIDELINES:
- For aggressive/risky: Higher stakes, martingale enabled, shorter durations
- For conservative/safe: Lower stakes, no martingale, longer durations  
- For scalping: Short durations (1-5 ticks or 1m), quick exits
- For swing: Longer durations (5m-1h), wider stops
- Match contract type to strategy (CALL/PUT for trends, DIGIT for ranging)
- Volatility indices (R_10, R_25, R_50, R_100) are good for beginners

Return ONLY valid JSON, no explanation.`;

      const text = await this.callGemini(prompt);
      
      // Extract JSON
      let jsonStr = text.trim();
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      const objMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
      
      const config = JSON.parse(jsonStr);
      
      // Add required fields
      return {
        ...config,
        id: `bot-${Date.now()}`,
        totalTrades: 0,
        pnl: 0,
        active: false
      };
    } catch (e: any) {
      console.error("Gemini createBotStrategy Error:", e);
      throw new Error(`Strategy creation failed: ${e.message || 'Unknown error'}`);
    }
  }

  /**
   * Scan market for trading opportunities using technical indicators
   */
  async scanMarketOpportunities(candleData: any[], technicalData: {
    rsi?: number[];
    macd?: { macdLine: number[]; signalLine: number[]; histogram: number[] };
    bb?: { middleBand: number[]; upperBand: number[]; lowerBand: number[] };
    stochastic?: { k: number[]; d: number[] };
    ema?: number[];
    sma?: number[];
  }): Promise<TradingSignal> {
    try {
      if (!candleData || candleData.length < 20) {
        return {
          action: 'WAIT',
          strength: 0,
          confidence: 0,
          reasons: ['Insufficient data'],
          indicators: {}
        };
      }

      const lastCandle = candleData[candleData.length - 1];
      const lastRSI = technicalData.rsi?.[technicalData.rsi.length - 1];
      const lastMACD = technicalData.macd?.macdLine[technicalData.macd.macdLine.length - 1];
      const lastSignal = technicalData.macd?.signalLine[technicalData.macd.signalLine.length - 1];
      const lastStoch = technicalData.stochastic?.k[technicalData.stochastic.k.length - 1];
      const lastBBUpper = technicalData.bb?.upperBand[technicalData.bb.upperBand.length - 1];
      const lastBBLower = technicalData.bb?.lowerBand[technicalData.bb.lowerBand.length - 1];
      const lastBBMiddle = technicalData.bb?.middleBand[technicalData.bb.middleBand.length - 1];

      const recentCandles = candleData.slice(-10).map(c => ({
        o: Number(c.open).toFixed(5),
        h: Number(c.high).toFixed(5),
        l: Number(c.low).toFixed(5),
        c: Number(c.close).toFixed(5)
      }));

      const prompt = `You are JARVIS, an elite algorithmic trading AI. Analyze this market data and provide a precise trading signal.

CURRENT MARKET DATA:
Recent Candles: ${JSON.stringify(recentCandles)}
RSI (14): ${lastRSI?.toFixed(2) || 'N/A'}
MACD: ${lastMACD?.toFixed(5) || 'N/A'} | Signal: ${lastSignal?.toFixed(5) || 'N/A'}
Stochastic: ${lastStoch?.toFixed(2) || 'N/A'}
Bollinger Bands: Upper ${lastBBUpper?.toFixed(5) || 'N/A'}, Middle ${lastBBMiddle?.toFixed(5) || 'N/A'}, Lower ${lastBBLower?.toFixed(5) || 'N/A'}
Current Price: ${lastCandle.close?.toFixed(5)}

ANALYSIS RULES:
1. RSI < 30 = Oversold (potential CALL), RSI > 70 = Overbought (potential PUT)
2. MACD crossing above signal = Bullish (CALL), crossing below = Bearish (PUT)
3. Price near BB lower = potential CALL, near BB upper = potential PUT
4. Stochastic < 20 = oversold (CALL bias), > 80 = overbought (PUT bias)
5. Multiple aligned indicators = higher strength/confidence

Return JSON ONLY (no markdown):
{
  "action": "CALL" | "PUT" | "WAIT",
  "strength": 0-100,
  "confidence": 0-100,
  "reasons": ["reason1", "reason2", ...],
  "indicators": {
    "rsi": ${lastRSI?.toFixed(2) || 'null'},
    "macd": {"value": ${lastMACD?.toFixed(5) || 'null'}, "signal": "BULLISH|BEARISH|NEUTRAL"},
    "bb": {"position": "LOWER|MIDDLE|UPPER"},
    "trend": "BULLISH|BEARISH|RANGING",
    "stochastic": ${lastStoch?.toFixed(2) || 'null'}
  }
}`;

      const response = await this.callGemini(prompt);
      
      // Parse AI response
      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      const objMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }

      const signal = JSON.parse(jsonStr);
      
      // Validate and return
      return {
        action: signal.action || 'WAIT',
        strength: Math.min(Math.max(signal.strength || 0, 0), 100),
        confidence: Math.min(Math.max(signal.confidence || 0, 0), 100),
        reasons: signal.reasons || [],
        indicators: signal.indicators || {}
      };

    } catch (e: any) {
      console.error("Gemini scanMarketOpportunities Error:", e);
      return {
        action: 'WAIT',
        strength: 0,
        confidence: 0,
        reasons: ['AI analysis failed: ' + (e.message || 'Unknown error')],
        indicators: {}
      };
    }
  }
}

export const jarvis = new GeminiService();
