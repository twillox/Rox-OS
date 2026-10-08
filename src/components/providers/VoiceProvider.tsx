'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Pause, Play, Square, RotateCcw, PhoneOff, Settings, Volume2, Send, X, AlertCircle } from 'lucide-react';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'reviewing' | 'thinking' | 'speaking' | 'paused' | 'interrupted' | 'offline';

interface VoiceContextProps {
  voiceState: VoiceState;
  startCall: (employeeId: string, employeeName: string, employeeRole: string, skipGreeting?: boolean, customEndpoint?: string) => void;
  endCall: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
  replayLastResponse: () => void;
  volume: number;
  setVolume: (vol: number) => void;
  activeEmployeeId: string | null;
  activeEmployeeName: string | null;
  activeEmployeeRole: string | null;
  handleVoiceInput: (text: string) => Promise<void>;
  simulateAIResponse: (text: string) => void;
  timeElapsed: number;
  history: { role: string, content: string }[];
  transcript: string;
  interimTranscript: string;
  stopListeningAndReview: () => void;
  submitTranscript: (text: string) => void;
  cancelTranscript: () => void;
  speechError: string | null;
}

const VoiceContext = createContext<VoiceContextProps | undefined>(undefined);

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [handoverTrigger, setHandoverTrigger] = useState(false);

  // New States for Transcript Review
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [activeEmployeeName, setActiveEmployeeName] = useState<string | null>(null);
  const [activeEmployeeRole, setActiveEmployeeRole] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [history, setHistory] = useState<{ role: string, content: string }[]>([]);

  const [chatEndpoint, setChatEndpoint] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Refs for stale closures in Web Speech API event listeners
  const voiceStateRef = useRef<VoiceState>('idle');
  const isMutedRef = useRef(false);
  const activeEmployeeIdRef = useRef<string | null>(null);
  const activeEmployeeNameRef = useRef<string | null>(null);
  const activeEmployeeRoleRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const historyRef = useRef<{ role: string, content: string }[]>([]);
  const chatEndpointRef = useRef<string | null>(null);
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    voiceStateRef.current = voiceState;
    isMutedRef.current = isMuted;
    activeEmployeeIdRef.current = activeEmployeeId;
    activeEmployeeNameRef.current = activeEmployeeName;
    activeEmployeeRoleRef.current = activeEmployeeRole;
    sessionIdRef.current = sessionId;
    historyRef.current = history;
    chatEndpointRef.current = chatEndpoint;
    transcriptRef.current = transcript;
  }, [voiceState, isMuted, activeEmployeeId, activeEmployeeName, activeEmployeeRole, sessionId, history, chatEndpoint, transcript]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      const updateVoices = () => {
        if (synthRef.current) {
          availableVoicesRef.current = synthRef.current.getVoices();
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Load persisted volume
    const savedVolume = localStorage.getItem('rox_voice_volume');
    if (savedVolume) setVolume(parseFloat(savedVolume));

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (voiceState !== 'idle' && !isMuted) {
          startListening();
        }
      }
      if (e.key === 'Escape') stopSpeaking();
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        if (voiceState !== 'idle') endCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, isMuted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (voiceState === 'speaking' || voiceState === 'listening') {
      timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    } else if (voiceState === 'idle') {
      setTimeElapsed(0);
    }
    return () => clearInterval(timer);
  }, [voiceState]);

  const setVolumeAndPersist = (vol: number) => {
    setVolume(vol);
    localStorage.setItem('rox_voice_volume', vol.toString());
  };

  const [handoverQueue, setHandoverQueue] = useState<any>(null);

  useEffect(() => {
    if (handoverTrigger && activeEmployeeId) {
      handleVoiceInput("The CEO just handed you the floor. Go ahead and speak.");
      setHandoverTrigger(false);
    }
  }, [activeEmployeeId, handoverTrigger]);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechError("Speech recognition requires Chrome or Edge browser.");
      return;
    }

    // Clear transcripts when starting a fresh listen phase
    if (voiceStateRef.current !== 'reviewing') {
      setTranscript('');
      setInterimTranscript('');
      transcriptRef.current = '';
    }

    // Safely cleanup any previous recognition instance to prevent Chrome deadlocks
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      // Auto-detect browser/regional language or default to en-IN for natural recognition
      const userLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-IN';
      rec.lang = userLang.startsWith('en') ? userLang : 'en-IN';

      rec.onresult = (event: any) => {
        // Prevent recording while reviewing or while AI is speaking
        if (voiceStateRef.current === 'reviewing' || voiceStateRef.current === 'speaking') return;

        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        if (finalStr) {
          const newFull = (transcriptRef.current ? transcriptRef.current + ' ' : '') + finalStr.trim();
          setTranscript(newFull);
          transcriptRef.current = newFull;
        }
        setInterimTranscript(interimStr);

        if (finalStr || interimStr) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          // Snappy 1100ms silence detection for fast, conversational turn-taking
          silenceTimerRef.current = setTimeout(() => {
            if (voiceStateRef.current === 'listening') {
              const fullSpeech = (transcriptRef.current + ' ' + (interimStr || '')).trim();
              if (fullSpeech.length > 1) {
                handleVoiceInput(fullSpeech);
              }
            }
          }, 1100);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition warning:', e.error);

        let errorMsg = e.error;
        if (e.error === 'not-allowed') errorMsg = 'Microphone permission denied';
        if (e.error === 'no-speech') errorMsg = null;
        if (e.error === 'network') errorMsg = 'Speech network error';
        if (e.error === 'aborted') errorMsg = null;

        if (errorMsg) setSpeechError(errorMsg);

        if (voiceStateRef.current === 'listening' && e.error !== 'not-allowed') {
          setTimeout(() => {
            if (!isMutedRef.current && voiceStateRef.current === 'listening') {
              startListening();
            }
          }, 250);
        } else if (e.error === 'not-allowed') {
          setVoiceState('idle');
        }
      };

      rec.onstart = () => {
        setSpeechError(null);
      };

      rec.onend = () => {
        if (!isMutedRef.current && voiceStateRef.current === 'listening') {
          setTimeout(() => {
            if (!isMutedRef.current && voiceStateRef.current === 'listening') {
              startListening();
            }
          }, 150);
        }
      };

      recognitionRef.current = rec;

      if (!isMutedRef.current) {
        rec.start();
      }
    } catch (e: any) {
      console.warn('SpeechRecognition initialization error:', e.message);
    }
  };

  const stopListeningAndReview = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    const currentSpeech = ((transcriptRef.current || transcript) + ' ' + interimTranscript).trim();
    if (currentSpeech.length > 1) {
      // Immediately submit the captured speech so user gets an instant response!
      handleVoiceInput(currentSpeech);
    } else {
      setVoiceState('reviewing');
    }
  };

  const submitTranscript = (textOverride?: string) => {
    const finalSentText = (textOverride || transcript + ' ' + interimTranscript).trim();
    if (!finalSentText) {
      setTranscript('');
      setInterimTranscript('');
      setVoiceState('listening');
      startListening();
      return;
    }
    handleVoiceInput(finalSentText);
  };

  const cancelTranscript = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setTranscript('');
    setInterimTranscript('');
    setVoiceState('listening');
    startListening();
  };

  const isProcessingRef = useRef(false);

  const handleVoiceInput = async (text: string) => {
    if (isProcessingRef.current) {
      console.log('Voice request already in progress, ignoring duplicate:', text);
      return;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    isProcessingRef.current = true;
    setVoiceState('thinking');

    const currentActiveEmployeeId = activeEmployeeIdRef.current;
    if (!currentActiveEmployeeId) {
      isProcessingRef.current = false;
      return;
    }

    // Optimistically update history with user input
    setHistory(prev => [...prev, { role: 'user', content: text }]);

    // Dashboard Voice Control Actions - ONLY trigger if talking to JARVIS or explicit navigation command
    const textLower = text.toLowerCase().trim();
    const isJarvis = !currentActiveEmployeeId || currentActiveEmployeeId.toLowerCase().includes('jarvis');
    const isExplicitOpen = textLower.startsWith('open ') || textLower.startsWith('go to ') || textLower.startsWith('navigate to ') || textLower.startsWith('show me the ');

    if ((isJarvis || isExplicitOpen) && (textLower.includes('financ') || textLower.includes('revenue') || textLower.includes('expense') || textLower.includes('records') || textLower.includes('digit'))) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/departments?highlight=Finance';
      }
      const responseText = "Sure! I am opening the Finance section for you right now. Look at the numbers highlighted on your screen: our monthly revenue is 1 lakh 85 thousand dollars, and expenses are 92 thousand dollars. That gives us an 18-month cash runway and a solid 50 percent profit margin. Everything is in order!";
      setLastResponse(responseText);
      setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      speakText(responseText);
      isProcessingRef.current = false;
      return;
    }

    if ((isJarvis || isExplicitOpen) && (textLower.includes('open task') || textLower.includes('show task') || textLower.includes('my tasks'))) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/tasks';
      }
      const responseText = "Opening the Task Center right now. Here are all active department tasks, priority kanbans, and employee assignments.";
      setLastResponse(responseText);
      setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      speakText(responseText);
      isProcessingRef.current = false;
      return;
    }

    if ((isJarvis || isExplicitOpen) && (textLower.includes('open boardroom') || textLower.includes('start meeting') || textLower.includes('boardroom'))) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/meetings';
      }
      const responseText = "Taking you into the Boardroom right now. All department executives are present and ready for discussion.";
      setLastResponse(responseText);
      setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      speakText(responseText);
      isProcessingRef.current = false;
      return;
    }

    if ((isJarvis || isExplicitOpen) && (textLower.includes('open marketing') || textLower.includes('show marketing') || textLower.includes('campaign'))) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/marketing';
      }
      const responseText = "Opening the Marketing Suite now. Here are our active growth campaigns, MQL targets, and channel performance.";
      setLastResponse(responseText);
      setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      speakText(responseText);
      isProcessingRef.current = false;
      return;
    }

    if ((isJarvis || isExplicitOpen) && (textLower.includes('open brain') || textLower.includes('show memory') || textLower.includes('company brain'))) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/brain';
      }
      const responseText = "Opening the Company Brain now. Here is your centralized organizational memory, company DNA, and strategic insights.";
      setLastResponse(responseText);
      setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      speakText(responseText);
      isProcessingRef.current = false;
      return;
    }

    if ((isJarvis || isExplicitOpen) && (textLower.includes('open report') || textLower.includes('show report') || textLower.includes('reports'))) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/reports';
      }
      const responseText = "Opening Executive Reports now. Here is the full financial and operational breakdown.";
      setLastResponse(responseText);
      setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      speakText(responseText);
      isProcessingRef.current = false;
      return;
    }

    try {
      let responseText = '';

      if (chatEndpointRef.current) {
        // Custom endpoint flow (e.g. Onboarding)
        const endpoint = chatEndpointRef.current;
        const payload = {
          message: text,
          history: historyRef.current,
          messages: [...historyRef.current, { role: 'user', content: text }]
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          responseText = data.text || data.reply || '';
          if (data.handoverEmployee) {
            setHandoverQueue(data.handoverEmployee);
          }
          if (data.isReady) {
            const event = new CustomEvent('roxten_onboarding_ready');
            window.dispatchEvent(event);
          }
        }
      } else {
        // Primary VoiceStudioService session flow
        const sId = sessionIdRef.current;
        if (sId) {
          try {
            const res = await fetch('/api/os/voice/session/turn', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: sId, text, employeeId: currentActiveEmployeeId })
            });
            if (res.ok) {
              const data = await res.json();
              responseText = data.text || '';
            }
          } catch (e) {
            console.warn('Voice session turn error, will use chat fallback', e);
          }
        }

        // Resilient fallback to direct employee chat route if session turn didn't return text
        if (!responseText) {
          try {
            const chatRes = await fetch(`/api/os/workforce/employee/${currentActiveEmployeeId}/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: text, history: historyRef.current })
            });
            if (chatRes.ok) {
              const chatData = await chatRes.json();
              responseText = chatData.text || '';
              if (chatData.handoverEmployee) {
                setHandoverQueue(chatData.handoverEmployee);
              }
            }
          } catch (e) {
            console.error('Employee chat fallback error', e);
          }
        }
      }

      if (responseText) {
        setLastResponse(responseText);
        setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
        setTranscript('');
        setInterimTranscript('');
        speakText(responseText);
      } else {
        // Revert optimistic history if no response
        setHistory(prev => prev.slice(0, -1));
        setVoiceState('listening');
        startListening();
      }
    } catch (e) {
      console.error('Voice input handler error', e);
      setVoiceState('listening');
      startListening();
    } finally {
      isProcessingRef.current = false;
    }
  };

  const simulateAIResponse = (text: string) => {
    setLastResponse(text);
    setHistory(prev => [...prev, { role: 'assistant', content: text }]);
    speakText(text);
  };

  const speakText = async (text: string) => {
    // 1. Temporarily pause microphone while AI is speaking so it doesn't hear itself
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }

    setVoiceState('speaking');
    fallbackSpeechSynthesis(text);
  };

  const handleSpeechEnd = () => {
    (window as any)._activeUtterance = null;
    activeUtteranceRef.current = null;
    if (handoverQueue) {
      startCall(handoverQueue.id, handoverQueue.name, handoverQueue.role);
      setHandoverTrigger(true);
      setHandoverQueue(null);
    } else if (voiceStateRef.current !== 'idle' && voiceStateRef.current !== 'paused') {
      voiceStateRef.current = 'listening';
      setVoiceState('listening');
      setTimeout(() => startListening(), 80);
    }
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if (!synthRef.current) {
      handleSpeechEnd();
      return;
    }

    try {
      if (synthRef.current.paused) synthRef.current.resume();
      synthRef.current.cancel();
    } catch (e) { }

    setTimeout(() => {
      if (!synthRef.current || voiceStateRef.current === 'idle') return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = 1.18; // Fast, snappy default speaking rate
      (window as any)._activeUtterance = utterance;
      activeUtteranceRef.current = utterance;

      const voices = availableVoicesRef.current.length > 0
        ? availableVoicesRef.current
        : synthRef.current.getVoices();

      if (voices.length > 0) {
        const dbProfile = (window as any)._activeVoiceProfile || {};
        const empNameLower = (activeEmployeeNameRef.current || activeEmployeeName || '').toLowerCase();
        const empRoleLower = (activeEmployeeRoleRef.current || activeEmployeeRole || '').toLowerCase();

        const isIndian = dbProfile.isIndian || 
                         dbProfile.accent?.includes('Indian') || 
                         dbProfile.voiceId?.includes('en-IN') || 
                         ['priya', 'rohan', 'anita', 'sharma', 'patel', 'roy'].some(n => empNameLower.includes(n));
        const isFemale = dbProfile.gender === 'Female' || 
                         ['priya', 'sarah', 'anita'].some(n => empNameLower.includes(n)) || 
                         empRoleLower.includes('marketing') || 
                         empRoleLower.includes('hr');
        const isBritish = dbProfile.accent?.includes('British') || empNameLower.includes('jarvis');

        const englishVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('hi'));
        const voicePool = englishVoices.length > 0 ? englishVoices : voices;

        let selectedVoice: SpeechSynthesisVoice | undefined = undefined;

        if (dbProfile.voiceId) {
          selectedVoice = voices.find(v => v.voiceURI === dbProfile.voiceId || v.name === dbProfile.voiceId);
        }

        if (!selectedVoice && isIndian) {
          selectedVoice = voicePool.find(v => {
            const isMatch = v.lang.includes('IN') || v.name.includes('India') || v.name.includes('Heera') || v.name.includes('Veena') || v.name.includes('Ravi');
            if (isFemale) return isMatch && (v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Veena') || v.name.includes('Zira') || !v.name.includes('Male'));
            return isMatch;
          });
        }

        if (!selectedVoice) {
          selectedVoice = voicePool.find(v => {
            const matchesGender = isFemale 
              ? (v.name.includes('Female') || v.name.includes('Girl') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria')) 
              : (v.name.includes('Male') || v.name.includes('Guy') || v.name.includes('David') || v.name.includes('George') || v.name.includes('Alex'));
            let matchesAccent = true;
            if (isBritish) matchesAccent = v.lang.includes('GB');
            else if (isIndian) matchesAccent = v.lang.includes('IN');
            else matchesAccent = v.lang.includes('US') || v.lang.includes('en');
            return matchesGender && matchesAccent;
          });
        }

        if (!selectedVoice) {
          selectedVoice = voicePool[0];
        }

        utterance.voice = selectedVoice;
        if (dbProfile.voicePitch) utterance.pitch = parseFloat(dbProfile.voicePitch);
        const desiredRate = dbProfile.voiceSpeed ? parseFloat(dbProfile.voiceSpeed) : 1.18;
        utterance.rate = Math.max(desiredRate, 1.15); // Fast, energetic and conversational
      }

      let isHandled = false;
      const finish = () => {
        if (isHandled) return;
        isHandled = true;
        (window as any)._activeUtterance = null;
        activeUtteranceRef.current = null;
        handleSpeechEnd();
      };

      utterance.onstart = () => {
        setVoiceState('speaking');
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      // Watchdog timeout to prevent voice UI hanging if browser synthesis stops
      const timeoutDuration = Math.min(Math.max(text.length * 60, 2500), 9000);
      setTimeout(() => {
        if (!isHandled && voiceStateRef.current === 'speaking') {
          finish();
        }
      }, timeoutDuration);

      if (synthRef.current.paused) {
        synthRef.current.resume();
      }
      synthRef.current.speak(utterance);
    }, 60);
  };

  const startCall = (employeeId: string, employeeName: string, employeeRole: string, skipGreeting: boolean = false, customEndpoint?: string) => {
    setActiveEmployeeId(employeeId);
    setActiveEmployeeName(employeeName);
    setActiveEmployeeRole(employeeRole);
    activeEmployeeIdRef.current = employeeId;
    setChatEndpoint(customEndpoint || null);
    chatEndpointRef.current = customEndpoint || null;
    setHistory([]);
    historyRef.current = [];
    setVoiceState('connecting');
    voiceStateRef.current = 'connecting';

    // Fetch the employee's custom voice profile
    fetch(`/api/os/workforce/employee/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.employee) {
          const empNameLower = (data.employee.name || employeeName).toLowerCase();
          const isIndian = data.employee.accent?.includes('Indian') || 
                           data.employee.voiceId?.includes('en-IN') || 
                           ['priya', 'rohan', 'anita', 'sharma', 'patel', 'roy'].some((n: string) => empNameLower.includes(n));
          (window as any)._activeVoiceProfile = {
            voiceId: data.employee.voiceId,
            gender: data.employee.gender || (['priya', 'sarah', 'anita'].some((n: string) => empNameLower.includes(n)) ? 'Female' : 'Male'),
            accent: isIndian ? 'Indian' : (data.employee.accent || 'US'),
            isIndian,
            voiceSpeed: data.employee.voiceSpeed,
            voicePitch: data.employee.voicePitch
          };
        }
      })
      .catch(() => { });

    setTimeout(async () => {
      setVoiceState('thinking');
      try {
        if (customEndpoint) {
          if (skipGreeting) {
            voiceStateRef.current = 'listening';
            setVoiceState('listening');
            startListening();
            return;
          }
          const greetingMsg = '[CEO has joined the call. Greet them naturally in 1 short sentence.]';
          const res = await fetch(customEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: greetingMsg, history: [], messages: [{ role: 'user', content: greetingMsg }] })
          });
          if (res.ok) {
            const data = await res.json();
            const responseText = data.text || data.reply || '';
            setLastResponse(responseText);
            setHistory([{ role: 'assistant', content: responseText }]);
            speakText(responseText);
          } else {
            voiceStateRef.current = 'listening';
            setVoiceState('listening');
            startListening();
          }
        } else {
          // Initialize Voice Session Backend
          let sId: string | null = null;
          let greetingText = '';

          try {
            const res = await fetch('/api/os/voice/session/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId })
            });
            if (res.ok) {
              const sessionData = await res.json();
              if (sessionData?.id) {
                sId = sessionData.id;
                setSessionId(sId);
                sessionIdRef.current = sId;
              }
            }
          } catch (e) {
            console.warn('Session start error', e);
          }

          if (skipGreeting) {
            voiceStateRef.current = 'listening';
            setVoiceState('listening');
            startListening();
            return;
          }

          const greetingMsg = '[CEO has joined the call. Greet them naturally in 1 short sentence.]';

          if (sId) {
            try {
              const turnRes = await fetch('/api/os/voice/session/turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sId, text: greetingMsg, employeeId })
              });
              if (turnRes.ok) {
                const turnData = await turnRes.json();
                greetingText = turnData.text || '';
              }
            } catch (e) { }
          }

          // Fallback to employee chat greeting
          if (!greetingText) {
            try {
              const chatRes = await fetch(`/api/os/workforce/employee/${employeeId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: greetingMsg, history: [] })
              });
              if (chatRes.ok) {
                const chatData = await chatRes.json();
                greetingText = chatData.text || '';
              }
            } catch (e) { }
          }

          // Safe instant fallback
          if (!greetingText) {
            greetingText = employeeId.toLowerCase().includes('jarvis')
              ? "Hello CEO! Systems are active and I am standing by for your directives."
              : `Hello CEO! This is ${employeeName}, ${employeeRole}. How can I assist you right now?`;
          }

          setLastResponse(greetingText);
          setHistory([{ role: 'assistant', content: greetingText }]);
          speakText(greetingText);
        }
      } catch (e) {
        console.error('Call initialization error', e);
        voiceStateRef.current = 'listening';
        setVoiceState('listening');
        startListening();
      }
    }, 600);
  };

  const endCall = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (sessionIdRef.current && !chatEndpointRef.current) {
      fetch('/api/os/voice/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current })
      }).catch(() => { });
    }
    setVoiceState('idle');
    setActiveEmployeeId(null);
    setActiveEmployeeName(null);
    setActiveEmployeeRole(null);
    setSessionId(null);
    setHistory([]);
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && recognitionRef.current) recognitionRef.current.stop();
    if (isMuted && voiceState !== 'idle') startListening();
  };

  const pauseSpeaking = () => {
    if (activeAudioRef.current && !activeAudioRef.current.paused) {
      activeAudioRef.current.pause();
      setVoiceState('paused');
    } else if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.pause();
      setVoiceState('paused');
    }
  };

  const resumeSpeaking = () => {
    if (activeAudioRef.current && activeAudioRef.current.paused) {
      activeAudioRef.current.play();
      setVoiceState('speaking');
    } else if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setVoiceState('speaking');
    }
  };

  const stopSpeaking = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
      setVoiceState('interrupted');
      setTimeout(() => setVoiceState('listening'), 500);
    } else if (synthRef.current) {
      synthRef.current.cancel();
      setVoiceState('interrupted');
      setTimeout(() => setVoiceState('listening'), 500);
    }
  };

  const replayLastResponse = () => {
    if (lastResponse) {
      speakText(lastResponse);
    }
  };

  return (
    <VoiceContext.Provider value={{
      voiceState, startCall, endCall, isMuted, toggleMute,
      pauseSpeaking, resumeSpeaking, stopSpeaking, replayLastResponse,
      volume, setVolume, activeEmployeeId, activeEmployeeName, activeEmployeeRole, handleVoiceInput, simulateAIResponse,
      timeElapsed, history,
      transcript, interimTranscript, stopListeningAndReview, submitTranscript, cancelTranscript, speechError
    }}>
      {children}
      <VoiceControlBar />
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) throw new Error('useVoice must be used within a VoiceProvider');
  return context;
};

// Global Floating Control Bar
const VoiceControlBar = () => {
  const {
    voiceState, endCall, isMuted, toggleMute, pauseSpeaking,
    resumeSpeaking, stopSpeaking, replayLastResponse, volume, setVolume,
    activeEmployeeName, activeEmployeeRole, timeElapsed,
    transcript, interimTranscript, stopListeningAndReview, submitTranscript, cancelTranscript, speechError
  } = useVoice();

  if (voiceState === 'idle') return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-4"
      >
        {/* Status Indicator */}
        <div className="px-6 py-2 rounded-full bg-white backdrop-blur-xl border border-gray-200 flex items-center gap-3 shadow-2xl">
          <div className="flex items-center gap-2">
            {voiceState === 'speaking' ? (
              <div className="flex items-center gap-0.5 h-4 w-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ['20%', '100%', '20%'] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${voiceState === 'listening' ? 'bg-indigo-400' : voiceState === 'thinking' ? 'bg-purple-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${voiceState === 'listening' ? 'bg-indigo-500' : voiceState === 'thinking' ? 'bg-purple-500' : 'bg-red-500'}`}></span>
              </span>
            )}
            <span className="text-xs font-bold text-gray-900 uppercase tracking-widest min-w-[100px] flex items-center gap-2">
              {voiceState === 'speaking' && "AI Speaking"}
              {voiceState === 'listening' && "Listening..."}
              {voiceState === 'thinking' && "Thinking..."}
              {voiceState === 'paused' && "Paused"}
              {voiceState === 'interrupted' && "Interrupted"}
              {voiceState === 'connecting' && "Connecting..."}
              <span className="text-[10px] text-gray-500 ml-1 font-mono">{formatTime(timeElapsed)}</span>
            </span>
          </div>

          <div className="w-px h-4 bg-gray-50 mx-2" />

          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-900">{activeEmployeeName || 'JARVIS'}</span>
            <span className="text-[10px] text-gray-500">{activeEmployeeRole || 'System Intelligence'}</span>
          </div>
        </div>

        {/* Transcript Review UI */}
        {voiceState === 'reviewing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-white backdrop-blur-2xl border border-gray-200 shadow-2xl flex flex-col gap-4 max-w-md w-full"
          >
            <div className="flex justify-between items-center w-full">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Mic className="w-4 h-4" /> Transcript Preview
              </div>
              <button
                onClick={endCall}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                title="End Call"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl max-h-40 overflow-y-auto text-gray-800 text-lg leading-relaxed">
              {(transcript + ' ' + interimTranscript).trim() || <span className="italic text-gray-400">No speech detected...</span>}
            </div>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={cancelTranscript}
                className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all text-sm"
              >
                Cancel & Retake
              </button>
              <button
                onClick={() => submitTranscript((transcript + ' ' + interimTranscript).trim())}
                disabled={!(transcript + ' ' + interimTranscript).trim()}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit
              </button>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        {voiceState !== 'reviewing' && (
          <div className="p-2 rounded-2xl bg-white backdrop-blur-2xl border border-gray-200 flex items-center gap-2 shadow-2xl">
            {speechError && (
              <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 mr-2">
                <AlertCircle className="w-4 h-4" /> {speechError}
              </div>
            )}

            {voiceState === 'listening' ? (
              <button
                onClick={stopListeningAndReview}
                className="px-6 py-4 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-all font-bold text-sm flex items-center gap-2"
                title="Stop Recording"
              >
                <Square className="w-4 h-4" /> Stop Recording
              </button>
            ) : (
              <button
                onClick={toggleMute}
                className={`p-4 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-gray-50 text-gray-900'}`}
                title="Mute / Unmute (M)"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <div className="w-px h-8 bg-gray-50 mx-1" />

            {voiceState === 'speaking' ? (
              <button onClick={pauseSpeaking} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Pause">
                <Pause className="w-5 h-5" />
              </button>
            ) : voiceState === 'paused' ? (
              <button onClick={resumeSpeaking} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Resume">
                <Play className="w-5 h-5" />
              </button>
            ) : null}

            <button onClick={stopSpeaking} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Stop Speaking Instantly (Esc)">
              <Square className="w-5 h-5" />
            </button>

            <button onClick={replayLastResponse} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Replay Last Response">
              <RotateCcw className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-gray-50 mx-1" />

            <button onClick={endCall} className="px-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2 font-bold text-sm">
              <PhoneOff className="w-4 h-4" /> End Call
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
