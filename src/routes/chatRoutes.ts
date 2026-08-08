import express from 'express';
import { chat, getCropAdvice, analyzePest, textToSpeech } from '../controllers/chatController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// These routes become:
// POST /api/v1/chat/chat
// POST /api/v1/chat/crop-advice
// POST /api/v1/chat/analyze-pest
// POST /api/v1/chat/text-to-speech

router.post('/chat', authMiddleware, chat);
router.post('/crop-advice', authMiddleware, getCropAdvice);
router.post('/analyze-pest', authMiddleware, analyzePest);
router.post('/text-to-speech', authMiddleware, textToSpeech);

export default router;
