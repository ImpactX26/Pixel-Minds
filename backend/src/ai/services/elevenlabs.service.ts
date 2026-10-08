import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Transcribes audio using ElevenLabs Speech-to-Text API with scribe_v2.
   */
  async transcribeAudio(fileBuffer: Buffer, fileName = 'recording.webm', mimeType = 'audio/webm'): Promise<string> {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');

    if (!apiKey) {
      this.logger.warn('ELEVENLABS_API_KEY is not configured in the environment.');
      return '';
    }

    try {
      this.logger.log(`Invoking ElevenLabs STT (model: scribe_v2, size: ${fileBuffer.length} bytes)...`);

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType || 'audio/webm' });
      formData.append('file', blob, fileName);
      formData.append('model_id', 'scribe_v2');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData,
      });

      if (response.ok) {
        const data: any = await response.json();
        const transcribedText = data.text?.trim() || '';
        this.logger.log(`ElevenLabs STT transcription successful: "${transcribedText}"`);
        return transcribedText;
      } else {
        const errText = await response.text();
        this.logger.warn(`ElevenLabs STT API returned status ${response.status}: ${errText}`);
        return '';
      }
    } catch (err: any) {
      this.logger.error(`Failed to transcribe audio via ElevenLabs: ${err.message}`, err.stack);
      return '';
    }
  }

  /**
   * Generates speech audio (Base64) from text using ElevenLabs Text-to-Speech API.
   * Model: eleven_multilingual_v2
   */
  async generateSpeech(text: string): Promise<string | null> {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    const configuredVoiceId = this.configService.get<string>('ELEVENLABS_VOICE_ID');
    const defaultVoiceId = configuredVoiceId || 'JBFqnCBsd6RMkjVDRZzb'; // Default George premade voice

    if (!apiKey) {
      this.logger.debug('ELEVENLABS_API_KEY not configured, skipping TTS generation.');
      return null;
    }

    try {
      // Clean markdown formatting for clear spoken speech
      const cleanText = text.replace(/[*#`_~[\]()]/g, '').trim();
      if (!cleanText) return null;

      this.logger.log(`Invoking ElevenLabs TTS (voice: ${defaultVoiceId}, model: eleven_multilingual_v2)...`);

      let response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      // If configured voice is a community library voice requiring paid plan (402), retry with standard premade voice
      if (!response.ok && response.status === 402 && defaultVoiceId !== 'JBFqnCBsd6RMkjVDRZzb') {
        const errJson = await response.text();
        this.logger.warn(`ElevenLabs TTS voice ${defaultVoiceId} returned 402 (${errJson.substring(0, 100)}). Falling back to premade voice JBFqnCBsd6RMkjVDRZzb...`);
        
        response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });
      }

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');
        this.logger.log(`ElevenLabs TTS audio generated successfully (${buffer.length} bytes audio/mpeg).`);
        return base64Audio;
      } else {
        const errText = await response.text();
        // Log safe status and sanitized error without exposing API key
        this.logger.warn(`ElevenLabs TTS API returned HTTP status ${response.status}: ${errText.substring(0, 200)}`);
        return null;
      }
    } catch (err: any) {
      this.logger.error(`Failed to generate speech via ElevenLabs: ${err.message}`);
      return null;
    }
  }
}
