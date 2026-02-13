import { Router } from 'express';
import {
  chat,
  textToSpeech,
  streamSpeech,
  getCropAdvice,
  analyzePest,
  getConversationHistory,
  getUserConversations,
  deleteConversation
} from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Chat endpoints
router.post('/chat', chat);
router.post('/text-to-speech', textToSpeech);
router.post('/stream-speech', streamSpeech);

// Quick actions
router.post('/crop-advice', getCropAdvice);
router.post('/analyze-pest', analyzePest);

// Conversation management
router.get('/conversations', getUserConversations);
router.get('/conversations/:conversationId', getConversationHistory);
router.delete('/conversations/:conversationId', deleteConversation);

export default router;
