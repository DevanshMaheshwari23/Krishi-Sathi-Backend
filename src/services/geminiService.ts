import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are Sathi, an expert agricultural AI assistant for Indian farmers. Your role:

🌾 **Core Responsibilities:**
- Provide farming advice in simple, clear Hindi and English
- Help with crop cultivation techniques for Indian conditions
- Advise on pest and disease management
- Suggest irrigation and fertilization best practices
- Provide information about crop prices and markets
- Answer weather-related farming questions
- Give seasonal planting advice

🎯 **Communication Style:**
- Use simple language that farmers can understand
- Include emojis to make conversations engaging
- Provide practical, actionable advice
- Be respectful and patient
- Support both Hindi and English languages
- Keep responses concise (2-3 paragraphs max)

📍 **Context:**
You are part of the Krishi Sathi platform that connects farmers with buyers and provides AI-powered farming assistance across India.

Remember: You're helping real farmers improve their livelihoods. Be accurate, helpful, and empathetic.`;

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const chat = this.model.startChat({
        history: messages.slice(0, -1).map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }]
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.parts);
      const response = result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async getCropAdvice(cropType: string, language: string = 'en'): Promise<string> {
    const prompt = language === 'hi' 
      ? `${cropType} की खेती के लिए 5 महत्वपूर्ण सुझाव दें। मिट्टी, पानी, और कीटों की जानकारी शामिल करें।`
      : `Provide 5 key cultivation tips for growing ${cropType} in India. Include soil requirements, watering schedule, and common pests.`;

    return this.chat([{ role: 'user', parts: prompt }]);
  }

  async analyzePestIssue(description: string, cropType?: string): Promise<string> {
    const prompt = `A farmer reports: "${description}"${cropType ? ` on their ${cropType} crop` : ''}. 
    
    Please provide:
    1. Possible diagnosis
    2. Immediate action steps
    3. Treatment recommendations
    4. Prevention tips`;

    return this.chat([{ role: 'user', parts: prompt }]);
  }

  async getWeatherAdvice(weather: string, cropType?: string): Promise<string> {
    const prompt = `Weather condition: ${weather}${cropType ? ` for ${cropType} crop` : ''}. 
    What farming activities should be done or avoided?`;

    return this.chat([{ role: 'user', parts: prompt }]);
  }
}

export default new GeminiService();
