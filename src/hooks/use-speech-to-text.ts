import { useState, useRef, useEffect, useCallback } from "react";

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
    length: number;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    grammar: SpeechGrammarList;
    serviceURI: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onspeechstart: (() => void) | null;
    onspeechend: (() => void) | null;
    onnomatch: (() => void) | null;
    onaudiostart: (() => void) | null;
    onaudioend: (() => void) | null;
    onsoundstart: (() => void) | null;
    onsoundend: (() => void) | null;
}

interface SpeechGrammarList {
    length: number;
    item(index: number): SpeechGrammar;
    addFromURI(src: string, weight?: number): void;
    addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
    src: string;
    weight: number;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
        SpeechGrammarList: new () => SpeechGrammarList;
        webkitSpeechGrammarList: new () => SpeechGrammarList;
    }
}

interface UseSpeechToTextOptions {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
    serviceURI?: string;
}

export const useSpeechToText = (options: UseSpeechToTextOptions = {}) => {
    const {
        lang = "en-US",
        continuous = true,
        interimResults = true,
        maxAlternatives = 1,
        serviceURI = "",
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const lastResultIndexRef = useRef(0);
    const committedWordCountRef = useRef(0);
    const shouldRestartRef = useRef(false);

    // Initialize recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = continuous;
            recognitionRef.current.interimResults = interimResults;
            recognitionRef.current.lang = lang;
            recognitionRef.current.maxAlternatives = maxAlternatives;
            if (serviceURI) {
                recognitionRef.current.serviceURI = serviceURI;
            }
        }
    }, [lang, continuous, interimResults, maxAlternatives, serviceURI]);

    const start = useCallback(() => {
        if (!recognitionRef.current) return;

        try {
            // Reset state on start
            setError(null);
            // setTranscript(""); // Optional: decide if we clear on start
            // setInterimTranscript("");

            const recognition = recognitionRef.current;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
                if (shouldRestartRef.current) {
                    shouldRestartRef.current = false;
                    setTimeout(() => recognition.start(), 100);
                }
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                setError(`Error: ${event.error}`);
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const currentResultIndex = event.resultIndex;
                const result = event.results[currentResultIndex];
                const text = result[0].transcript;
                const words = text.trim().split(/\s+/).filter(Boolean);

                // Reset tracker if we've moved to a new sentence/result index
                if (currentResultIndex !== lastResultIndexRef.current) {
                    lastResultIndexRef.current = currentResultIndex;
                    committedWordCountRef.current = 0;
                }

                if (result.isFinal) {
                    // Commit all remaining words in the sentence
                    const newWords = words.slice(committedWordCountRef.current);
                    if (newWords.length > 0) {
                        setTranscript((prev) => {
                            const newSegment = newWords.join(" ");
                            return prev ? `${prev} ${newSegment}` : newSegment;
                        });
                    }
                    committedWordCountRef.current = 0;
                    setInterimTranscript("");
                } else {
                    // Interim: Commit all words EXCEPT the last one (which is still changing/being typed)
                    // We only commit words that are "pushed out" by new words (followed by space).
                    if (words.length > committedWordCountRef.current + 1) {
                        const wordsToCommit = words.slice(committedWordCountRef.current, words.length - 1);
                        setTranscript((prev) => {
                            const newSegment = wordsToCommit.join(" ");
                            return prev ? `${prev} ${newSegment}` : newSegment;
                        });
                        committedWordCountRef.current += wordsToCommit.length;
                    }

                    // Show the purely unstable part in interim
                    // The unstable part is the words we haven't committed yet (usually the last word)
                    const unstableWords = words.slice(committedWordCountRef.current);
                    setInterimTranscript(unstableWords.join(" "));
                }
            };

            recognition.start();
        } catch (err) {
            setError(`Failed to start: ${err}`);
        }
    }, []);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const clear = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        start,
        stop,
        clear,
        isSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
};
