import express from 'express';
import { chat, getCropAdvice, analyzePest, textToSpeech } from '../controllers/chatController';
import { auth } from '../middleware/auth';

const router = express.Router();

// These routes become:
// POST /api/v1/chat/chat
// POST /api/v1/chat/crop-advice
// POST /api/v1/chat/analyze-pest
// POST /api/v1/chat/text-to-speech

router.post('/chat', auth, chat);
router.post('/crop-advice', auth, getCropAdvice);
router.post('/analyze-pest', auth, analyzePest);
router.post('/text-to-speech', auth, textToSpeech);

export default router;
