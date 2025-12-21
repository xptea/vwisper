import React, { useEffect, useRef } from "react";
import { VoiceInput } from "../components/voice-input";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useSpeechToText } from "../hooks/use-speech-to-text";

export default function VoiceScreem() {
  const {
    isListening,
    transcript,
    start,
    stop,
    clear
  } = useSpeechToText({ continuous: true });

  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);

  // Queue processing logic
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

  // Watch transcript and add to queue
  useEffect(() => {
    if (transcript) {
      // The hook accumulates transcript.
      // We want to process it and then clear it so we don't re-process.
      // We push to queue.
      // transcript contains new committed words/sentences.
      // Ensure no newlines and add a trailing space for separation.
      const cleanTranscript = transcript.replace(/[\n\r]+/g, " ");
      queueRef.current.push(cleanTranscript + " ");
      clear();
      processQueue();
    }
  }, [transcript, clear]);

  // Listeners for global events
  useEffect(() => {
    let unlistenStart: () => void;
    let unlistenStop: () => void;

    const setupListeners = async () => {
      unlistenStart = await listen('start-listening', () => {
        start();
      });

      unlistenStop = await listen('stop-listening', () => {
        stop();
      });

      try {
        const state = await invoke<boolean>("get_listening_state");
        if (state) {
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
