import axios from 'axios';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (neutral, clear)

// Alternative Hindi voice: '21m00Tcm4TlvDq8ikWAM' (Rachel)

export class ElevenLabsService {
  async textToSpeech(text: string, language: string = 'en'): Promise<Buffer> {
    // Check if API key is configured
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Limit text length to avoid quota issues and errors
    const maxLength = 500;
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          text: truncatedText,
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
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          // Prevent axios from logging request details
          validateStatus: (status) => status < 500
        }
      );

      // Handle specific error status codes
      if (response.status === 401) {
        console.error('ElevenLabs: Authentication failed (401)');
        throw new Error('Voice service authentication failed');
      }

      if (response.status === 429) {
        console.error('ElevenLabs: Rate limit exceeded (429)');
        throw new Error('Voice service rate limit exceeded');
      }

      if (response.status === 402) {
        console.error('ElevenLabs: Quota exceeded (402)');
        throw new Error('Voice service quota exceeded');
      }

      if (response.status !== 200) {
        console.error(`ElevenLabs: API error (${response.status})`);
        throw new Error('Voice service unavailable');
      }

      return Buffer.from(response.data);
    } catch (error) {
      // Log error WITHOUT exposing API key or sensitive data
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        
        // Log safe information only
        console.error('ElevenLabs API Error:', {
          status,
          statusText,
          message: error.message
          // DO NOT log: headers, config, request details
        });

        // Throw user-friendly errors
        if (status === 401) {
          throw new Error('Voice service authentication failed');
        } else if (status === 429) {
          throw new Error('Voice service rate limit exceeded');
        } else if (status === 402) {
          throw new Error('Voice service quota exceeded');
        }
      }
      
      throw new Error('Failed to generate speech');
    }
  }

  async streamTextToSpeech(text: string): Promise<NodeJS.ReadableStream> {
    // Check if API key is configured
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Limit text length
    const maxLength = 500;
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
        {
          text: truncatedText,
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
          responseType: 'stream',
          timeout: 30000,
          validateStatus: (status) => status < 500
        }
      );

      if (response.status !== 200) {
        throw new Error(`Voice service error: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('ElevenLabs Streaming Error:', {
          status: error.response?.status,
          message: error.message
        });
      }
      throw new Error('Failed to stream speech');
    }
  }
}

export default new ElevenLabsService();
