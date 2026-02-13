import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import geminiService from '../services/geminiService';
import elevenLabsService from '../services/elevenLabsService';
import ChatHistory from '../models/ChatHistory';

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationId, language = 'en' } = req.body;
    const userId = req.user?.userId;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    // Get or create conversation
    let conversation = conversationId 
      ? await ChatHistory.findOne({ 
          _id: conversationId, 
          userId: userId 
        })
      : null;

    if (!conversation && userId) {
      conversation = await ChatHistory.create({
        userId: userId,
        messages: [],
        language
      });
    }

    // Prepare message history for Gemini
    const messageHistory = [
      ...(conversation?.messages || []).slice(-10).map(msg => ({
        role: msg.role,
        parts: msg.parts
      })),
      { role: 'user' as const, parts: message }
    ];

    // Get AI response
    const aiResponse = await geminiService.chat(messageHistory);

    // Save to history
    if (conversation) {
      conversation.messages.push(
        { role: 'user', parts: message, timestamp: new Date() },
        { role: 'model', parts: aiResponse, timestamp: new Date() }
      );
      conversation.language = language;
      await conversation.save();
    }

    return res.json({
      success: true,
      response: aiResponse,
      conversationId: conversation?._id
    });
  } catch (error) {
    console.error('Chat error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
};

export const textToSpeech = async (req: AuthRequest, res: Response) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text is required' 
      });
    }

    // Check if ElevenLabs is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not configured');
      return res.status(503).json({
        success: false,
        message: 'Text-to-speech service not configured',
        code: 'SERVICE_NOT_CONFIGURED'
      });
    }

    // Generate speech
    const audioBuffer = await elevenLabsService.textToSpeech(text, language);

    // Send audio file
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Content-Disposition': 'inline; filename="speech.mp3"',
      'Cache-Control': 'no-cache'
    });

    return res.send(audioBuffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Text-to-speech error:', errorMessage);
    
    // Send appropriate status code based on error
    let statusCode = 503;
    let userMessage = 'Text-to-speech service temporarily unavailable';
    
    if (errorMessage.includes('authentication')) {
      statusCode = 401;
      userMessage = 'Voice service authentication failed';
    } else if (errorMessage.includes('rate limit')) {
      statusCode = 429;
      userMessage = 'Voice service rate limit exceeded';
    } else if (errorMessage.includes('quota')) {
      statusCode = 402;
      userMessage = 'Voice service quota exceeded';
    }
    
    return res.status(statusCode).json({
      success: false,
      message: userMessage,
      code: 'TTS_ERROR'
    });
  }
};

export const streamSpeech = async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text is required' 
      });
    }

    // Check if ElevenLabs is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Speech streaming service not configured'
      });
    }

    // Stream audio
    const audioStream = await elevenLabsService.streamTextToSpeech(text);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache'
    });

    audioStream.pipe(res);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Speech streaming error:', errorMessage);
    
    return res.status(503).json({
      success: false,
      message: 'Failed to stream speech'
    });
  }
};

export const getCropAdvice = async (req: AuthRequest, res: Response) => {
  try {
    const { cropType, language = 'en' } = req.body;

    if (!cropType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Crop type is required' 
      });
    }

    const advice = await geminiService.getCropAdvice(cropType, language);

    return res.json({
      success: true,
      advice
    });
  } catch (error) {
    console.error('Crop advice error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      message: 'Failed to get crop advice'
    });
  }
};

export const analyzePest = async (req: AuthRequest, res: Response) => {
  try {
    const { description, cropType } = req.body;

    if (!description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description is required' 
      });
    }

    const analysis = await geminiService.analyzePestIssue(description, cropType);

    return res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Pest analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze pest issue'
    });
  }
};

export const getConversationHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const conversation = await ChatHistory.findOne({
      _id: conversationId,
      userId: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.json({
      success: true,
      conversation: {
        id: conversation._id,
        messages: conversation.messages,
        language: conversation.language,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error('Get history error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      message: 'Failed to get conversation history'
    });
  }
};

export const getUserConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = '1', limit = '20' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const conversations = await ChatHistory.find({ 
      userId: userId 
    })
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('_id language createdAt updatedAt messages');

    const total = await ChatHistory.countDocuments({ 
      userId: userId 
    });

    const formattedConversations = conversations.map(conv => ({
      id: conv._id,
      language: conv.language,
      preview: conv.messages[0]?.parts.slice(0, 60) + '...' || 'New conversation',
      messageCount: conv.messages.length,
      lastMessage: conv.messages[conv.messages.length - 1]?.parts.slice(0, 100),
      createdAt: conv.createdAt,
      lastUpdated: conv.updatedAt
    }));

    return res.json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId || !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const result = await ChatHistory.findOneAndDelete({
      _id: conversationId,
      userId: userId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation'
    });
  }
};
