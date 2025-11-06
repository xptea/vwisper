import React from "react";
import { VoiceInput } from "../components/voice-input";
import { invoke } from "@tauri-apps/api/core";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceScreem() {
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const sentCharCountRef = React.useRef<number>(0);

  React.useEffect(() => {
    let polling = true;
    let lastListeningState = false;
    
    const pollState = async () => {
      while (polling) {
        try {
          const state = await invoke<boolean>("get_listening_state");
          setListening(state);
          
          if (state && !lastListeningState) {
            startSpeechRecognition();
          } else if (!state && lastListeningState) {
            stopSpeechRecognition();
          }
          lastListeningState = state;
        } catch (error) {
          console.error('Failed to get listening state:', error);
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    };
    pollState();
    return () => {
      polling = false;
      stopSpeechRecognition();
    };
  }, []);

  const startSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      sentCharCountRef.current = 0;

      recognitionRef.current.onresult = async (event: any) => {
        const mode = localStorage.getItem('pasteMode') || 'word';


        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }

        const lastResult = event.results[event.results.length - 1];

        if (mode === 'word') {

          if (sentCharCountRef.current > fullTranscript.length) {
            return;
          }

          const newSegment = fullTranscript.slice(sentCharCountRef.current);

          if (lastResult.isFinal) {
            const remaining = newSegment.trim();
            if (remaining) {
              try {
                const activeWindow = await invoke<number | null>('get_active_window');
                if (activeWindow) {
                  await invoke('restore_window_focus', { hwnd: activeWindow });
                }
                await invoke('process_text', { text: remaining });
              } catch (error) {
                console.error('Failed to type text:', error);
              }
            }
            sentCharCountRef.current = fullTranscript.length;
          } else {
            if (!newSegment) return;
            if (newSegment.includes(' ')) {
              const lastSpaceIndex = newSegment.lastIndexOf(' ');
              let toSend = newSegment.slice(0, lastSpaceIndex + 1);
              toSend = toSend.replace(/[.!?]\s*$/, ' ');
              if (toSend.trim()) {
                try {
                  const activeWindow = await invoke<number | null>('get_active_window');
                  if (activeWindow) {
                    await invoke('restore_window_focus', { hwnd: activeWindow });
                  }
                  await invoke('process_text', { text: toSend });
                } catch (error) {
                  console.error('Failed to type text:', error);
                }

                sentCharCountRef.current += toSend.length;
              }
            }
          }
        } else if (mode === 'sentence') {
          if (lastResult.isFinal) {
            const transcript = fullTranscript.trim();
            if (transcript) {
              try {
                const activeWindow = await invoke<number | null>('get_active_window');
                if (activeWindow) {
                  await invoke('restore_window_focus', { hwnd: activeWindow });
                }
                await invoke('process_text', { text: transcript });
              } catch (error) {
                console.error('Failed to type text:', error);
              }
            }
            sentCharCountRef.current = 0;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.start();
    } else {
      console.error('Speech recognition not supported in this browser');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  return (
    <>
      <style>{`body { background: transparent !important; }`}</style>
      <VoiceInput listening={listening} />
    </>
  );
}
