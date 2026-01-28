import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseVoiceSearchReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceSearch(onResult?: (text: string) => void): UseVoiceSearchReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Store callback in ref to avoid recreating recognition on callback changes
  const onResultRef = useRef(onResult);
  
  // Update ref when callback changes (without recreating recognition)
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Check for secure context (HTTPS required for microphone)
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;

  useEffect(() => {
    if (!isSupported) return;

    // Warn if not in secure context (microphone won't work)
    if (!isSecureContext) {
      console.warn('[VoiceSearch] Not in secure context - microphone access may be blocked');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < results.length; i++) {
        const result = results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      // If we have a final result, call the callback using ref
      if (finalTranscript && onResultRef.current) {
        onResultRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your device.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please enable permissions in your browser settings.');
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        case 'aborted':
          // User aborted, not an error
          break;
        case 'service-not-allowed':
          setError('Voice search is not available on this device or browser.');
          break;
        default:
          setError('Voice search failed. Please try again or use text search.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, isSecureContext]); // Removed onResult from deps - using ref instead

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice search is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (!isSecureContext) {
      setError('Voice search requires a secure connection (HTTPS).');
      return;
    }

    if (!recognitionRef.current) {
      setError('Voice search is not available. Please refresh the page.');
      return;
    }

    setError(null);
    setTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      // Recognition might already be running
      if (e.name === 'InvalidStateError') {
        // Already running, stop and restart
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {
            setError('Failed to start voice search. Please try again.');
          }
        }, 100);
      } else {
        console.error('Failed to start recognition:', e);
        setError('Failed to start voice search. Please try again.');
      }
    }
  }, [isSupported, isSecureContext]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
