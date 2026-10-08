const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const VOICE_LIST_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`;
const SYNTH_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

export interface EdgeVoice {
  Name: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  SuggestedCodec: string;
  FriendlyName: string;
  Status: string;
  VoiceTag: {
    ContentCategories: string[];
    VoicePersonalities: string[];
  };
}

export interface TTSOptions {
  voice?: string;
  pitch?: string; // e.g. '+0Hz'
  rate?: string;  // e.g. '+0%'
  volume?: string; // e.g. '+0%'
}

function generateRequestId() {
  return crypto.randomUUID().replace(/-/g, '');
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
      }
  });
}

function getSSML(text: string, options: TTSOptions) {
  const voice = options.voice || 'en-IN-NeerjaNeural';
  const pitch = options.pitch || '+0Hz';
  const rate = options.rate || '+0%';
  const volume = options.volume || '+0%';

  const safeText = escapeXml(text);
  const lang = voice.startsWith('en-IN') ? 'en-IN' : 'en-US';

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">
    <voice name="${voice}">
        <prosody pitch="${pitch}" rate="${rate}" volume="${volume}">
            ${safeText}
        </prosody>
    </voice>
</speak>`;
}

export class EdgeTTS {
  /**
   * Fetches the list of available Microsoft Edge neural voices.
   */
  static async getVoices(): Promise<EdgeVoice[]> {
    const response = await fetch(VOICE_LIST_URL, {
      headers: {
        'Authority': 'speech.platform.bing.com',
        'Sec-CH-UA': '" Not;A Brand";v="99", "Microsoft Edge";v="113", "Chromium";v="113"',
        'Sec-CH-UA-Mobile': '?0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50',
        'Accept': '*/*',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Synthesizes text to an MP3 AudioBuffer stream using Edge TTS.
   * Note: This uses native standard WebSocket available in Node 22+.
   */
  static synthesize(text: string, options: TTSOptions = {}): Promise<ReadableStream> {
    return new Promise((resolve, reject) => {
      const ssml = getSSML(text, options);
      const requestId = generateRequestId();
    
    // Config packet
    const configData = JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: "false",
              wordBoundaryEnabled: "true"
            },
            outputFormat: "audio-24khz-48kbitrate-mono-mp3"
          }
        }
      }
    });
    
    const configMessage = `X-Timestamp:${new Date().toISOString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${configData}`;
    
    // SSML packet
      const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}Z\r\nPath:ssml\r\n\r\n${ssml}`;

      const WSClass = require('ws');
      
      const ws = new WSClass(SYNTH_URL, {
        headers: {
          'Origin': 'chrome-extension://jdiccldimpdaepmoblfhppfiifkgnkfc',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
        }
      });

      ws.onopen = () => {
        ws.send(configMessage);
        ws.send(ssmlMessage);
        
        // Resolve the stream once connected
        const stream = new ReadableStream({
          start(controller) {
            ws.onmessage = async (event: any) => {
          try {
            if (typeof event.data === 'string') {
              const data = event.data;
              if (data.includes('Path:turn.end')) {
                ws.close();
                controller.close();
              }
            } else {
              // Can be Blob or ArrayBuffer depending on environment
              let arrayBuffer: ArrayBuffer;
              if (event.data instanceof Blob || (event.data && typeof (event.data as any).arrayBuffer === 'function')) {
                arrayBuffer = await (event.data as Blob).arrayBuffer();
              } else if (event.data instanceof ArrayBuffer) {
                arrayBuffer = event.data;
              } else {
                arrayBuffer = new Uint8Array(event.data).buffer;
              }

              const view = new DataView(arrayBuffer);
              const headerLength = view.getUint16(0);
              
              const audioData = new Uint8Array(arrayBuffer, headerLength + 2);
              controller.enqueue(audioData);
            }
          } catch (err) {
            console.error("Edge TTS Stream Error:", err);
              controller.error(err);
              ws.close();
            }
          };

          ws.onerror = (error) => {
            console.error("WebSocket Error after open:", error);
            controller.error(error);
            ws.close();
          };

          ws.onclose = () => {
            try { controller.close(); } catch (e) {}
          };
        }
      });
      resolve(stream);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Connection Error:", error);
      reject(new Error("Failed to connect to TTS service"));
    };
  });
}
}
