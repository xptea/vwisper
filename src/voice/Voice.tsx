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

      let lastSent = '';

      recognitionRef.current.onresult = async (event: any) => {
        const mode = localStorage.getItem('pasteMode') || 'word';
        const result = event.results[event.results.length - 1];
        const currentTranscript = result[0].transcript;
        
        if (mode === 'word') {
          if (currentTranscript.length > lastSent.length) {
            const newText = currentTranscript.slice(lastSent.length);
            if (newText.trim()) {
              try {
                const activeWindow = await invoke<number | null>('get_active_window');
                if (activeWindow) {
                  await invoke('restore_window_focus', { hwnd: activeWindow });
                }
                await invoke('type_text', { text: newText });
              } catch (error) {
                console.error('Failed to type text:', error);
              }
            }
            lastSent = currentTranscript;
          }
          
          if (result.isFinal) {
            lastSent = '';
          }
        } else if (mode === 'sentence') {
          if (result.isFinal) {
            const transcript = currentTranscript.trim();
            if (transcript) {
              try {
                const activeWindow = await invoke<number | null>('get_active_window');
                if (activeWindow) {
                  await invoke('restore_window_focus', { hwnd: activeWindow });
                }
                await invoke('type_text', { text: transcript });
              } catch (error) {
                console.error('Failed to type text:', error);
              }
            }
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
