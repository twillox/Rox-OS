export interface LLMProvider {
  generateText(prompt: string, context?: Record<string, any>): Promise<string>;
  generateJSON<T>(prompt: string, schema?: any): Promise<T>;
  streamText(prompt: string, onChunk: (chunk: string) => void): Promise<void>;
}

export interface VoiceProvider {
  generateAudio(text: string, voiceId: string, options?: Record<string, any>): Promise<Buffer>;
  streamAudio(text: string, voiceId: string, onData: (chunk: Buffer) => void): Promise<void>;
}

export interface SpeechProvider {
  transcribeAudio(audio: Buffer, options?: Record<string, any>): Promise<string>;
  streamTranscription(onPartial: (text: string) => void, onComplete: (text: string) => void): void;
  stopTranscription(): void;
}
