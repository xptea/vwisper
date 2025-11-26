import React from "react";
import { VoiceInput } from "../components/voice-input";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceScreem() {
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const processingRef = React.useRef(false);
  const queueRef = React.useRef<string[]>([]);
  
  const committedWordsRef = React.useRef<string[]>([]);
  const lastInterimWordsRef = React.useRef<string[]>([]);
  const wordStabilityCountRef = React.useRef<number[]>([]);
  const processedFinalCountRef = React.useRef<number>(0);
  
  const STABILITY_THRESHOLD = 3;

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const text = queueRef.current.shift();
      if (text) {
        try {
          await invoke('process_text', { text });
        } catch (error) {
          console.error('Failed to type text:', error);
        }
      }
    }

    processingRef.current = false;
  };

  const startSpeechRecognition = React.useCallback(() => {
    if (recognitionRef.current) return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      committedWordsRef.current = [];
      lastInterimWordsRef.current = [];
      wordStabilityCountRef.current = [];
      processedFinalCountRef.current = 0;
      queueRef.current = [];

      recognitionRef.current.onresult = async (event: any) => {
        const mode = localStorage.getItem('pasteMode') || 'word';

        if (mode === 'word') {
          let fullTranscript = '';
          
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            fullTranscript += transcript;
          }
          
          const allWords = fullTranscript.trim().split(/\s+/).filter(w => w);
          const committedCount = committedWordsRef.current.length;
          
          const lastResult = event.results[event.results.length - 1];
          
          if (lastResult.isFinal) {
            const newWords = allWords.slice(committedCount);
            for (const word of newWords) {
              if (word) {
                committedWordsRef.current.push(word);
                queueRef.current.push(word + ' ');
              }
            }
            lastInterimWordsRef.current = [];
            wordStabilityCountRef.current = [];
            processQueue();
          } else {
            const interimWords = allWords.slice(committedCount);
            const prevInterimWords = lastInterimWordsRef.current;
            
            const newStabilityCounts: number[] = [];
            for (let i = 0; i < interimWords.length; i++) {
              const word = interimWords[i];
              const prevWord = prevInterimWords[i];
              const prevCount = wordStabilityCountRef.current[i] || 0;
              
              if (word === prevWord) {
                newStabilityCounts[i] = prevCount + 1;
              } else {
                newStabilityCounts[i] = 1;
              }
            }
            
            let wordsToCommit = 0;
            if (interimWords.length > 1) {
              for (let i = 0; i < interimWords.length - 1; i++) {
                if (newStabilityCounts[i] >= STABILITY_THRESHOLD) {
                  wordsToCommit = i + 1;
                } else {
                  break;
                }
              }
            }
            
            if (wordsToCommit > 0) {
              for (let i = 0; i < wordsToCommit; i++) {
                const word = interimWords[i];
                committedWordsRef.current.push(word);
                queueRef.current.push(word + ' ');
              }
              processQueue();
              
              lastInterimWordsRef.current = interimWords.slice(wordsToCommit);
              wordStabilityCountRef.current = newStabilityCounts.slice(wordsToCommit);
            } else {
              lastInterimWordsRef.current = interimWords;
              wordStabilityCountRef.current = newStabilityCounts;
            }
          }
        } else if (mode === 'sentence') {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            let fullTranscript = '';
            for (let i = processedFinalCountRef.current; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript;
                if (fullTranscript && !fullTranscript.endsWith(' ') && !transcript.startsWith(' ')) {
                  fullTranscript += ' ';
                }
                fullTranscript += transcript;
              }
            }
            let finalCount = 0;
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalCount = i + 1;
              }
            }
            processedFinalCountRef.current = finalCount;
            
            const text = fullTranscript.trim();
            if (text) {
              queueRef.current.push(text);
              processQueue();
            }
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.onend = () => {
        const mode = localStorage.getItem('pasteMode') || 'word';
        
        if (mode === 'word') {
          const remainingWords = lastInterimWordsRef.current;
          if (remainingWords.length > 0) {
            for (const word of remainingWords) {
              if (word) {
                queueRef.current.push(word + ' ');
              }
            }
            processQueue();
          }
        }
        
        committedWordsRef.current = [];
        lastInterimWordsRef.current = [];
        wordStabilityCountRef.current = [];
        processedFinalCountRef.current = 0;
      };

      recognitionRef.current.start();
    } else {
      console.error('Speech recognition not supported in this browser');
    }
  }, []);

  const stopSpeechRecognition = React.useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    let unlistenStart: () => void;
    let unlistenStop: () => void;

    const setupListeners = async () => {
      unlistenStart = await listen('start-listening', () => {
        setListening(true);
        startSpeechRecognition();
      });

      unlistenStop = await listen('stop-listening', () => {
        setListening(false);
        stopSpeechRecognition();
      });

      try {
        const state = await invoke<boolean>("get_listening_state");
        setListening(state);
        if (state) {
          startSpeechRecognition();
        }
      } catch (error) {
        console.error('Failed to get listening state:', error);
      }
    };

    setupListeners();

    return () => {
      if (unlistenStart) unlistenStart();
      if (unlistenStop) unlistenStop();
      stopSpeechRecognition();
    };
  }, [startSpeechRecognition, stopSpeechRecognition]);

  return (
    <>
      <style>{`body { background: transparent !important; }`}</style>
      <VoiceInput listening={listening} />
    </>
  );
}
