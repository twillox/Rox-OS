import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export interface ValidationResult {
  isValid: boolean;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  errors: string[];
}

export class AudioValidator {
  
  /**
   * Validates an uploaded audio file using FFprobe.
   * Ensures minimum duration, sufficient sample rate, etc.
   */
  public static async validate(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };

    try {
      console.log(`[AudioValidator] Running ffprobe on ${filePath}`);
      // Use real ffprobe command. (Assumes ffprobe is installed on the host OS)
      const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
      const data = JSON.parse(stdout);
      
      const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
      if (!audioStream) {
        return { isValid: false, errors: ['No audio stream detected in file.'] };
      }

      const duration = parseFloat(audioStream.duration || data.format?.duration || '0');
      const sampleRate = parseInt(audioStream.sample_rate || '0', 10);
      const channels = parseInt(audioStream.channels || '0', 10);

      result.duration = duration;
      result.sampleRate = sampleRate;
      result.channels = channels;

      // Real Validation Rules
      if (duration < 10) {
        result.isValid = false;
        result.errors.push('Audio duration must be at least 10 seconds for a high-quality clone.');
      }
      
      if (sampleRate < 22050) {
        result.isValid = false;
        result.errors.push('Sample rate must be at least 22kHz.');
      }

    } catch (error: any) {
      console.error('[AudioValidator] FFprobe execution failed:', error);
      return { 
        isValid: false, 
        errors: ['Failed to analyze audio file. Ensure it is a valid, uncorrupted audio format.'] 
      };
    }

    return result;
  }
}
