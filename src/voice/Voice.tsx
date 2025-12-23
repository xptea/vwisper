import { useEffect, useRef } from "react";
import { VoiceInput } from "../components/voice-input";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useSpeechToText } from "../hooks/use-speech-to-text";

export default function VoiceScreem() {
  const { isListening, transcript, start, stop, clear } = useSpeechToText({
    continuous: true,
  });

  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const hasTypedRef = useRef(false);

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const text = queueRef.current.shift();
      if (text) {
        try {
          const textToSend = hasTypedRef.current ? " " + text : text;
          console.info("[voice] sending transcript to backend", textToSend);
          await invoke("process_text", { text: textToSend });
          hasTypedRef.current = true;
        } catch (error) {
          console.error("Failed to type text:", error);
        }
      }
    }
    processingRef.current = false;
  };

  useEffect(() => {
    if (transcript) {
      const cleanTranscript = transcript.replace(/[\n\r]+/g, " ").trim();
      if (cleanTranscript) {
        console.info("[voice] transcript received", cleanTranscript);
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
      unlistenStart = await listen("start-listening", () => {
        hasTypedRef.current = false;
        console.info("[voice] start-listening event");
        start();
      });

      unlistenStop = await listen("stop-listening", () => {
        console.info("[voice] stop-listening event");
        stop();
      });

      try {
        const state = await invoke<boolean>("get_listening_state");
        if (state) {
          start();
        }
      } catch (error) {
        console.error("Failed to get listening state:", error);
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
