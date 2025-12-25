import { useEffect, useRef } from "react";
import { VoiceInput } from "../components/voice-input";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useSpeechToText } from "../hooks/use-speech-to-text";

interface ProcessTextResult {
  shortcut_used: string | null;
  expanded_text: string | null;
}

export default function VoiceScreen() {
  const {
    isListening,
    transcript,
    start,
    stop,
    clear
  } = useSpeechToText({ continuous: true });

  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const hasTypedRef = useRef(false);

  // Session tracking for history
  const sessionStartRef = useRef<number | null>(null);
  const sessionTextRef = useRef<string[]>([]);
  const lastShortcutRef = useRef<string | null>(null);
  const targetAppRef = useRef<string | null>(null);

  const waitForQueueDrain = async () => {
    // Wait for any pending transcript to be added
    await new Promise(resolve => setTimeout(resolve, 300));
    // Wait for queue to finish processing
    while (queueRef.current.length > 0 || processingRef.current) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const text = queueRef.current.shift();
      if (text) {
        try {
          const textToSend = hasTypedRef.current ? " " + text : text;
          const result = await invoke<ProcessTextResult>('process_text', { text: textToSend });
          hasTypedRef.current = true;

          // Track text for this session
          sessionTextRef.current.push(text);

          // Track if a shortcut was used
          if (result.shortcut_used) {
            lastShortcutRef.current = result.shortcut_used;
          }
        } catch (error) {
          console.error('Failed to type text:', error);
        }
      }
    }
    processingRef.current = false;
  };

  const saveSessionHistory = async () => {
    if (sessionStartRef.current === null) return;

    const allText = sessionTextRef.current.join(' ').trim();

    // Even if there's no text, if we have a shortcut, we should still save
    // But we need at least some text or this was a false trigger
    if (!allText && !lastShortcutRef.current) return;

    const durationMs = Date.now() - sessionStartRef.current;
    const textToCount = allText || '';
    const wordCount = textToCount.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = textToCount.length;

    try {
      await invoke('save_history_entry', {
        timestamp: sessionStartRef.current,
        durationMs,
        text: allText || (lastShortcutRef.current ? `[Shortcut: ${lastShortcutRef.current}]` : ''),
        wordCount: wordCount || 1, // Count at least 1 for shortcuts
        charCount: charCount || (lastShortcutRef.current?.length || 0),
        shortcutUsed: lastShortcutRef.current,
        targetApp: targetAppRef.current,
      });
    } catch (error) {
      console.error('Failed to save history entry:', error);
    }
  };

  useEffect(() => {
    if (transcript) {
      const cleanTranscript = transcript.replace(/[\n\r]+/g, " ").trim();
      if (cleanTranscript) {
        queueRef.current.push(cleanTranscript);
        clear();
        processQueue();
      }
    }
  }, [transcript, clear]);

  useEffect(() => {
    let unlistenStart: () => void;
    let unlistenStop: () => void;

    const setupListeners = async () => {
      unlistenStart = await listen('start-listening', async () => {
        hasTypedRef.current = false;
        // Start a new session
        sessionStartRef.current = Date.now();
        sessionTextRef.current = [];
        lastShortcutRef.current = null;

        // Get the target app name
        try {
          targetAppRef.current = await invoke<string | null>('get_active_window_name');
        } catch {
          targetAppRef.current = null;
        }

        start();
      });

      unlistenStop = await listen('stop-listening', async () => {
        stop();
        // Wait for queue to fully drain before saving
        await waitForQueueDrain();
        // Save session history when stopped
        await saveSessionHistory();
        // Reset session
        sessionStartRef.current = null;
        sessionTextRef.current = [];
        lastShortcutRef.current = null;
        targetAppRef.current = null;
      });

      try {
        const state = await invoke<boolean>("get_listening_state");
        if (state) {
          sessionStartRef.current = Date.now();
          sessionTextRef.current = [];
          try {
            targetAppRef.current = await invoke<string | null>('get_active_window_name');
          } catch {
            targetAppRef.current = null;
          }
          start();
        }
      } catch (error) {
        console.error('Failed to get listening state:', error);
      }
    };

    setupListeners();

    return () => {
      if (unlistenStart) unlistenStart();
      if (unlistenStop) unlistenStop();
      stop();
    };
  }, [start, stop]);

  return (
    <>
      <style>{`body { background: transparent !important; }`}</style>
      <VoiceInput listening={isListening} />
    </>
  );
}

