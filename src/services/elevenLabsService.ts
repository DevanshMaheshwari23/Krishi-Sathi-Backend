import axios from 'axios';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (neutral, clear)

// Alternative Hindi voice: '21m00Tcm4TlvDq8ikWAM' (Rachel)

export class ElevenLabsService {
  async textToSpeech(text: string, language: string = 'en'): Promise<Buffer> {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2', // Supports Hindi
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async streamTextToSpeech(text: string): Promise<NodeJS.ReadableStream> {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
          },
          responseType: 'stream'
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs streaming error:', error);
      throw new Error('Failed to stream speech');
    }
  }
}

export default new ElevenLabsService();
