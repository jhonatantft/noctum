import { GoogleGenerativeAI } from "@google/generative-ai";

export type MeetingMode = 'general' | 'sales' | 'pitch' | 'interview';

export interface AIInsight {
  id: string;
  type: 'question' | 'strategy' | 'argument' | 'objection' | 'reply';
  content: string;
  timestamp: string;
}

const PROMPTS: Record<MeetingMode, string> = {
  general: `
    You are an expert strategic advisor. Your goal is to make the user look like a genius.
    
    DO NOT summarize the conversation. DO NOT extract basic facts or action items.
    
    Analyze the transcript and generate ONLY:
    1. "strategy": Deep strategic implications, hidden risks, or "connecting the dots" that others might miss.
    2. "question": A smart, probing question the user can ask to drive the conversation forward or uncover issues.
  `,
  sales: `
    You are a world-class Sales Coach. Your goal is to help the user close the deal.
    
    DO NOT summarize. Focus on winning the negotiation.
    
    Analyze the transcript for:
    1. "objection": Identify hidden customer hesitation or objections (price, timing, competitors).
    2. "reply": Suggest a persuasive, data-backed response to the objection.
    3. "argument": A key selling point or value proposition to mention now.
    4. "question": A closing question or needs-discovery question.
  `,
  pitch: `
    You are a Venture Capital Consultant. Help the user pitch their vision convincingly.
    
    DO NOT summarize. Focus on authority and vision.
    
    Analyze the transcript for:
    1. "strategy": Feedback on the narrative arc or business model clarity.
    2. "reply": How to answer tough investor questions with confidence and data.
    3. "argument": Evidence to back up claims (market size, traction).
    4. "question": Questions to ask investors to gauge interest/fit.
  `,
  interview: `
    You are an Executive Career Coach. Help the user ace this interview.
    
    DO NOT summarize. Focus on competence and leadership.
    
    Analyze the transcript for:
    1. "reply": Structure answers using the STAR method (Situation, Task, Action, Result).
    2. "strategy": Tips on body language (implied), tone, or pacing.
    3. "question": Intelligent questions to ask the interviewer about culture/role.
    4. "argument": Key strengths or experiences to highlight based on the context.
  `
};

const BASE_INSTRUCTION = `
  Return a JSON object with a key "insights" containing an array of objects with "type" and "content".
  Keep content concise, punchy, and actionable.
  If nothing relevant is found, return empty array.
`;

export const AIService = {
  analyzeTranscript: async (text: string, mode: MeetingMode = 'general'): Promise<AIInsight[]> => {
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_key');
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('anthropic_key');
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_key');
    const provider = localStorage.getItem('ai_provider') || 'openai';

    const systemPrompt = PROMPTS[mode] + BASE_INSTRUCTION;

    if (provider === 'anthropic') {
      if (anthropicKey) return await callAnthropic(text, anthropicKey, systemPrompt);
    } else if (provider === 'gemini') {
      if (geminiKey) return await callGemini(text, geminiKey, systemPrompt);
    } else {
      if (openAIKey) return await callOpenAI(text, openAIKey, systemPrompt);
    }

    console.warn("No API keys found for selected provider. Using mock fallback.");
    return mockAnalyze(text);
  },
  hasKey: (): boolean => {
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_key');
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('anthropic_key');
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_key');
    const provider = localStorage.getItem('ai_provider') || 'openai';
    
    if (provider === 'anthropic') return !!anthropicKey;
    if (provider === 'gemini') return !!geminiKey;
    return !!openAIKey;
  }
};

async function callGemini(text: string, apiKey: string, systemPrompt: string): Promise<AIInsight[]> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      ${systemPrompt}
      
      Transcript:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Clean up markdown code blocks if present
    const cleanJson = textResponse.replace(/```json\n?|\n?```/g, '').trim();
    const content = JSON.parse(cleanJson);

    return content.insights.map((item: any) => ({
      id: Date.now().toString() + Math.random().toString(),
      type: item.type,
      content: item.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

  } catch (e) {
    console.error("Gemini Call Failed", e);
    return [];
  }
}

async function callAnthropic(text: string, apiKey: string, systemPrompt: string): Promise<AIInsight[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: text }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API Error Body:', errorBody);
      throw new Error(`Anthropic API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const contentText = data.content[0].text;
    const content = JSON.parse(contentText);
    
    return content.insights.map((item: any) => ({
      id: Date.now().toString() + Math.random().toString(),
      type: item.type,
      content: item.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

  } catch (e) {
    console.error("Anthropic Call Failed", e);
    return [];
  }
}

async function callOpenAI(text: string, apiKey: string, systemPrompt: string): Promise<AIInsight[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API Error Body:', errorBody);
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    return content.insights.map((item: any) => ({
      id: Date.now().toString() + Math.random().toString(),
      type: item.type,
      content: item.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

  } catch (e) {
    console.error("OpenAI Call Failed", e);
    return [];
  }
}

// Fallback for when no keys are present
const mockAnalyze = async (text: string): Promise<AIInsight[]> => {
  return [
    {
      id: '1',
      type: 'strategy',
      content: "Strategic opportunity: Leverage the API integration to reduce time-to-market.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: '2',
      type: 'question',
      content: "Ask: 'How does this timeline affect the Q3 deliverables?'",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
};

